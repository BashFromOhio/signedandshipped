/* Signed & Shipped — game engine */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const frag = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
  const strip = s => s.replace(/[.\s]+$/, "");

  /* ---------- state ---------- */
  const KEY = "signed-shipped-v2";
  const blank = () => ({ xp: 0, journey: {}, quiz: { best: 0, seen: {} }, drills: {}, bugs: {}, pipe: 0, states: {}, roll: {}, cards: {}, iq: {}, walk: {}, star: {}, bp: {}, seenIntro: false, gen: { quiz: [], drills: [], bugs: [], cards: [] }, gdr: {}, gbug: {} });
  let S = blank();
  try { const saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) { S = Object.assign(blank(), saved); S.gen = Object.assign(blank().gen, S.gen || {}); } } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  const RANKS = [[0, "Unsigned Build"], [150, "Debug APK"], [450, "Internal Track"], [900, "TestFlight"], [1500, "Phased Release"], [2300, "Production"]];
  function rankOf(xp) {
    let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
    const floor = RANKS[i][0], next = RANKS[i + 1] ? RANKS[i + 1][0] : null;
    return { i, name: RANKS[i][1], floor, next, nextName: RANKS[i + 1] ? RANKS[i + 1][1] : null, pct: next ? (xp - floor) / (next - floor) : 1 };
  }
  function addXP(n, why) {
    if (n <= 0) return;
    const before = rankOf(S.xp).i;
    S.xp += n; save(); renderPlayer();
    const r = rankOf(S.xp);
    toast(`+${n} XP · ${why}` + (r.i > before ? ` — promoted to ${r.name}` : ""));
  }
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false; t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function renderPlayer() {
    const r = rankOf(S.xp);
    $("#rankName").textContent = r.name;
    $("#xpNum").textContent = S.xp;
    $("#xpNext").textContent = r.next ? `${r.next - S.xp} to ${r.nextName}` : "max rank";
    $("#xpFill").style.width = Math.round(r.pct * 100) + "%";
  }

  /* ---------- counts ---------- */
  const count = o => Object.keys(o).length;
  const journeyDone = () => JOURNEY.filter(s => S.journey[s.id]).length;
  const drillsDone = () => count(S.drills);
  const priDone = () => DRILLS.filter(d => d.pri && S.drills[d.n] != null).length;

  /* ---------- reusable multiple-choice ---------- */
  function mcq(host, item, onDone) {
    const order = shuffle(item.o.map((t, i) => ({ t, ok: i === 0 })));
    const box = frag(`<div class="mcq">
      ${item.label ? `<div class="eyebrow">${esc(item.label)}</div>` : ""}
      <p class="q">${esc(item.q)}</p>
      <div class="opts"></div>
      <div class="verdict" hidden></div>
    </div>`);
    const opts = $(".opts", box);
    let misses = 0, done = false;
    const limit = Math.min(2, order.length - 1);
    order.forEach((o, i) => {
      const b = frag(`<button type="button" class="opt"><span class="key">${"ABCD"[i]}</span><span class="txt">${esc(o.t)}</span></button>`);
      b.addEventListener("click", () => {
        if (done) return;
        if (o.ok) { b.classList.add("right"); finish(true); }
        else {
          b.classList.add("wrong"); b.disabled = true; misses++;
          if (misses >= limit) { $$(".opt", opts).forEach((x, k) => { if (order[k].ok) x.classList.add("reveal"); }); finish(false); }
        }
      });
      opts.appendChild(b);
    });
    function finish(found) {
      done = true; $$(".opt", opts).forEach(x => (x.disabled = true));
      const pts = found ? (misses === 0 ? 2 : 1) : 0;
      const v = $(".verdict", box);
      const label = pts === 2 ? "Nailed it" : pts === 1 ? "Got there" : "Here's the answer";
      v.className = "verdict " + (pts === 2 ? "good" : pts === 1 ? "mid" : "low");
      v.innerHTML = `<div class="vtop"><strong>${label}</strong><span class="pts">${pts}/2</span></div>
        <p>${esc(item.w)}</p>
        ${item.a ? `<p class="analogy"><span>Like you're 10</span>${esc(item.a)}</p>` : ""}
        <button type="button" class="btn primary cont">Continue</button>`;
      v.hidden = false;
      const c = $(".cont", v);
      c.addEventListener("click", () => { c.disabled = true; c.hidden = true; onDone(pts); }, { once: true });
      c.focus({ preventScroll: true });
      v.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    }
    host.appendChild(box);
    return box;
  }

  function copyText(text, btn) {
    const done = () => { const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1400); };
    try {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackSelect(btn));
    } catch (e) { fallbackSelect(btn); }
  }
  function fallbackSelect(btn) {
    const pre = btn.closest(".copyable")?.querySelector("pre, .copysrc");
    if (pre) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected — press copy"; }
  }

  /* =========================================================
     AI — asks Claude on the viewer's own Claude account (no API key in the page)
     ========================================================= */
  let SAMPLE; // undefined: checking · null: unavailable · function: ready
  let aiBlocked = false;
  const AI_ICON = '<span class="ai-ico" aria-hidden="true">✦</span>';
  function aiState() { if (aiBlocked) return "blocked"; if (SAMPLE === undefined) return "checking"; return SAMPLE ? "on" : "off"; }
  function applyAiBtn(b) {
    const st = aiState();
    b.disabled = st === "checking" || st === "blocked";
    b.title = st === "on" ? "" : st === "checking" ? "Connecting to Claude…" : st === "blocked" ? "AI was declined for this page. Reload to be asked again." : "Builds the prompt so you can run it in Claude";
  }
  function syncAI() { document.documentElement.dataset.ai = aiState(); $$(".aibtn").forEach(applyAiBtn); }
  (function initAI() {
    const c = window.claude;
    if (!c || typeof c.use !== "function") { SAMPLE = null; setTimeout(syncAI, 0); return; }
    Promise.resolve(c.use("sample")).then(s => { SAMPLE = s || null; syncAI(); }, () => { SAMPLE = null; syncAI(); });
  })();
  function aiErr(e) {
    const c = e && e.code;
    if (!c) return (e && e.message) || "Something went wrong. Try again.";
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(c)) { aiBlocked = true; syncAI(); return "AI isn't available for this page right now. Everything else still works."; }
    if (c === "cancelled") return "";
    if (c === "rate_limited") return "Claude is busy or you've reached a usage limit. Try again in a little while.";
    if (c === "session_expired") return "Sign in to Claude again, then try.";
    if (c === "refused") return "Claude declined that request. Try rephrasing it.";
    if (c === "invalid_json") return "The answer came back in the wrong shape. Try again.";
    if (c === "prompt_too_large") return "That's too much text at once. Shorten your answer and try again.";
    return "Couldn't reach Claude. Try again.";
  }
  function mdLite(t) {
    const lines = esc(t).split("\n"); let html = "", list = false;
    for (const raw of lines) {
      const l = raw.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
      const m = l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
      if (m) { if (!list) { html += "<ul>"; list = true; } html += `<li>${m[1]}</li>`; continue; }
      if (list) { html += "</ul>"; list = false; }
      const h = l.match(/^#{1,4}\s+(.*)/);
      if (h) { html += `<h4>${h[1]}</h4>`; continue; }
      if (l.trim()) html += `<p>${l}</p>`;
    }
    if (list) html += "</ul>";
    return html;
  }
  const AI_CONTEXT = `You are a senior mobile release engineer coaching someone for a Senior Mobile DevOps Engineer interview (iOS/Android CI/CD, Fastlane, Xcode, Gradle, code signing, GitHub Actions, release coordination, observability, incident response). The learner builds two fictional portfolio labs: RouteReady (SwiftUI iOS + Kotlin Android, Java Spring Boot API, synthetic school-bus GPS telemetry) and StayReady (React Native TypeScript, FastAPI, two fictional vacation-rental tenants, Cedar Cove and Harbor House).
Facts you must respect:
- Apple phased release follows Apple's fixed 7-day schedule for automatic updates; it can be paused; users can still update manually. Google Play staged rollout uses percentages you choose and can be halted.
- Pausing or halting never removes an installed binary. Mitigations: remote feature flag off, compatible backend fix, replacement binary with a higher build number.
- App Center Build/Test/Distribute are retired. Upload is not the same as processed, tester-available, approved or released.
- Android: upload an AAB signed with the upload key; Google holds the app signing key (Play App Signing). A lost upload key means an upload key reset, not a new app signing key.
- iOS CI signing: macOS runner, fastlane setup_ci temporary keychain, match readonly, never regenerate or revoke team certificates in CI.
- Keep /api/v1 and make additive changes; app marketing version is independent of API version. Mobile and API releases are coordinated, not atomic. Database changes use expand/backfill/transition/contract.
- Promote the same tested artifact; never rebuild on retry or promotion. Build numbers come from one concurrency-safe, durable allocator per app/platform.
- Untrusted PR code runs on pull_request with read-only permissions and no secrets; never run PR code in pull_request_target. OIDC does not replace store credentials or signing keys.
- Tenant identity comes from server-side authenticated identity, never a client header.
- This is a portfolio lab: never invent production metrics, employers, outages, user counts or dollar figures.
Style: plain, direct, specific. Analogies must be something a 10-year-old would understand.`;

  // A reusable AI control: a button (optionally with a text input) that streams or returns JSON.
  function aiBox(host, o) {
    const box = frag(`<div class="ai ${o.compact ? "compact" : ""}">
      <div class="ai-row">${o.input ? `<input type="text" class="ai-in" placeholder="${esc(o.input)}" aria-label="${esc(o.input)}">` : ""}
        <button type="button" class="aibtn">${AI_ICON}${esc(o.label)}</button>
        <button type="button" class="btn small ghost ai-stop" hidden>Stop</button></div>
      ${o.sub ? `<p class="ai-sub">${esc(o.sub)}</p>` : ""}
      <p class="ai-note" hidden></p>
      <div class="ai-out" hidden></div></div>`);
    const btn = $(".aibtn", box), stop = $(".ai-stop", box), out = $(".ai-out", box), note = $(".ai-note", box), inp = $(".ai-in", box);
    applyAiBtn(btn);
    let ctl;
    stop.addEventListener("click", () => ctl && ctl.abort());
    async function run() {
      if (btn.disabled) return;
      const s = SAMPLE;
      const val = inp ? inp.value.trim() : "";
      if (inp && !val && !o.optional) { inp.focus(); return; }
      let p;
      try { p = o.prompt(val); } catch (err) { note.textContent = err.message; note.hidden = false; return; }
      if (!p) return;
      if (!s) { offline(p); return; }
      ctl = new AbortController();
      btn.disabled = true; stop.hidden = false; note.hidden = true;
      out.hidden = false; out.className = "ai-out"; out.innerHTML = `<span class="ai-think">Thinking…</span>`;
      const opts = { signal: ctl.signal, modelTier: o.tier || "default" };
      if (o.cache === false) opts.cache = false;
      try {
        if (o.json) {
          const data = await s.json(p, opts);
          out.innerHTML = "";
          o.onJSON(data, out, box);
        } else {
          opts.onText = ({ text }) => { out.innerHTML = mdLite(text); };
          const r = await s(p, opts);
          out.innerHTML = mdLite(r.text);
          if (r.truncated) { note.textContent = "Cut short. Ask something narrower for a complete answer."; note.hidden = false; }
        }
        out.insertAdjacentHTML("beforeend", `<p class="ai-tag">${AI_ICON}AI-generated. Check it against the playbook before you rely on it.</p>`);
      } catch (e) {
        const msg = aiErr(e);
        if (e && e.code && e.text && e.code !== "refused" && !o.json) out.innerHTML = mdLite(e.text);
        else out.hidden = true;
        if (msg) { note.textContent = msg; note.hidden = false; }
      } finally { stop.hidden = true; applyAiBtn(btn); }
    }
    function offline(p) {
      const url = "https://claude.ai/new?q=" + encodeURIComponent(p);
      out.hidden = false; note.hidden = true;
      out.innerHTML = `<p><b>Run this in Claude.</b> AI answers need Claude, which this copy of the page can't reach. Copy the prompt, or open it in Claude directly.</p>
        <div class="row" style="margin-top:4px"><button type="button" class="btn small primary" data-cp>Copy prompt</button>${url.length < 7500 ? `<a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">Open in Claude ↗</a>` : `<span class="sub">Prompt is long: copy it, then paste into Claude.</span>`}</div>
        <details class="ai-prompt"><summary>Show prompt</summary><pre class="copysrc">${esc(p)}</pre></details>`;
      const cp = out.querySelector("[data-cp]"); cp.addEventListener("click", () => copyText(p, cp));
    }
    btn.addEventListener("click", run);
    if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); run(); } });
    host.appendChild(box);
    return box;
  }
  const str = (x, max = 2000) => typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null;
  const strArr = (x, min, max) => Array.isArray(x) && x.length >= min && x.every(y => typeof y === "string" && y.trim()) ? x.slice(0, max).map(y => y.trim()) : null;
  function renderFeedback(out, f) {
    const sc = Number.isFinite(+f.score) ? Math.max(0, Math.min(2, Math.round(+f.score))) : null;
    out.innerHTML = `
      ${sc != null ? `<div class="fb-top"><span class="fb-score s${sc}">${sc}/2</span><b>${esc(str(f.verdict, 200) || "")}</b></div>` : str(f.verdict) ? `<p><b>${esc(f.verdict)}</b></p>` : ""}
      ${Array.isArray(f.strengths) && f.strengths.length ? `<div class="fb-k ok">What you got right</div><ul>${f.strengths.slice(0, 6).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${Array.isArray(f.missing) && f.missing.length ? `<div class="fb-k miss">What to add</div><ul>${f.missing.slice(0, 6).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${str(f.better) ? `<div class="fb-k">A stronger version</div><p class="fb-better">${esc(f.better)}</p>` : ""}`;
  }
  const FEEDBACK_SHAPE = `Reply with only one JSON object: {"score": 0|1|2, "verdict": "one short sentence", "strengths": ["..."], "missing": ["..."], "better": "a stronger answer in 2-4 sentences, first person, honest about it being a portfolio lab"}. Score 2 = senior-level and correct, 1 = partly right, 0 = wrong or unsafe. Be specific and kind, never vague.`;

  function validDrill(x) {
    if (!x || typeof x !== "object") throw new Error("The drill came back incomplete. Try again.");
    const stage = s => s && str(s.q) && strArr(s.o, 3, 4) && str(s.w) ? { q: str(s.q), o: strArr(s.o, 3, 4), w: str(s.w) } : null;
    const s = Array.isArray(x.s) ? x.s.slice(0, 4).map(stage) : [];
    const xx = x.x && str(x.x.t) ? { t: str(x.x.t), ...stage(x.x) } : null;
    if (!str(x.t) || s.length !== 4 || s.some(y => !y) || !xx || !xx.q || !x.f || !str(x.f.q) || !str(x.f.a) || !strArr(x.log, 3, 12)) throw new Error("The drill came back incomplete. Try again.");
    const cats = Object.keys(TASKS);
    return { t: str(x.t, 80), p: ["RouteReady", "StayReady", "Either"].includes(x.p) ? x.p : "Either", c: cats.includes(x.c) ? x.c : "Operate",
      inj: str(x.inj, 200) || "injected a failure", an: str(x.an, 300) || "", sym: str(x.sym, 300) || "", logT: str(x.logT, 120) || "lab log",
      log: strArr(x.log, 3, 12), s, x: xx, f: { q: str(x.f.q), a: str(x.f.a) }, ai: true };
  }
  function validBug(x) {
    const l = strArr((x && x.l || []).map(y => typeof y === "string" ? (y || " ") : ""), 4, 22);
    if (!x || !str(x.t) || !l || !x.b || typeof x.b !== "object") throw new Error("The file came back incomplete. Try again.");
    const b = {};
    for (const [k, v] of Object.entries(x.b)) { const i = parseInt(k, 10); if (Number.isInteger(i) && i >= 0 && i < l.length && str(v) && l[i].trim()) b[i] = str(v, 400); }
    const n = Object.keys(b).length;
    if (n < 1 || n > 4) throw new Error("The file's bug list didn't line up. Try again.");
    return { id: "g" + Date.now().toString(36), t: str(x.t, 80), f: str(x.f, 80) || "generated/file", jd: str(x.jd, 40) || "AI drill", an: str(x.an, 300) || "", l, b, fix: strArr(x.fix, 1, 30) || ["(no fix provided)"], ai: true };
  }
  const drillShape = () => `Reply with only one JSON object of exactly this shape:
{"t": "short title", "p": "RouteReady" | "StayReady" | "Either", "c": one of ${JSON.stringify(Object.keys(TASKS))},
 "inj": "what was injected, past tense, starting lower-case, e.g. 'pointed the package lane at the wrong keystore'",
 "an": "one-sentence analogy a 10-year-old gets",
 "sym": "the symptom in one sentence",
 "logT": "log title, e.g. 'release-ios #301 · fastlane ios package'",
 "log": ["6 to 8 realistic, redacted log lines; mask secrets as ●●●●"],
 "s": [four stages in this order: Hypothesis, Next diagnostic, Contain & fix, Verify. Each {"q": "question", "o": ["CORRECT option", "plausible wrong option", "plausible wrong option"], "w": "one sentence on why the correct option is right"}],
 "x": {"t": "a complication that arrives mid-incident", "q": "question", "o": ["CORRECT", "wrong", "wrong"], "w": "why"},
 "f": {"q": "a senior follow-up question", "a": "a strong 2-4 sentence answer"}}
Rules: the FIRST option in every "o" array is the correct one. Wrong options are mistakes real engineers make. Use real commands and tools (xcodebuild, xcrun, security, fastlane, ./gradlew, keytool, bundletool, gh, kubectl, docker, jq). Keep each option under 200 characters.`;

  /* ---------- router ---------- */
  let timers = [];
  let pendingDrill = null, pendingBug = null;
  const VIEWS = {
    home: ["Base", viewHome],
    dayone: ["Day One", viewDayOne],
    journey: ["Journey", viewJourney],
    board: ["Board", viewBoard],
    quiz: ["Myth Busters", viewQuiz],
    drills: ["Incident Drills", viewDrills],
    bugs: ["Bug Hunt", viewBugs],
    gates: ["Pipeline Gates", viewGates],
    states: ["Release States", viewStates],
    rollback: ["Rollback Lab", viewRollback],
    blueprints: ["Blueprints", viewBlueprints],
    cards: ["Terms", viewCards],
    sprints: ["Sprints", viewSprints],
    docs: ["Docs", viewDocs],
    interview: ["Interview Room", viewInterview],
    repo: ["Reference Repo", viewRepo]
  };
  function buildNav() {
    const nav = $("#nav");
    nav.innerHTML = Object.entries(VIEWS).map(([k, [label]]) => `<a href="#${k}" data-r="${k}">${esc(label)}</a>`).join("");
  }
  function route() {
    timers.forEach(clearInterval); timers = [];
    let r = location.hash.replace(/^#/, "");
    if (!VIEWS[r]) r = "home";
    $$("#nav a").forEach(a => a.setAttribute("aria-current", a.dataset.r === r ? "page" : "false"));
    const cur = $(`#nav a[data-r="${r}"]`); if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
    const v = $("#view"); v.innerHTML = ""; v.dataset.view = r;
    VIEWS[r][1](v);
    window.scrollTo(0, 0);
  }
  const go = r => { if (location.hash === "#" + r) route(); else location.hash = r; };

  /* =========================================================
     HOME
     ========================================================= */
  function planProgress() {
    const cards = Math.min(count(S.cards), 15), bp = Math.min(count(S.bp || {}), DIAGRAMS.length);
    return [
      { d: cards + bp, of: 15 + DIAGRAMS.length },
      { d: journeyDone(), of: JOURNEY.length },
      { d: Math.min(S.quiz.best, 8), of: 8 },
      { d: S.pipe + count(S.states) * 4 + count(S.roll) * 2, of: PIPE.length + 8 + ROLLBACK.length * 2 },
      { d: count(S.bugs), of: BUGS.length },
      { d: drillsDone(), of: 20 },
      { d: Math.min(count(S.iq), IQ.length) + (S.star.built ? 3 : 0) + (count(S.walk) ? 3 : 0), of: IQ.length + 6 }
    ];
  }
  function currentStep() { const i = planProgress().findIndex(p => p.d < p.of); return i === -1 ? 7 : i + 1; }
  function nextStep() {
    const n = currentStep(), st = PLAN[n - 1];
    const lab = t => `Step ${n}: ${t}`;
    if (n === 1 && ONBOARD.some((o, i) => !(S.setup || {})["ob:" + i])) return { label: "Start Day One: you've just been hired", r: "dayone", step: 1 };
    if (n === 1) return count(S.cards) < 15 ? { label: lab("learn the words"), r: "cards", step: n } : { label: lab("open the Blueprints"), r: "blueprints", step: n };
    if (n === 2) { const s = JOURNEY.find(x => !S.journey[x.id]); return { label: lab(s ? `Journey, ${s.title}` : st.t), r: "journey", step: n }; }
    if (n === 4) return { label: lab(st.t), r: S.pipe < PIPE.length ? "gates" : count(S.states) < 2 ? "states" : "rollback", step: n };
    if (n === 6) {
      const d = DRILLS.find(x => x.pri && S.drills[x.n] == null) || DRILLS.find(x => S.drills[x.n] == null);
      if (d) return { label: lab(`drill ${d.n}, ${d.t}`), r: "drills", drill: d.n, step: n };
    }
    return { label: lab(st.t), r: st.modes[0][0], step: n };
  }
  function goStep(ns) { if (ns.drill) pendingDrill = ns.drill; go(ns.r); }

  /* ---------- welcome popup ---------- */
  let introSlide = 0;
  function openIntro(start = 0) {
    const dlg = $("#intro");
    introSlide = start;
    renderIntro();
    try { if (!dlg.open) dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
  }
  function closeIntro() {
    const dlg = $("#intro");
    if (!S.seenIntro) { S.seenIntro = true; save(); }
    try { dlg.close(); } catch (e) { dlg.removeAttribute("open"); }
  }
  function phaseRange(ph) {
    const idx = JOURNEY.map((s, i) => s.phase === ph.id ? i + 1 : null).filter(Boolean);
    return idx.length > 1 ? `Stations ${idx[0]}–${idx[idx.length - 1]}` : `Station ${idx[0]}`;
  }
  function renderIntro() {
    const dlg = $("#intro");
    const pp = planProgress(), cur = currentStep(), ns = nextStep();
    const slides = [
      { k: "Welcome", body: `
        <div class="eyebrow">Mobile DevOps interview trainer</div>
        <h2 id="introTitle" class="in-title">Signed <span class="amp">&amp;</span> Shipped</h2>
        <p class="in-lede">You've just been hired as RouteReady's Mobile DevOps engineer. Day One gets your computer and access set up; after that, your lead hands you tickets in the order they'd really arrive, from pinning tools to handling your first on-call page. No install is needed to play.</p>
        <div class="in-grid">
          <div><b>16</b><span>Journey stations, code to customer</span></div>
          <div><b>20</b><span>incident drills with STAR stories</span></div>
          <div><b>12</b><span>broken files to bug-hunt</span></div>
          <div><b>28</b><span>myth-busting questions</span></div>
        </div>
        <div class="in-road" aria-label="The five phases">${PHASES.map((p, i) => `<span><i>${i + 1}</i>${esc(p.name)}</span>`).join("")}</div>
        <p class="in-note">Every concept comes with a "like I'm 10" analogy. Progress saves in this browser. Rank climbs from <b>Unsigned Build</b> to <b>Production</b>.</p>` },
      { k: "Game plan", body: `
        <div class="eyebrow">How to tackle this</div>
        <h2 id="introTitle" class="in-h">Seven steps, in this order</h2>
        <ol class="in-plan">${PLAN.map((s, i) => `<li class="${i + 1 < cur ? "done" : i + 1 === cur ? "now" : ""}">
          <span class="ip-n">${s.n}</span>
          <div><b>${esc(s.t)}</b><p>${esc(s.what)}</p><small>Done when: ${esc(s.done)} · ${pp[i].d}/${pp[i].of}</small></div></li>`).join("")}</ol>` },
      { k: "The 5 phases", body: `
        <div class="eyebrow">The real pipeline, explained</div>
        <h2 id="introTitle" class="in-h">Five phases, sixteen stations</h2>
        <div class="in-phases">${PHASES.map((p, i) => `<section>
          <div class="ph-line"><span class="ph-i">${i + 1}</span><b>${esc(p.name)}</b><span class="ph-r">${phaseRange(p)}</span></div>
          <p>${esc(p.why)}</p>
          <p class="in-an"><span>Like I'm 10</span>${esc(p.analogy)}</p>
          <ol class="in-st" start="${JOURNEY.findIndex(s => s.phase === p.id) + 1}">${JOURNEY.filter(s => s.phase === p.id).map(s => `<li>${esc(s.title)}</li>`).join("")}</ol>
          <p class="in-ask"><span>They'll ask</span>${esc(p.ask)}</p>
        </section>`).join("")}</div>` },
      { k: "Start", body: `
        <div class="eyebrow">Before you start</div>
        <h2 id="introTitle" class="in-h">How it scores, and how to talk about it</h2>
        <ul class="in-rules">
          <li><b>2 points</b> for a first-try answer, <b>1</b> for a second try, <b>0</b> if the answer is revealed. Every answer explains why.</li>
          <li>Drills score out of <b>10</b>. 8 or more marks them <b>VERIFIED</b>, like the status you'd record in your real repo.</li>
          <li>Journey stations unlock in order. You can't skip to signing before you understand PR CI.</li>
          <li>This is a <b>portfolio lab</b> with fictional companies and synthetic data. In the interview, say "in my RouteReady lab", never imply you shipped it at an employer.</li>
        </ul>
        <div class="in-cta">
          <button type="button" class="btn primary big-cta" id="introGo">${esc(cur === 1 && !count(S.cards) ? "Start step 1: learn the words" : ns.label)}</button>
          <span class="sub">You can reopen this guide anytime from <b>Guide</b> at the top.</span>
        </div>` }
    ];
    const s = slides[introSlide];
    dlg.innerHTML = `
      <div class="in-wrap">
        <div class="in-top">
          <div class="in-tabs" role="tablist">${slides.map((x, i) => `<button type="button" role="tab" aria-selected="${i === introSlide}" class="in-tab ${i === introSlide ? "on" : ""}" data-s="${i}"><span>${i + 1}</span>${esc(x.k)}</button>`).join("")}</div>
          <button type="button" class="in-x" id="introX" aria-label="Close guide">✕</button>
        </div>
        <div class="in-body">${s.body}</div>
        <div class="in-foot">
          <button type="button" class="btn ghost" id="introBack" ${introSlide === 0 ? "disabled" : ""}>← Back</button>
          <span class="in-dots">${slides.map((x, i) => `<i class="${i === introSlide ? "on" : ""}"></i>`).join("")}</span>
          ${introSlide < slides.length - 1 ? `<button type="button" class="btn primary" id="introNext">Next →</button>` : `<button type="button" class="btn" id="introSkip">Just explore</button>`}
        </div>
      </div>`;
    dlg.setAttribute("aria-labelledby", "introTitle");
    $$(".in-tab", dlg).forEach(b => b.addEventListener("click", () => { introSlide = +b.dataset.s; renderIntro(); }));
    $("#introX", dlg).addEventListener("click", closeIntro);
    $("#introBack", dlg).addEventListener("click", () => { introSlide--; renderIntro(); });
    const nx = $("#introNext", dlg); if (nx) nx.addEventListener("click", () => { introSlide++; renderIntro(); });
    const sk = $("#introSkip", dlg); if (sk) sk.addEventListener("click", closeIntro);
    const gb = $("#introGo", dlg); if (gb) gb.addEventListener("click", () => { closeIntro(); goStep(ns); });
    $(".in-body", dlg).scrollTop = 0;
  }
  function viewHome(v) {
    const r = rankOf(S.xp);
    const status = S.xp < 450 ? "uploaded" : S.xp < 900 ? "processing" : S.xp < 1500 ? "internal_testing" : S.xp < 2300 ? "phased_release" : "released";
    const ns = nextStep();
    const kv = (k, val, cls = "") => `<div><span class="k">"${k}"</span>: <span class="v ${cls}">${typeof val === "number" ? val : '"' + esc(val) + '"'}</span>,</div>`;
    v.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Mobile DevOps interview trainer · RouteReady + StayReady labs</div>
        <h1>Signed <span class="amp">&amp;</span> Shipped</h1>
        <p class="lede">Learn the whole road from a line of code to an app on someone's phone, in the order it really happens. Every station has a plain-language analogy, the real commands, the job-description skill it proves, and a checkpoint. Then break things on purpose in 20 incident drills and turn each one into a STAR interview story.</p>
        <div class="row">
          <button type="button" class="btn primary" id="goNext">${esc(ns.label)}</button>
          <a class="btn" href="#interview">Interview Room</a>
        </div>
      </div>
      <figure class="manifest" aria-label="Your progress as a release manifest">
        <figcaption><span>evidence/player-manifest.json</span><span class="pill">${esc(status.toUpperCase())}</span></figcaption>
        <pre>{
${kv("application_id", "dev.lab.signed-and-shipped")}${kv("rank", r.name, "acc")}${kv("xp", S.xp)}${kv("build_number", 100 + journeyDone() + drillsDone() + count(S.bugs))}${kv("journey_stations", `${journeyDone()}/${JOURNEY.length}`)}${kv("drills_verified", `${drillsDone()}/20`)}${kv("priority_drills", `${priDone()}/6`)}${kv("bugs_fixed", `${count(S.bugs)}/${BUGS.length}`)}${kv("myth_busters_best", `${S.quiz.best}/10`)}<div><span class="k">"distribution_status"</span>: <span class="v acc">"${status}"</span></div>}</pre>
      </figure>
    </section>

    <section class="block">
      <div class="block-head"><h2>Your game plan</h2><button type="button" class="more linkbtn" id="openGuide">Open the guide →</button></div>
      <ol class="plan">${PLAN.map((s, i) => {
        const p = planProgress()[i], cur = currentStep(), st = p.d >= p.of ? "done" : s.n === cur ? "now" : "later";
        return `<li class="pl ${st}">
          <span class="pl-n">${s.n}</span>
          <div class="pl-body">
            <div class="pl-top"><b>${esc(s.t)}</b><span class="pill ${st === "done" ? "verified" : st === "now" ? "implemented" : "pending"}">${st === "done" ? "DONE" : st === "now" ? "YOU ARE HERE" : "UP NEXT"}</span></div>
            <p>${esc(s.what)}</p>
            <p class="pl-an"><span>Like I'm 10</span>${esc(s.an)}</p>
            <div class="pl-foot"><span class="pl-bar"><i style="width:${Math.round(p.d / p.of * 100)}%"></i></span><span class="pl-done">${esc(s.done)} · ${p.d}/${p.of}</span></div>
            <div class="pl-modes">${s.modes.map(([r, l]) => `<a class="btn small ${st === "now" ? "primary" : "ghost"}" href="#${r}">${esc(l)}</a>`).join("")}</div>
          </div></li>`;
      }).join("")}</ol>
    </section>

    <section class="block">
      <div class="block-head"><h2>The 5 phases, code to customer</h2><a href="#journey" class="more">Open the Journey →</a></div>
      <div class="phases">${PHASES.map((ph, i) => {
        const st = JOURNEY.filter(s => s.phase === ph.id), d = st.filter(s => S.journey[s.id]).length;
        const first = JOURNEY.findIndex(s => s.phase === ph.id) + 1;
        return `<a class="phase" href="#journey">
          <div class="ph-top"><span class="ph-name"><span class="ph-i">${i + 1}</span>${esc(ph.name)}</span><span class="ph-n">${d}/${st.length}</span></div>
          <div class="ticks">${st.map(s => `<i class="${S.journey[s.id] ? "on" : ""}" title="${esc(s.title)}"></i>`).join("")}</div>
          <p class="ph-why">${esc(ph.why)}</p>
          <ol class="ph-list" start="${first}">${st.map(s => `<li class="${S.journey[s.id] ? "on" : ""}">${esc(s.title)}</li>`).join("")}</ol>
          <p class="ph-ask"><span>They'll ask</span>${esc(ph.ask)}</p></a>`;
      }).join("")}</div>
    </section>

    <section class="block">
      <div class="block-head"><h2>Interview priority drills</h2><span class="sub">The playbook says to master these six first.</span></div>
      <div class="pri">${DRILLS.filter(d => d.pri).map(d => drillCard(d)).join("")}</div>
    </section>

    <section class="block">
      <div class="block-head"><h2>Training modes</h2></div>
      <div class="modes">${[
        ["journey", "Journey", "16 stations, code to customer, in order", `${journeyDone()}/${JOURNEY.length}`],
        ["quiz", "Myth Busters", "Rounds of 10. Fix what the old articles got wrong", `best ${S.quiz.best}/10`],
        ["drills", "Incident Drills", "Symptom + log → hypothesis, command, fix, verify", `${drillsDone()}/20`],
        ["bugs", "Bug Hunt", "Click the broken lines in real-looking YAML, Fastfiles and APIs", `${count(S.bugs)}/${BUGS.length}`],
        ["gates", "Pipeline Gates", "Sort work into PR, main, beta, promotion, nightly or never", `${S.pipe}/${PIPE.length}`],
        ["states", "Release States", "Put store states in order for iOS and Android", `${count(S.states)}/2`],
        ["rollback", "Rollback Lab", "Pick the right levers when something breaks", `${count(S.roll)}/${ROLLBACK.length}`],
        ["blueprints", "Blueprints", "Numbered diagrams with time, sprint and step-by-step explanations", `${count(S.bp)}/${DIAGRAMS.length}`],
        ["cards", "Terms", "Every term in pipeline order, tagged by tool and linked", `${count(S.cards)}/${CARDS.length}`],
        ["sprints", "Sprints", "Seven 2-week sprints with deliverables and exit tests", `${SPRINTS.length} sprints`],
        ["docs", "Docs", "Reference tables, cheat sheets and official links", "reference"],
        ["interview", "Interview Room", "Timed answers, STAR stories, 8-minute walkthrough", `${count(S.iq)}/${IQ.length}`],
        ["repo", "Reference Repo", "Workflows, Fastlane lanes, scripts and drill READMEs to clone", "76 files"]
      ].map(([k, n, d, p]) => `<a class="mode" href="#${k}"><span class="m-name">${n}</span><span class="m-desc">${d}</span><span class="m-prog">${p}</span></a>`).join("")}</div>
    </section>

    <section class="block">
      <div class="block-head"><h2>Ask your AI coach</h2><span class="sub">Uses Claude on your own account. Nothing to set up.</span></div>
      <div id="aiHome"></div>
    </section>

    <section class="block two">
      <div>
        <div class="block-head"><h2>What each mode proves (JD map)</h2></div>
        <div class="tablewrap"><table class="jd"><thead><tr><th>Job requirement</th><th>Portfolio evidence</th></tr></thead>
        <tbody>${JD.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table></div>
      </div>
      <aside class="honest">
        <h3>Say it honestly</h3>
        <p>Everything here is a portfolio lab with fictional organizations and synthetic data. In interviews, say "in my RouteReady lab" rather than implying you shipped it at an employer.</p>
        <p>Record each milestone as <b>IMPLEMENTED</b>, <b>VERIFIED</b>, <b>SIMULATED</b> or <b>BLOCKED</b>. A Fastfile on disk isn't a signed build. A simulator run isn't a store release.</p>
        <div class="reset">
          <button type="button" class="btn ghost" id="resetBtn">Reset progress</button>
          <span id="resetConfirm" hidden>Erase all XP and progress? <button type="button" class="btn danger" id="resetYes">Erase</button> <button type="button" class="btn ghost" id="resetNo">Keep</button></span>
        </div>
      </aside>
    </section>`;
    $("#goNext", v).addEventListener("click", () => goStep(ns));
    $("#openGuide", v).addEventListener("click", () => openIntro(1));
    const pp = planProgress();
    const progressText = () => PLAN.map((p, i) => `Step ${p.n} ${p.t}: ${pp[i].d}/${pp[i].of}`).join("; ") + `. Weak drills: ${DRILLS.filter(d => S.drills[d.n] != null && S.drills[d.n] < 8).map(d => d.t).join(", ") || "none yet"}. Not run: ${DRILLS.filter(d => S.drills[d.n] == null).length} drills.`;
    aiBox($("#aiHome", v), { label: "What should I study next?", tier: "default", cache: false,
      prompt: () => `${AI_CONTEXT}\n\nThe learner's progress in the training game: ${progressText()}\nThe game's 7-step plan is: ${PLAN.map(p => p.n + ". " + p.t).join("; ")}.\nGive a short study plan for their next session: 3 numbered actions in order, each one line naming the game mode and why. Then one sentence of encouragement that is specific, not generic. Under 140 words.` });
    aiBox($("#aiHome", v), { label: "Ask", input: "Ask anything about mobile DevOps, e.g. 'how does match readonly work?'", cache: false,
      prompt: q => `${AI_CONTEXT}\n\nThe learner asks: ${q}\nAnswer in under 200 words: a direct answer with correct terms, then a one-line analogy a 10-year-old would get, then one interview tip.` });
    bindDrillCards(v);
    $("#resetBtn", v).addEventListener("click", () => { $("#resetConfirm", v).hidden = false; });
    $("#resetNo", v).addEventListener("click", () => { $("#resetConfirm", v).hidden = true; });
    $("#resetYes", v).addEventListener("click", () => { S = blank(); save(); renderPlayer(); route(); toast("Progress reset"); });
  }

  function drillCard(d) {
    const best = d.ai ? S.gdr[d.n] : S.drills[d.n];
    const st = best == null ? "pending" : best >= 8 ? "verified" : "implemented";
    const stLabel = { pending: "NOT RUN", implemented: "IMPLEMENTED", verified: "VERIFIED" }[st];
    return `<button type="button" class="dcard" data-drill="${d.n}">
      <span class="dnum">${d.ai ? "AI" : String(d.n).padStart(2, "0")}</span>
      <span class="dtitle">${esc(d.t)}</span>
      <span class="dmeta"><span>${esc(d.p)}</span><span>${esc(d.c)}</span>${d.pri ? '<span class="star">priority</span>' : ""}</span>
      <span class="dfoot"><span class="pill ${st}">${stLabel}</span><span class="score">${best == null ? "–" : best}/10</span></span>
    </button>`;
  }
  function findDrill(n) { return DRILLS.find(x => x.n === n) || S.gen.drills.find(x => x.n === n); }
  function bindDrillCards(v) {
    $$(".dcard", v).forEach(b => b.addEventListener("click", () => { pendingDrill = +b.dataset.drill; go("drills"); }));
  }

  /* =========================================================
     JOURNEY
     ========================================================= */
  let journeyPos = null;
  function viewJourney(v) {
    const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]);
    const unlockedUpTo = firstOpen === -1 ? JOURNEY.length - 1 : firstOpen;
    if (journeyPos == null || journeyPos > unlockedUpTo) journeyPos = unlockedUpTo;
    const st = JOURNEY[journeyPos];
    const ph = PHASES.find(p => p.id === st.phase);
    v.innerHTML = `
      <header class="vhead">
        <div class="eyebrow">Journey · code to customer</div>
        <h1 class="vtitle">One commit's trip to a phone</h1>
        <p class="lede">Stations unlock in the real order. Pass a checkpoint to move on. This is the order you should narrate in an interview.</p>
      </header>
      <ol class="rail" aria-label="Journey stations">${JOURNEY.map((s, i) => {
        const locked = i > unlockedUpTo, done = !!S.journey[s.id];
        const phStart = i === 0 || JOURNEY[i - 1].phase !== s.phase;
        return `<li class="${phStart ? "phstart" : ""}" ${phStart ? `data-ph="${esc(PHASES.find(p => p.id === s.phase).name)}"` : ""}>
          <button type="button" class="stop ${done ? "done" : ""} ${i === journeyPos ? "cur" : ""}" data-i="${i}" ${locked ? "disabled" : ""} aria-label="Station ${i + 1}: ${esc(s.title)}${locked ? " (locked)" : ""}">
            <span class="sn">${i + 1}</span></button></li>`;
      }).join("")}</ol>
      <article class="station">
        <div class="st-head">
          <div><div class="eyebrow">${TICKETS[st.id] ? esc(TICKETS[st.id].id) + " · " : ""}Station ${journeyPos + 1} of ${JOURNEY.length} · ${esc(ph.name)} phase${(() => { const sp = SPRINTS.find(x => x.stations.includes(st.id)); return sp ? ` · Sprint ${sp.n} (${esc(sp.weeks)})` : ""; })()}</div><h2>${esc(st.title)}</h2></div>
          <div class="jdtags">${st.jd.map(j => `<span class="tag">${esc(j)}</span>`).join("")}</div>
        </div>
        ${issueHTML(st)}
        ${TICKETS[st.id] && TICKETS[st.id].needs.length ? `<details class="needs" ${TICKETS[st.id].needs.some(id => !(S.setup || {})["tool:" + id]) ? "open" : ""}><summary>What you need for this ticket (${TICKETS[st.id].needs.length} ${TICKETS[st.id].needs.length > 1 ? "tools" : "tool"})</summary><div class="toolgrid">${TICKETS[st.id].needs.map(id => toolCard(id, S.os || "mac")).join("")}</div></details>` : ""}
        <div class="st-grid">
          <div class="st-main">
            <h3>Background: what happens</h3><p>${esc(st.what)}</p>
            <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>${esc(st.analogy)}</p></div>
            ${st.pic ? `<h3>The picture</h3><div class="diagram mini">${flowSVG(DIAGRAMS.find(d => d.id === st.pic))}</div><p class="sub"><button type="button" class="linkbtn" data-bp="${st.pic}">Open the full blueprint: ${esc(DIAGRAMS.find(d => d.id === st.pic).t)} →</button> It explains every box in order.</p>` : ""}
            <h3>Done when</h3><p class="done-when">${esc(st.done)}</p>
            <div id="aiJ" class="ai-stack"></div>
          </div>
          <div class="st-side">
            <h3>Real commands &amp; config</h3>
            <div class="code small"><pre>${st.tools.map(t => esc(t)).join("\n")}</pre></div>
            ${(REPO_LINKS.stations[st.id] || []).length ? `<h3>Reference code</h3>${fileBtns(REPO_LINKS.stations[st.id])}` : ""}
            ${st.drills.length ? `<h3>Break it on purpose</h3><div class="minilinks">${st.drills.map(n => { const d = DRILLS.find(x => x.n === n); return `<button type="button" class="linkbtn" data-drill="${n}">Drill ${n}: ${esc(d.t)}</button>`; }).join("")}</div>` : ""}
          </div>
        </div>
        <div class="checkpoint"><div class="cp-k">Checkpoint</div><div id="cp"></div></div>
        <div class="st-nav">
          <button type="button" class="btn ghost" id="prevSt" ${journeyPos === 0 ? "disabled" : ""}>← Previous station</button>
          <button type="button" class="btn" id="nextSt" ${journeyPos >= unlockedUpTo || journeyPos === JOURNEY.length - 1 ? "disabled" : ""}>Next station →</button>
        </div>
      </article>`;
    $$(".stop", v).forEach(b => b.addEventListener("click", () => { journeyPos = +b.dataset.i; viewJourney(v); }));
    $$(".linkbtn[data-drill]", v).forEach(b => b.addEventListener("click", () => { pendingDrill = +b.dataset.drill; go("drills"); }));
    bindFileBtns(v);
    bindToolChecks(v, null);
    $$("[data-bp]", v).forEach(b => b.addEventListener("click", () => { bpTab = b.dataset.bp; go("blueprints"); }));
    $("#prevSt", v).addEventListener("click", () => { journeyPos--; viewJourney(v); });
    $("#nextSt", v).addEventListener("click", () => { journeyPos++; viewJourney(v); });
    aiBox($("#aiJ", v), { label: "Explain it another way",
      prompt: () => `${AI_CONTEXT}\n\nJourney station ${journeyPos + 1} of ${JOURNEY.length}: "${st.title}".\nWhat happens: ${st.what}\nThe learner already saw this analogy: ${st.analogy}\n\nExplain this station in three short labeled parts:\n**Like you're 10:** a NEW everyday analogy (not the one above), 2-3 sentences.\n**Interview answer:** what a senior engineer would say, 3-4 sentences, correct terms.\n**Gotcha:** one thing interviewers probe here, and the answer, 1-2 sentences.\nUnder 220 words. No preamble.` });
    aiBox($("#aiJ", v), { label: "Ask", input: "Ask about this station…", cache: false,
      prompt: q => `${AI_CONTEXT}\n\nThe learner is on Journey station "${st.title}": ${st.what}\nTheir question: ${q}\nAnswer in under 180 words: a direct answer, then a one-line analogy a 10-year-old would get.` });
    const cp = $("#cp", v);
    if (S.journey[st.id]) {
      cp.innerHTML = `<p class="cleared">Cleared. ${esc(st.check.w)}</p>`;
    } else {
      mcq(cp, { q: st.check.q, o: st.check.o, w: st.check.w, a: st.analogy.split(". ")[0] + "." }, pts => {
        S.journey[st.id] = true; save();
        addXP(15 + pts * 10, `Station ${journeyPos + 1} cleared`);
        if (journeyPos < JOURNEY.length - 1) journeyPos++;
        if (journeyDone() === JOURNEY.length) toast("Journey complete. You can narrate the full release path.");
        viewJourney(v);
      });
    }
  }

  /* =========================================================
     QUIZ
     ========================================================= */
  function viewQuiz(v) {
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Myth Busters</div><h1 class="vtitle">What the old articles got wrong</h1>
      <p class="lede">Ten random questions per round from ${QUIZ.length}. First-try answers score 2, second-try 1. A streak of three or more adds bonus XP.</p></header>
      <div class="qstart">
        <div class="statrow"><div><span class="big">${S.quiz.best}</span><span class="lab">best of 10</span></div><div><span class="big">${Object.keys(S.quiz.seen).filter(k => !k.startsWith("g:")).length}</span><span class="lab">of ${QUIZ.length} mastered</span></div></div>
        <div class="row" style="margin:0"><button type="button" class="btn primary" id="startQ">Start a round</button>${S.gen.quiz.length ? `<button type="button" class="btn" id="startAIQ">Play your ${S.gen.quiz.length} AI questions</button>` : ""}</div>
      </div>
      <div class="ai-panel"><div class="eyebrow">AI question generator</div><div id="aiQ"></div></div>
      <div id="qarea"></div>`;
    $("#startQ", v).addEventListener("click", () => runQuiz(v));
    const sq = $("#startAIQ", v); if (sq) sq.addEventListener("click", () => runQuiz(v, S.gen.quiz));
    aiBox($("#aiQ", v), { label: "Generate 5 new questions", input: "Optional topic, e.g. dSYMs, cache keys, TestFlight review", optional: true, json: true, cache: false,
      sub: "New questions are saved in this browser so you can replay them.",
      prompt: topic => `${AI_CONTEXT}\n\nWrite 5 NEW multiple-choice interview questions${topic ? ` about: ${topic}` : " covering a mix of signing, CI security, release states, API compatibility and incident response"}. Do not repeat these existing questions: ${QUIZ.concat(S.gen.quiz).map(q => q.q).slice(-40).join(" | ")}\nReply with only a JSON array of 5 objects: {"t": "short topic tag", "q": "question", "o": ["CORRECT answer", "plausible wrong", "plausible wrong", "plausible wrong"], "w": "1-2 sentence explanation of why the correct answer is right", "a": "one-sentence analogy a 10-year-old gets"}. The FIRST option is always the correct one.`,
      onJSON: (data, out) => {
        const ok = (Array.isArray(data) ? data : []).filter(q => q && str(q.q) && strArr(q.o, 4, 4) && str(q.w)).map(q => ({ t: str(q.t, 30) || "AI", q: str(q.q), o: strArr(q.o, 4, 4), w: str(q.w), a: str(q.a) || "", ai: true }));
        if (!ok.length) throw new Error("No usable questions came back. Try again.");
        const known = new Set(S.gen.quiz.map(q => q.q));
        ok.forEach(q => { if (!known.has(q.q)) S.gen.quiz.push(q); });
        S.gen.quiz = S.gen.quiz.slice(-60); save();
        out.innerHTML = `<p><b>${ok.length} new questions ready.</b></p><ul>${ok.map(q => `<li>${esc(q.q)}</li>`).join("")}</ul><div class="row"><button type="button" class="btn primary" id="playNew">Play these now</button></div>`;
        $("#playNew", out).addEventListener("click", () => runQuiz(v, ok));
      } });
  }
  function runQuiz(v, pool) {
    const src = pool ? pool.map(q => ({ ...q, i: "g:" + q.q.slice(0, 80) })) : QUIZ.map((q, i) => ({ ...q, i }));
    const pick = shuffle(src).slice(0, 10), N = pick.length;
    let idx = 0, right = 0, streak = 0, missed = [];
    v.innerHTML = `<header class="vhead"><div class="eyebrow">Myth Busters · round</div>
      <div class="qbar"><div class="qprog"><i id="qfill"></i></div><span id="qcount">1/${N}</span><span id="qstreak" class="streak"></span></div></header><div id="qhost"></div>`;
    const host = $("#qhost", v);
    function next() {
      if (idx >= pick.length) return end();
      $("#qcount", v).textContent = `${idx + 1}/${N}`;
      $("#qfill", v).style.width = (idx / N * 100) + "%";
      host.innerHTML = "";
      const it = pick[idx];
      mcq(host, { label: it.t, q: it.q, o: it.o, w: it.w, a: it.a }, pts => {
        if (pts === 2) {
          right++; streak++;
          let xp = S.quiz.seen[it.i] ? 2 : it.ai ? 6 : 10;
          if (streak >= 3) xp += 5;
          S.quiz.seen[it.i] = true; save();
          addXP(xp, streak >= 3 ? `streak ×${streak}` : "first-try answer");
        } else { streak = 0; missed.push(it); }
        $("#qstreak", v).textContent = streak >= 2 ? `streak ${streak}` : "";
        idx++; next();
      });
    }
    function end() {
      const newBest = !pool && right > S.quiz.best; if (newBest) { S.quiz.best = right; save(); }
      $("#qfill", v).style.width = "100%";
      host.innerHTML = `<div class="result">
        <div class="res-score"><span class="big">${right}</span><span>/${N} first try</span>${newBest ? '<span class="pill verified">NEW BEST</span>' : ""}</div>
        ${missed.length ? `<h3>Review these</h3><ul class="review">${missed.map(m => `<li><b>${esc(m.q)}</b><span>${esc(m.o[0])}</span><em>${esc(m.a)}</em></li>`).join("")}</ul>` : "<p>Clean round. Every myth busted on the first try.</p>"}
        <div id="aiMiss" class="ai-stack"></div>
        <div class="row"><button type="button" class="btn primary" id="again">Another round</button><a class="btn" href="#cards">Flashcards</a></div></div>`;
      $("#again", v).addEventListener("click", () => runQuiz(v, pool));
      if (missed.length) aiBox($("#aiMiss", v), { label: "Explain my misses another way",
        prompt: () => `${AI_CONTEXT}\n\nThe learner missed these questions:\n${missed.map(m => `- Q: ${m.q}\n  Correct: ${m.o[0]}`).join("\n")}\nFor each, give: the core idea in one sentence, a fresh 10-year-old analogy, and a memory hook. Keep it under 70 words per question.` });
    }
    next();
  }

  /* =========================================================
     DRILLS
     ========================================================= */
  let drillFilter = "all";
  function viewDrills(v) {
    if (pendingDrill) { const d = findDrill(pendingDrill); pendingDrill = null; if (d) return runDrill(v, d); }
    const filters = [["all", "All 20"], ["pri", "Interview priority"], ["RouteReady", "RouteReady"], ["StayReady", "StayReady"], ["Either", "Either lab"]];
    const list = DRILLS.filter(d => drillFilter === "all" || (drillFilter === "pri" ? d.pri : d.p === drillFilter));
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Incident Drills</div><h1 class="vtitle">Break it, diagnose it, fix it</h1>
      <p class="lede">Each drill gives you a symptom and a redacted log. Choose a hypothesis, the next command, the fix and how to verify. Then a pager complication arrives. Finish with a senior follow-up, an incident note and a STAR story you can tell in the interview. Score out of 10; 8 or more marks it VERIFIED.</p></header>
      <div class="filters" role="group" aria-label="Filter drills">${filters.map(([k, l]) => `<button type="button" class="chip ${drillFilter === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
      <div class="dgrid">${list.map(drillCard).join("")}</div>
      <section class="block">
        <div class="block-head"><h2>AI drill generator</h2><span class="sub">Fresh scenarios beyond the playbook's 20. Scores don't count toward the 20.</span></div>
        <div id="aiD"></div>
        ${S.gen.drills.length ? `<div class="dgrid" style="margin-top:14px">${S.gen.drills.map(drillCard).join("")}</div>` : ""}
      </section>`;
    $$(".chip[data-f]", v).forEach(b => b.addEventListener("click", () => { drillFilter = b.dataset.f; viewDrills(v); }));
    bindDrillCards(v);
    aiBox($("#aiD", v), { label: "Generate a new drill", input: "Optional focus, e.g. TestFlight review rejection, R8 mapping, Gradle config cache", optional: true, json: true, cache: false,
      prompt: focus => `${AI_CONTEXT}\n\nCreate one NEW incident drill for the learner's portfolio lab${focus ? `, focused on: ${focus}` : ""}. Don't duplicate these: ${DRILLS.concat(S.gen.drills).map(d => d.t).join("; ")}.\n${drillShape()}`,
      onJSON: data => {
        const d = validDrill(data);
        d.n = 100 + S.gen.drills.length + 1;
        S.gen.drills.push(d); S.gen.drills = S.gen.drills.slice(-12); save();
        runDrill(v, d);
      } });
  }
  const TASKS = {
    Signing: "find why signing failed without touching real team certificates, and add a guard so it fails earlier next time",
    Release: "restore a trustworthy release record and make retries safe",
    CI: "get CI reliable again from a fresh environment and stop it recurring",
    Security: "close the exposure, rotate anything real, and redesign the trust boundary",
    API: "keep every installed client working while fixing the server",
    Data: "make the app tell the truth about where the bus is and how fresh that is",
    Backend: "stop the errors during rollout without breaking older versions",
    Testing: "make the test trustworthy without hiding a real bug",
    Operate: "protect people who already installed the build, then fix the cause",
    Observability: "make crashes readable again and keep them readable",
    "AI + RN": "decide whether the change was safe to ship, and make the unsafe path impossible"
  };
  function starFor(d) {
    return {
      S: `In my ${d.p === "Either" ? "RouteReady/StayReady" : d.p} portfolio lab, I ${d.inj} to rehearse a real failure. Symptom: ${lc(d.sym)}`,
      T: `As the release engineer, my job was to ${TASKS[d.c] || "fix the root cause safely"}.`,
      A: `I started from the hypothesis that ${lc(strip(d.s[0].o[0]))}. To check it, I ran ${strip(d.s[1].o[0])}. The fix I made: ${lc(strip(d.s[2].o[0]))}.`,
      R: `I verified it: ${lc(strip(d.s[3].o[0]))}. When a complication came up (${lc(strip(d.x.t))}), I handled it: ${lc(strip(d.x.o[0]))}. I wrote a one-page incident note with relative timings and links to the saved runs, since this is lab evidence, not production numbers.`
    };
  }
  function runDrill(v, d) {
    let total = 0; const stagePts = [];
    v.innerHTML = `
      <button type="button" class="back" id="back">← All drills</button>
      <header class="drill-head">
        <div class="eyebrow">Drill ${String(d.n).padStart(2, "0")} · ${esc(d.p)} · ${esc(d.c)}${d.pri ? " · interview priority" : ""}</div>
        <h1 class="vtitle">${esc(d.t)}</h1>
      </header>
      <div class="brief">
        <div class="brief-l">
          <div class="kv"><span>Injected</span><p>We ${esc(d.inj)}.</p></div>
          <div class="kv"><span>Symptom</span><p>${esc(d.sym)}</p></div>
          <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>${esc(d.an)}</p></div>
        </div>
        <div class="term"><div class="term-h"><span class="dots"><i></i><i></i><i></i></span><span>${esc(d.logT)}</span><span class="redact">redacted</span></div>
          <pre>${d.log.map(l => { const e = esc(l); return /error|ERROR|FAILED|rejected|Invalid|crash|Crashed|503|Violation|missing/i.test(l) ? `<span class="lerr">${e}</span>` : e; }).join("\n")}</pre></div>
      </div>
      ${!d.ai ? `<div class="drill-ref"><span class="eyebrow">Run it for real</span>${fileBtns([drillSlug(d)].concat(REPO_LINKS.drills[d.n] || []), "inline")}</div>` : ""}
      <div class="scorebar" aria-live="polite"><span>Score</span><div class="pips">${[0, 1, 2, 3, 4].map(i => `<i data-p="${i}"></i>`).join("")}</div><span id="dscore">0/10</span></div>
      <div id="stages" class="stages"></div>
      <div id="dend"></div>`;
    $("#back", v).addEventListener("click", () => viewDrills(v));
    bindFileBtns(v);
    const host = $("#stages", v);
    const steps = d.s.map((s, i) => ({ q: s.q, o: s.o, w: s.w, label: `${i + 1} · ${STAGE_LABELS[i]}` }))
      .concat([{ q: d.x.q, o: d.x.o, w: d.x.w, label: "5 · Complication", pre: d.x.t }]);
    let k = 0;
    function next() {
      if (k >= steps.length) return finish();
      const it = steps[k];
      if (it.pre) host.appendChild(frag(`<div class="pager"><span class="pg-k">PAGER</span><p>${esc(it.pre)}</p></div>`));
      mcq(host, it, p => {
        stagePts.push(p); total += p;
        const pip = $(`.pips i[data-p="${k}"]`, v); pip.className = p === 2 ? "p2" : p === 1 ? "p1" : "p0";
        $("#dscore", v).textContent = `${total}/10`;
        k++; next();
      });
    }
    function finish() {
      const store = d.ai ? S.gdr : S.drills;
      const prev = store[d.n];
      const best = prev == null ? total : Math.max(prev, total);
      store[d.n] = best; save();
      addXP(Math.round((Math.max(0, total - (prev || 0)) * 10 + (prev == null ? 20 : 0)) * (d.ai ? 0.5 : 1)), d.ai ? "AI drill" : `Drill ${d.n}`);
      const star = starFor(d);
      const note = [
        `Incident note — Drill ${d.n}: ${d.t} (${d.p} portfolio lab)`,
        `Impact and scope: lab sandbox only. ${d.sym}`,
        `First signal: ${d.log.find(l => /error|ERROR|FAILED|rejected|Invalid|Crashed|503|Violation|missing|Waiting|PROCESSING/i.test(l)) || d.log[0]}`,
        `Timeline: T+0 inject · T+? first signal · T+? hypothesis · T+? fix · T+? verified (fill with your measured times)`,
        `Root cause: ${d.s[0].o[0]}`,
        `Diagnostic: ${d.s[1].o[0]}`,
        `Containment / corrective change: ${d.s[2].o[0]}`,
        `Regression test / verification: ${d.s[3].o[0]}`,
        `Complication: ${d.x.t} → ${d.x.o[0]}`,
        `Prevention owner: (you)`,
        `Evidence: drills/${String(d.n).padStart(2, "0")}-${d.t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/ (failing run, commands, passing run)`
      ].join("\n");
      const starText = `S — ${star.S}\nT — ${star.T}\nA — ${star.A}\nR — ${star.R}`;
      const rub = [stagePts[0], stagePts[1], stagePts[2], stagePts[3], stagePts[2], stagePts[4]];
      $("#dend", v).innerHTML = `
        <section class="follow">
          <div class="eyebrow">Senior follow-up</div>
          <p class="q">${esc(d.f.q)}</p>
          <label class="sr" for="fu">Your answer</label>
          <textarea id="fu" rows="4" placeholder="Answer out loud or type it here, then compare."></textarea>
          <div class="row" style="margin-top:0"><button type="button" class="btn" id="revealFu">Show a strong answer</button></div>
          <div id="aiFu"></div>
          <div class="model" id="fuModel" hidden><div class="eyebrow">Strong answer</div><p>${esc(d.f.a)}</p></div>
        </section>
        <section class="result">
          <div class="res-score"><span class="big">${total}</span><span>/10</span><span class="pill ${best >= 8 ? "verified" : "implemented"}">${best >= 8 ? "VERIFIED" : "IMPLEMENTED"}</span><span class="sub">best ${best}/10</span></div>
          <h3>Rubric view</h3>
          <div class="rubric">${RUBRIC.map((r, i) => `<div class="rb"><span>${esc(r)}</span><span class="rbbar"><i style="width:${(rub[i] ?? 0) * 50}%"></i></span><span class="rbn">${rub[i] ?? 0}/2</span></div>`).join("")}</div>
        </section>
        <section class="star-out copyable">
          <div class="so-head"><div><div class="eyebrow">Your STAR story for this drill</div><h3>Tell it in about 90 seconds</h3></div><button type="button" class="btn small" data-copy="star">Copy STAR</button></div>
          <div class="star4">
            <div class="s4 s"><b>S</b><span>Situation</span><p>${esc(star.S)}</p></div>
            <div class="s4 t"><b>T</b><span>Task</span><p>${esc(star.T)}</p></div>
            <div class="s4 a"><b>A</b><span>Action</span><p>${esc(star.A)}</p></div>
            <div class="s4 r"><b>R</b><span>Result</span><p>${esc(star.R)}</p></div>
          </div>
          <p class="hint">Rewrite it in your own words. Swap in what you actually saw when you run this drill in your real repo.</p>
        </section>
        <section class="note copyable">
          <div class="so-head"><div><div class="eyebrow">One-page incident note</div><h3>Draft for drills/${String(d.n).padStart(2, "0")}/incident.md</h3></div><button type="button" class="btn small" data-copy="note">Copy note</button></div>
          <div class="code"><pre class="copysrc">${esc(note)}</pre></div>
        </section>
        <div class="row">
          <button type="button" class="btn primary" id="retry">Run again</button>
          ${!d.ai && d.n < 20 ? `<button type="button" class="btn" id="nextDrill">Next drill: ${esc(DRILLS[d.n].t)}</button>` : ""}
          <button type="button" class="btn ghost" id="allD">All drills</button>
        </div>`;
      const end = $("#dend", v);
      $("#revealFu", end).addEventListener("click", e => { $("#fuModel", end).hidden = false; e.target.hidden = true; });
      aiBox($("#aiFu", end), { label: "Get AI feedback on my answer", json: true, cache: false,
        prompt: () => { const a = $("#fu", end).value.trim(); if (a.length < 15) throw new Error("Write at least a sentence or two first."); return `${AI_CONTEXT}\n\nIncident drill: ${d.t}. Symptom: ${d.sym}\nSenior follow-up question: ${d.f.q}\nReference answer: ${d.f.a}\nThe learner answered: """${a.slice(0, 4000)}"""\nGrade the learner's answer against the reference and the facts above. ${FEEDBACK_SHAPE}`; },
        onJSON: (f, out) => renderFeedback(out, f) });
      aiBox($("#aiFu", end), { label: "Polish my STAR story", compact: true,
        prompt: () => `${AI_CONTEXT}\n\nHere is a draft STAR interview story from the learner's portfolio lab drill "${d.t}":\n${starText}\nRewrite it to sound natural when spoken, about 150 words, first person, keeping S/T/A/R labels on separate lines. Keep it honest: it's a portfolio lab, no invented numbers. Then add one line: "Likely follow-up:" with the question an interviewer would ask next.` });
      $$("[data-copy]", end).forEach(b => b.addEventListener("click", () => copyText(b.dataset.copy === "star" ? starText : note, b)));
      $("#retry", end).addEventListener("click", () => runDrill(v, d));
      const nd = $("#nextDrill", end); if (nd) nd.addEventListener("click", () => runDrill(v, DRILLS[d.n]));
      $("#allD", end).addEventListener("click", () => viewDrills(v));
      end.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    next();
  }

  /* =========================================================
     BUG HUNT
     ========================================================= */
  function viewBugs(v) {
    if (pendingBug) { const b = BUGS.find(x => x.id === pendingBug) || S.gen.bugs.find(x => x.id === pendingBug); pendingBug = null; if (b) return runBug(v, b); }
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Bug Hunt</div><h1 class="vtitle">Find the lines that will hurt you</h1>
      <p class="lede">Each file has one or more real-world mistakes from the playbook. Tap a line you think is broken. Three wrong taps and the file reveals its bugs.</p></header>
      <div class="bgrid">${BUGS.map(b => `<button type="button" class="bcard" data-b="${b.id}">
        <span class="bfile">${esc(b.f)}</span><span class="btitle">${esc(b.t)}</span>
        <span class="dfoot"><span class="tag">${esc(b.jd)}</span><span class="pill ${S.bugs[b.id] ? "verified" : "pending"}">${S.bugs[b.id] ? "FIXED" : `${Object.keys(b.b).length} BUG${Object.keys(b.b).length > 1 ? "S" : ""}`}</span></span></button>`).join("")}</div>`;
    v.insertAdjacentHTML("beforeend", `<section class="block"><div class="block-head"><h2>AI bug generator</h2><span class="sub">A new broken file to hunt. Doesn't count toward the 12.</span></div><div id="aiB"></div>
      ${S.gen.bugs.length ? `<div class="bgrid" style="margin-top:14px">${S.gen.bugs.map(b => `<button type="button" class="bcard" data-b="${b.id}"><span class="bfile">${esc(b.f)}</span><span class="btitle">${esc(b.t)}</span><span class="dfoot"><span class="tag">AI</span><span class="pill ${S.gbug[b.id] ? "verified" : "pending"}">${S.gbug[b.id] ? "FIXED" : Object.keys(b.b).length + " BUGS"}</span></span></button>`).join("")}</div>` : ""}</section>`);
    $$(".bcard", v).forEach(c => c.addEventListener("click", () => runBug(v, BUGS.find(b => b.id === c.dataset.b) || S.gen.bugs.find(b => b.id === c.dataset.b))));
    aiBox($("#aiB", v), { label: "Generate a broken file", input: "Optional focus, e.g. Gradle signingConfigs, Fastfile pilot, Expo eas.json", optional: true, json: true, cache: false,
      prompt: focus => `${AI_CONTEXT}\n\nCreate one realistic config or code file (5 to 16 lines) from a mobile release pipeline${focus ? ` about: ${focus}` : " (GitHub Actions workflow, Fastfile, Gradle build file, eas.json, API handler, or release manifest)"} containing 1 to 3 real-world mistakes from the facts above or similar senior-level pitfalls. Don't repeat these: ${BUGS.concat(S.gen.bugs).map(b => b.t).join("; ")}.\nReply with only one JSON object: {"t": "short title", "f": "file path", "jd": "skill area, 1-3 words", "an": "one-sentence 10-year-old analogy for the mistakes", "l": ["each line of the file as a string, indentation preserved"], "b": {"<zero-based line index>": "why this line is wrong, one sentence"}, "fix": ["lines of a corrected version"]}. Every key in "b" must point at a non-empty line that contains the mistake.`,
      onJSON: data => { const b = validBug(data); S.gen.bugs.push(b); S.gen.bugs = S.gen.bugs.slice(-12); save(); runBug(v, b); } });
  }
  function runBug(v, b) {
    const need = Object.keys(b.b).map(Number);
    const found = new Set(); let lives = 3, over = false;
    v.innerHTML = `
      <button type="button" class="back" id="back">← All files</button>
      <header class="drill-head"><div class="eyebrow">Bug Hunt · ${esc(b.jd)}</div><h1 class="vtitle">${esc(b.t)}</h1></header>
      <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>${esc(b.an)}</p></div>
      <div class="huntbar"><span>Found <b id="fcount">0</b>/${need.length}</span><span class="lives" id="lives" aria-label="3 tries left">●●●</span></div>
      <div class="code hunt"><div class="code-h">${esc(b.f)}</div><div class="lines" id="lines">${b.l.map((l, i) => `<button type="button" class="ln" data-i="${i}"><span class="no">${i + 1}</span><span class="src">${esc(l) || " "}</span></button><div class="lnote" id="note${i}" hidden></div>`).join("")}</div></div>
      <div id="bend"></div>`;
    $("#back", v).addEventListener("click", () => viewBugs(v));
    $$(".ln", v).forEach(btn => btn.addEventListener("click", () => {
      if (over) return;
      const i = +btn.dataset.i;
      if (b.b[i] != null) {
        if (found.has(i)) return;
        found.add(i); btn.classList.add("hit");
        const n = $("#note" + i, v); n.textContent = b.b[i]; n.hidden = false;
        $("#fcount", v).textContent = found.size;
        if (found.size === need.length) end(true);
      } else {
        btn.classList.remove("miss"); void btn.offsetWidth; btn.classList.add("miss");
        lives--; $("#lives", v).textContent = "●".repeat(lives) + "○".repeat(3 - lives);
        $("#lives", v).setAttribute("aria-label", `${lives} tries left`);
        if (lives <= 0) end(false);
      }
    }));
    function end(win) {
      over = true;
      if (!win) need.forEach(i => { if (!found.has(i)) { $(`.ln[data-i="${i}"]`, v).classList.add("revealed"); const n = $("#note" + i, v); n.textContent = b.b[i]; n.hidden = false; } });
      const bstore = b.ai ? S.gbug : S.bugs;
      if (win && !bstore[b.id]) { bstore[b.id] = true; save(); addXP((b.ai ? 8 : 15) * need.length, `Bug Hunt: ${b.t}`); }
      const idx = BUGS.indexOf(b);
      $("#bend", v).innerHTML = `<div class="result">
        <div class="res-score"><span class="big">${win ? "Fixed" : "Out of tries"}</span></div>
        <h3>A safer version</h3><div class="code"><pre>${b.fix.map(esc).join("\n")}</pre></div>
        ${(REPO_LINKS.bugs[b.id] || []).length ? `<h3>Reference version in the repo</h3>${fileBtns(REPO_LINKS.bugs[b.id])}` : ""}
        <div id="aiBx" class="ai-stack"></div>
        <div class="row"><button type="button" class="btn primary" id="again">Try again</button>
        ${idx < BUGS.length - 1 ? `<button type="button" class="btn" id="nextB">Next file: ${esc(BUGS[idx + 1].t)}</button>` : ""}</div></div>`;
      $("#again", v).addEventListener("click", () => runBug(v, b));
      bindFileBtns($("#bend", v));
      aiBox($("#aiBx", v), { label: "Explain the fix line by line",
        prompt: () => `${AI_CONTEXT}\n\nBroken file ${b.f}:\n${b.l.map((x, i) => `${i + 1}: ${x}`).join("\n")}\nThe mistakes are on lines ${Object.keys(b.b).map(k => +k + 1).join(", ")}.\nCorrected version:\n${b.fix.join("\n")}\nExplain each mistake: what could actually go wrong in a real pipeline, how you'd spot it in review, and a 10-year-old analogy. Under 250 words.` });
      const nb = $("#nextB", v); if (nb) nb.addEventListener("click", () => runBug(v, BUGS[idx + 1]));
    }
  }

  /* =========================================================
     PIPELINE GATES
     ========================================================= */
  function viewGates(v) {
    const items = shuffle(PIPE.map((p, i) => ({ ...p, i })));
    const pick = {};
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Pipeline Gates</div><h1 class="vtitle">Which event does this work belong to?</h1>
      <p class="lede">Assign each piece of work to the pipeline event where it belongs, or to <b>Never</b>. Best score: ${S.pipe}/${PIPE.length}.</p></header>
      <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>Think of a school day: homework check at the door (PR), class rehearsal (main), the field-trip bus (beta), the principal's signature (promotion), and the night janitor's deep clean (nightly). Some things never happen at school at all.</p></div>
      <div class="sorter">${items.map(it => `<div class="srow" data-i="${it.i}">
        <p class="stext">${esc(it.t)}</p>
        <div class="schips" role="group" aria-label="Choose event">${BUCKETS.map(bk => `<button type="button" class="chip" data-b="${bk.id}">${esc(bk.name)}</button>`).join("")}</div>
        <p class="swhy" hidden></p></div>`).join("")}</div>
      <div class="row"><button type="button" class="btn primary" id="checkG">Check my pipeline</button><span id="gmsg" class="sub"></span></div>
      <div id="aiG" class="ai-stack"></div>`;
    let lastWrong = [];
    aiBox($("#aiG", v), { label: "Explain my mistakes",
      prompt: () => { if (!lastWrong.length) throw new Error("Check your pipeline first. If everything's right, there's nothing to explain."); return `${AI_CONTEXT}\n\nPipeline events: pull request (untrusted, no secrets), merge to main (trusted build, staging), beta release (explicit, signing, upload), production promotion (approval, same artifact), nightly (breadth), never.\nThe learner placed these items wrong:\n${lastWrong.map(w => `- "${w.t}": they chose ${w.chose}, correct is ${w.right}`).join("\n")}\nFor each, explain in 2 sentences why it belongs where it does and what goes wrong in the place they chose. Add one 10-year-old analogy at the end that ties it together.`; } });
    $$(".srow", v).forEach(row => $$(".chip", row).forEach(c => c.addEventListener("click", () => {
      $$(".chip", row).forEach(x => x.classList.remove("on")); c.classList.add("on"); pick[row.dataset.i] = c.dataset.b;
    })));
    $("#checkG", v).addEventListener("click", () => {
      if (Object.keys(pick).length < PIPE.length) { $("#gmsg", v).textContent = `Assign all ${PIPE.length} items first (${Object.keys(pick).length} done).`; return; }
      let right = 0;
      $$(".srow", v).forEach(row => {
        const it = PIPE[row.dataset.i], ok = pick[row.dataset.i] === it.b; if (ok) right++;
        row.classList.remove("ok", "bad"); row.classList.add(ok ? "ok" : "bad");
        const w = $(".swhy", row); w.hidden = false;
        w.textContent = (ok ? "Right. " : `Belongs in ${BUCKETS.find(x => x.id === it.b).name}. `) + it.w;
      });
      if (right > S.pipe) { addXP((right - S.pipe) * 5, "Pipeline Gates"); S.pipe = right; save(); }
      lastWrong = PIPE.map((it, i) => ({ t: it.t, chose: (BUCKETS.find(x => x.id === pick[i]) || {}).name, right: BUCKETS.find(x => x.id === it.b).name })).filter(w => w.chose !== w.right);
      $("#gmsg", v).textContent = `${right}/${PIPE.length} correct.` + (right === PIPE.length ? " Perfect pipeline." : " Fix the red ones and check again.");
    });
  }

  /* =========================================================
     RELEASE STATES
     ========================================================= */
  let statesTab = "ios";
  function viewStates(v) {
    const track = STATES[statesTab];
    let order = shuffle(track.items.map((x, i) => i));
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Release States</div><h1 class="vtitle">Upload is not released</h1>
      <p class="lede">Put the states in order, first to last. Your manifest should be able to say exactly which one a build is in.</p></header>
      <div class="filters" role="tablist">${Object.entries(STATES).map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === statesTab}" class="chip ${k === statesTab ? "on" : ""}" data-t="${k}">${esc(t.name)} ${S.states[k] ? "✓" : ""}</button>`).join("")}</div>
      <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>${esc(track.an)}</p></div>
      <ol class="order" id="order"></ol>
      <div class="row"><button type="button" class="btn primary" id="checkS">Check order</button><button type="button" class="btn ghost" id="showS">Show answer</button><span id="smsg" class="sub"></span></div>
      <div id="aiS" class="ai-stack"></div>`;
    aiBox($("#aiS", v), { label: "Walk me through these states",
      prompt: () => `${AI_CONTEXT}\n\nThe learner is ordering ${track.name} release states. Correct order:\n${track.items.map((x, i) => `${i + 1}. ${x[0]}`).join("\n")}\nTheir current order:\n${order.map((ix, i) => `${i + 1}. ${track.items[ix][0]}`).join("\n")}\nExplain the correct order as a short story of one build's trip, one line per state, noting what the release manifest should record at each. Then point out any of their misplacements and why. Under 230 words.` });
    $$(".chip[data-t]", v).forEach(b => b.addEventListener("click", () => { statesTab = b.dataset.t; viewStates(v); }));
    const ol = $("#order", v);
    function draw(marks) {
      ol.innerHTML = order.map((ix, p) => `<li class="${marks ? (ix === p ? "ok" : "bad") : ""}">
        <span class="opos">${p + 1}</span><span class="otext">${esc(track.items[ix][0])}${marks && ix === p ? `<small>${esc(track.items[ix][1])}</small>` : ""}</span>
        <span class="omove"><button type="button" aria-label="Move up" data-u="${p}" ${p === 0 ? "disabled" : ""}>↑</button><button type="button" aria-label="Move down" data-d="${p}" ${p === order.length - 1 ? "disabled" : ""}>↓</button></span></li>`).join("");
      $$("[data-u]", ol).forEach(b => b.addEventListener("click", () => { const p = +b.dataset.u; [order[p - 1], order[p]] = [order[p], order[p - 1]]; draw(); ol.children[p - 1].querySelector("[data-u],[data-d]")?.focus(); }));
      $$("[data-d]", ol).forEach(b => b.addEventListener("click", () => { const p = +b.dataset.d; [order[p + 1], order[p]] = [order[p], order[p + 1]]; draw(); }));
    }
    draw();
    $("#checkS", v).addEventListener("click", () => {
      const right = order.filter((ix, p) => ix === p).length;
      draw(true);
      if (right === order.length) {
        $("#smsg", v).textContent = "Perfect order.";
        if (!S.states[statesTab]) { S.states[statesTab] = true; save(); addXP(40, `${track.name} states`); }
      } else $("#smsg", v).textContent = `${right}/${order.length} in the right spot.`;
    });
    $("#showS", v).addEventListener("click", () => { order = track.items.map((x, i) => i); draw(true); $("#smsg", v).textContent = "Answer shown. Shuffle by switching tabs to try again."; });
  }

  /* =========================================================
     ROLLBACK LAB
     ========================================================= */
  let rbIdx = 0;
  function viewRollback(v) {
    const sc = ROLLBACK[rbIdx];
    const sel = new Set();
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Rollback Lab · scenario ${rbIdx + 1} of ${ROLLBACK.length}</div><h1 class="vtitle">What exactly are you rolling back?</h1>
      <p class="lede">Pick every lever that helps. Leave out the ones that don't work or make things worse.</p></header>
      <div class="scenario"><span class="pg-k">INCIDENT</span><p>${esc(sc.t)}</p></div>
      <div class="levers">${Object.entries(LEVERS).map(([k, t]) => `<button type="button" class="lever" data-k="${k}" aria-pressed="false"><span class="lk">${k}</span><span>${esc(t)}</span></button>`).join("")}</div>
      <div class="row"><button type="button" class="btn primary" id="subR">Pull these levers</button>
      <span class="dots-nav">${ROLLBACK.map((r, i) => `<button type="button" class="dotn ${i === rbIdx ? "cur" : ""} ${S.roll[r.id] ? "done" : ""}" data-i="${i}" aria-label="Scenario ${i + 1}"></button>`).join("")}</span></div>
      <div id="rres"></div>`;
    $$(".lever", v).forEach(b => b.addEventListener("click", () => {
      if (b.disabled) return;
      const k = b.dataset.k; if (sel.has(k)) sel.delete(k); else sel.add(k);
      b.classList.toggle("on", sel.has(k)); b.setAttribute("aria-pressed", sel.has(k));
    }));
    $$(".dotn", v).forEach(b => b.addEventListener("click", () => { rbIdx = +b.dataset.i; viewRollback(v); }));
    $("#subR", v).addEventListener("click", e => {
      e.target.disabled = true;
      const ok = new Set(sc.ok);
      let exact = sel.size === ok.size && [...sel].every(k => ok.has(k));
      $$(".lever", v).forEach(b => {
        b.disabled = true; const k = b.dataset.k;
        if (ok.has(k)) b.classList.add(sel.has(k) ? "good" : "missed");
        else if (sel.has(k)) b.classList.add("badpick");
      });
      if (exact && !S.roll[sc.id]) { S.roll[sc.id] = true; save(); addXP(30, "Rollback Lab"); }
      $("#rres", v).innerHTML = `<div class="verdict ${exact ? "good" : "low"}"><div class="vtop"><strong>${exact ? "Right levers" : "Not quite"}</strong><span class="pts">best: ${sc.ok.join(" + ")}</span></div>
        <p>${esc(sc.w)}</p><p class="analogy"><span>Like you're 10</span>${esc(sc.an)}</p>
        <div class="row"><button type="button" class="btn" id="againR">Try again</button>${rbIdx < ROLLBACK.length - 1 ? '<button type="button" class="btn primary" id="nextR">Next scenario</button>' : ""}</div></div>`;
      $("#againR", v).addEventListener("click", () => viewRollback(v));
      const n = $("#nextR", v); if (n) n.addEventListener("click", () => { rbIdx++; viewRollback(v); });
      aiBox($("#rres", v), { label: "Why? Explain my picks",
        prompt: () => `${AI_CONTEXT}\n\nIncident: ${sc.t}\nAvailable levers: ${Object.entries(LEVERS).map(([k, t]) => k + ") " + t).join("; ")}\nBest levers: ${sc.ok.join(", ")}. The learner picked: ${[...sel].join(", ") || "nothing"}.\nFor every lever, one line: helps / doesn't help / makes it worse, and why, specifically about installed binaries vs backend vs store. Then say what to tell stakeholders in two sentences. Under 220 words.` });
    });
  }

  /* =========================================================
     BLUEPRINTS (diagrams)
     ========================================================= */
  let bpTab = DIAGRAMS[0].id;
  const NW = 210, SX = 1.2;
  function wrapSub(s, max) {
    const parts = String(s).split(" · "), lines = []; let cur = "";
    for (const p of parts) { const next = cur ? cur + " · " + p : p; if (next.length > max && cur) { lines.push(cur); cur = p; } else cur = next; }
    if (cur) lines.push(cur);
    return lines.flatMap(l => l.length > max + 6 ? [l.slice(0, max), l.slice(max)] : [l]).slice(0, 3);
  }
  function layout(dg) {
    return dg.nodes.map(n => { const sub = wrapSub(n.s, 27); return { ...n, X: n.x * SX, sub, H: 46 + sub.length * 15 }; });
  }
  function anchor(n, side) {
    return side === "r" ? [n.X + NW, n.y + n.H / 2] : side === "l" ? [n.X, n.y + n.H / 2] : side === "b" ? [n.X + NW / 2, n.y + n.H] : [n.X + NW / 2, n.y];
  }
  function flowSVG(dg, opts = {}) {
    const L = layout(dg), byId = Object.fromEntries(L.map(n => [n.id, n]));
    const W = Math.round(dg.w * SX + 20), H = Math.max(dg.h, ...L.map(n => n.y + n.H + 20));
    const edges = dg.edges.map(([a, b, lab]) => {
      const A = byId[a], B = byId[b];
      const dx = B.X - A.X, dy = B.y - A.y;
      let s1, s2; const horiz = Math.abs(dx) >= Math.abs(dy);
      if (horiz) { s1 = dx > 0 ? "r" : "l"; s2 = dx > 0 ? "l" : "r"; } else { s1 = dy > 0 ? "b" : "t"; s2 = dy > 0 ? "t" : "b"; }
      const [x1, y1] = anchor(A, s1), [x2, y2] = anchor(B, s2);
      let d;
      if (horiz) { const c = Math.max(28, Math.abs(x2 - x1) / 2) * (x2 > x1 ? 1 : -1); d = `M${x1} ${y1} C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2 - (x2 > x1 ? 6 : -6)} ${y2}`; }
      else { const c = Math.max(28, Math.abs(y2 - y1) / 2) * (y2 > y1 ? 1 : -1); d = `M${x1} ${y1} C${x1} ${y1 + c} ${x2} ${y2 - c} ${x2} ${y2 - (y2 > y1 ? 6 : -6)}`; }
      return `<path class="edge" d="${d}" marker-end="url(#ah)"/>` + (lab ? `<text class="elab" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}" text-anchor="middle">${esc(lab)}</text>` : "");
    }).join("");
    const nodes = L.map(n => `<g class="node k-${n.k} ${opts.sel === n.id ? "sel" : ""}" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.n ? "Step " + n.n + ": " : ""}${esc(n.t)}">
      <rect x="${n.X}" y="${n.y}" width="${NW}" height="${n.H}" rx="4"/>
      ${n.n ? `<circle class="nbadge" cx="${n.X}" cy="${n.y}" r="12"/><text class="nnum" x="${n.X}" y="${n.y + 4}" text-anchor="middle">${n.n}</text>` : ""}
      <text class="nt" x="${n.X + 16}" y="${n.y + 26}">${esc(n.t)}</text>
      ${n.sub.map((l, i) => `<text class="ns" x="${n.X + 16}" y="${n.y + 44 + i * 15}">${esc(l)}</text>`).join("")}</g>`).join("");
    return `<svg viewBox="-16 -16 ${W + 16} ${H + 16}" role="img" aria-label="${esc(dg.t)}" class="flow">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrow"/></marker></defs>
      ${edges}${nodes}</svg>`;
  }
  const stationsFor = id => JOURNEY.map((s, i) => ({ s, i })).filter(x => x.s.pic === id);
  function viewBlueprints(v) {
    const dg = DIAGRAMS.find(d => d.id === bpTab) || DIAGRAMS[0];
    if (!S.bp[dg.id]) { S.bp[dg.id] = true; save(); }
    const ordered = dg.nodes.slice().sort((a, b) => (a.n || 99) - (b.n || 99));
    const sp = SPRINTS.find(x => x.n === dg.sprint);
    const st = stationsFor(dg.id);
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Blueprints · ${DIAGRAMS.indexOf(dg) + 1} of ${DIAGRAMS.length}</div><h1 class="vtitle">${esc(dg.t)}</h1></header>
      <div class="filters" role="tablist">${DIAGRAMS.map((d, i) => `<button type="button" role="tab" aria-selected="${d.id === dg.id}" class="chip ${d.id === dg.id ? "on" : ""}" data-t="${d.id}">${i + 1}. ${esc(d.t)}</button>`).join("")}</div>
      <section class="bpdef">
        <div class="bpdef-main">
          <div class="bp-k">What this blueprint is</div><p class="bp-what">${esc(dg.what)}</p>
          <div class="bp-k">How to read it</div><p>${esc(dg.read)}</p>
          <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>${esc(dg.an)}</p></div>
        </div>
        <aside class="bpdef-side">
          <div class="bp-time"><span class="bp-k">Time</span><b>${esc(dg.time)}</b></div>
          ${sp ? `<div><span class="bp-k">Sprint</span><button type="button" class="linkbtn" id="toSprint">Sprint ${sp.n} · ${esc(sp.weeks)}: ${esc(sp.goal)}</button></div>` : ""}
          ${st.length ? `<div><span class="bp-k">Journey stations</span>${st.map(x => `<button type="button" class="linkbtn" data-st="${x.i}">${x.i + 1}. ${esc(x.s.title)}</button>`).join("")}</div>` : ""}
        </aside>
      </section>
      <div class="howto"><span class="howto-n">1</span> Read the numbered steps below in order. <span class="howto-n">2</span> Click any box on the drawing (or a step in the list) to see what it does. <span class="howto-n">3</span> Ask the AI if a step still doesn't make sense.</div>
      <div class="legend">${[["untrusted", "untrusted code"], ["trusted", "trusted build"], ["secret", "holds secrets / approval"], ["store", "store / Apple / Google"], ["user", "installed apps"], ["neutral", "neutral step"], ["danger", "hazard"]].map(([k, l]) => `<span class="lg k-${k}"><i></i>${l}</span>`).join("")}</div>
      <div class="diagram" id="dgwrap">${flowSVG(dg)}</div>
      <div class="info" id="info" aria-live="polite"><span class="sub">Click a box or a step to see its details here.</span></div>
      <h3>The flow, step by step</h3>
      <ol class="flowlist">${ordered.map(n => `<li><button type="button" class="flowstep" data-id="${n.id}"><span class="fs-n">${n.n || "·"}</span><span class="fs-t"><b>${esc(n.t)}</b><small>${esc(n.s)}</small></span></button><p>${esc(n.i)}</p></li>`).join("")}</ol>
      <div id="aiBP" class="ai-stack"></div>`;
    $$(".chip[data-t]", v).forEach(b => b.addEventListener("click", () => { bpTab = b.dataset.t; viewBlueprints(v); }));
    const sb = $("#toSprint", v); if (sb) sb.addEventListener("click", () => go("sprints"));
    $$("[data-st]", v).forEach(b => b.addEventListener("click", () => { const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]); const i = +b.dataset.st; journeyPos = (firstOpen === -1 || i <= firstOpen) ? i : firstOpen; go("journey"); }));
    const show = id => {
      $$(".node", v).forEach(x => x.classList.toggle("sel", x.dataset.id === id));
      $$(".flowstep", v).forEach(x => x.classList.toggle("on", x.dataset.id === id));
      const n = dg.nodes.find(x => x.id === id);
      const out = dg.edges.filter(e => e[0] === id).map(e => dg.nodes.find(x => x.id === e[1]).t);
      const inc = dg.edges.filter(e => e[1] === id).map(e => dg.nodes.find(x => x.id === e[0]).t);
      $("#info", v).innerHTML = `<div class="eyebrow">${n.n ? "Step " + n.n + " · " : ""}${esc(n.s)}</div><h3>${esc(n.t)}</h3><p>${esc(n.i)}</p>
        <p class="sub">${inc.length ? "Comes from: " + inc.map(esc).join(", ") + ". " : ""}${out.length ? "Leads to: " + out.map(esc).join(", ") + "." : ""}</p>`;
    };
    $$(".node", v).forEach(g => { g.addEventListener("click", () => show(g.dataset.id)); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(g.dataset.id); } }); });
    $$(".flowstep", v).forEach(b => b.addEventListener("click", () => { show(b.dataset.id); $("#dgwrap", v).scrollIntoView({ behavior: "smooth", block: "nearest" }); }));
    aiBox($("#aiBP", v), { label: "Ask", input: "Ask about this blueprint, e.g. 'why can't the PR job see secrets?'", cache: false,
      prompt: q => `${AI_CONTEXT}\n\nBlueprint "${dg.t}": ${dg.what}\nSteps in order: ${ordered.map(n => `${n.n}. ${n.t} (${n.s}): ${n.i}`).join(" | ")}. Arrows: ${dg.edges.map(e => e[0] + "→" + e[1]).join(", ")}.\nQuestion: ${q}\nAnswer in under 180 words, referring to the steps by number, then one 10-year-old analogy.` });
  }

  /* =========================================================
     TERMS — in pipeline order, tagged by tool, connected
     ========================================================= */
  let termFilter = "all";
  function viewCards(v) {
    const all = CARDS.concat(S.gen.cards.map(c => ({ t: c.term, d: c.def, a: c.analogy, st: "ai", tool: "AI", x: [] })));
    const tools = [...new Set(CARDS.map(c => c.tool))].sort();
    const shown = all.filter(c => termFilter === "all" || c.tool === termFilter);
    let num = 0;
    const groups = PHASES.map(ph => ({ ph, sts: JOURNEY.map((s, i) => ({ s, i })).filter(x => x.s.phase === ph.id).map(x => ({ ...x, cards: shown.filter(c => c.st === x.s.id) })).filter(x => x.cards.length) })).filter(g => g.sts.length);
    const aiCards = shown.filter(c => c.st === "ai");
    const known = all.filter(c => S.cards[c.t]).length;
    const card = c => { num++; return `<div class="term ${S.cards[c.t] ? "known" : ""}" id="term-${esc(c.t.replace(/[^a-z0-9]+/gi, "-"))}">
        <div class="term-top"><span class="term-n">${num}</span><span class="term-t">${esc(c.t)}</span><span class="tag">${esc(c.tool)}</span></div>
        <p>${esc(c.d)}</p><p class="analogy"><span>Like you're 10</span>${esc(c.a)}</p>
        ${c.x && c.x.length ? `<div class="term-x"><span>Connects to</span>${c.x.map(x => `<button type="button" class="xlink" data-term="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
        <button type="button" class="term-mark" data-k="${esc(c.t)}">${S.cards[c.t] ? "Known ✓" : "I can explain this"}</button></div>`; };
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Terms</div><h1 class="vtitle">Every term, in pipeline order</h1>
      <p class="lede">Terms follow the Journey from toolchain to incident write-up. Each is tagged with the tool it belongs to and linked to the terms it connects with. Known: <b id="known">${known}</b>/${all.length}</p></header>
      <div class="filters" role="group" aria-label="Filter by tool"><button type="button" class="chip ${termFilter === "all" ? "on" : ""}" data-f="all">All tools</button>${tools.map(t => `<button type="button" class="chip ${termFilter === t ? "on" : ""}" data-f="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <div class="ai-panel"><div class="eyebrow">AI term maker</div><div id="aiC"></div></div>
      ${groups.map(g => `<section class="tphase"><h2><span class="ph-i">${PHASES.indexOf(g.ph) + 1}</span> ${esc(g.ph.name)}</h2>
        ${g.sts.map(x => `<div class="tstation"><div class="tst-h"><span class="eyebrow">Station ${x.i + 1}</span><b>${esc(x.s.title)}</b><button type="button" class="linkbtn" data-st="${x.i}">open station →</button></div>
          <div class="tgrid2">${x.cards.map(card).join("")}</div></div>`).join("")}</section>`).join("")}
      ${aiCards.length ? `<section class="tphase"><h2>Your AI terms</h2><div class="tgrid2">${aiCards.map(card).join("")}</div></section>` : ""}`;
    $$(".chip[data-f]", v).forEach(b => b.addEventListener("click", () => { termFilter = b.dataset.f; viewCards(v); }));
    $$("[data-st]", v).forEach(b => b.addEventListener("click", () => { const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]); const i = +b.dataset.st; journeyPos = (firstOpen === -1 || i <= firstOpen) ? i : firstOpen; go("journey"); }));
    $$(".xlink", v).forEach(b => b.addEventListener("click", () => {
      const el = document.getElementById("term-" + b.dataset.term.replace(/[^a-z0-9]+/gi, "-"));
      if (!el) { termFilter = "all"; viewCards(v); return; }
      el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    }));
    $$(".term-mark", v).forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.k, el = b.closest(".term");
      if (S.cards[k]) { delete S.cards[k]; b.textContent = "I can explain this"; el.classList.remove("known"); }
      else { S.cards[k] = true; b.textContent = "Known ✓"; el.classList.add("known"); addXP(3, k); }
      save(); $("#known", v).textContent = all.filter(c => S.cards[c.t]).length;
    }));
    aiBox($("#aiC", v), { label: "Explain a term", input: "Any term, e.g. R8, bitcode, ANR, notarization", json: true,
      prompt: term => `${AI_CONTEXT}\n\nMake a glossary entry for: ${term}\nReply with only one JSON object: {"term": "the term, short", "def": "1-2 sentence accurate definition in mobile release engineering, naming the tool it belongs to and where it happens in the pipeline", "analogy": "one-sentence analogy a 10-year-old gets"}.`,
      onJSON: c => {
        if (!c || !str(c.term) || !str(c.def)) throw new Error("The term came back incomplete. Try again.");
        S.gen.cards.push({ term: str(c.term, 40), def: str(c.def, 400), analogy: str(c.analogy, 300) || "" }); S.gen.cards = S.gen.cards.slice(-30); save();
        viewCards(v); toast(`Term added: ${str(c.term, 40)}`);
      } });
  }

  /* =========================================================
     SPRINTS
     ========================================================= */
  function viewSprints(v) {
    S.sprint = S.sprint || {};
    const done = (sp, i) => !!S.sprint[sp.n + ":" + i];
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Sprints</div><h1 class="vtitle">Fourteen weeks, seven sprints</h1>
      <p class="lede">A suggested plan that builds the RouteReady and StayReady labs in the same order as the Journey. It assumes about 8–10 hours a week. Store accounts, review and macOS access can add elapsed time, so treat dates as targets, not promises. Tick deliverables as you finish them; ticks are saved in this browser.</p></header>
      <div class="sprint-rail">${SPRINTS.map(sp => { const t = sp.deliver.length, d = sp.deliver.filter((_, i) => done(sp, i)).length; return `<div class="sr ${d === t ? "full" : d ? "part" : ""}"><b>S${sp.n}</b><span>${esc(sp.weeks)}</span><i style="width:${Math.round(d / t * 100)}%"></i></div>`; }).join("")}</div>
      ${SPRINTS.map(sp => `<section class="sprint">
        <div class="sp-head"><span class="sp-n">Sprint ${sp.n}</span><span class="sp-w">${esc(sp.weeks)} · ${esc(sp.hours)}</span></div>
        <h2>${esc(sp.goal)}</h2>
        <div class="sp-grid">
          <div><div class="bp-k">Deliverables</div>${sp.deliver.map((d, i) => `<label class="kp"><input type="checkbox" id="sp${sp.n}_${i}" data-k="${sp.n}:${i}" ${done(sp, i) ? "checked" : ""}><span>${esc(d)}</span></label>`).join("")}
            <div class="bp-k" style="margin-top:12px">Exit test</div><p class="done-when">${esc(sp.exit)}</p></div>
          <div class="sp-links">
            ${sp.stations.length ? `<div class="bp-k">Journey stations</div>${sp.stations.map(id => { const i = JOURNEY.findIndex(s => s.id === id); return `<button type="button" class="linkbtn" data-st="${i}">${i + 1}. ${esc(JOURNEY[i].title)}</button>`; }).join("")}` : ""}
            ${sp.drills.length ? `<div class="bp-k">Drills</div>${sp.drills.map(n => `<button type="button" class="linkbtn" data-drill="${n}">Drill ${n}: ${esc(DRILLS.find(d => d.n === n).t)}</button>`).join("")}` : ""}
            ${sp.diagrams.length ? `<div class="bp-k">Blueprints</div>${sp.diagrams.map(id => `<button type="button" class="linkbtn" data-bp="${id}">${esc(DIAGRAMS.find(d => d.id === id).t)}</button>`).join("")}` : ""}
          </div>
        </div></section>`).join("")}`;
    $$("input[data-k]", v).forEach(cb => cb.addEventListener("change", () => {
      if (cb.checked) { S.sprint[cb.dataset.k] = true; addXP(10, "Sprint deliverable"); } else delete S.sprint[cb.dataset.k];
      save(); viewSprints(v);
    }));
    $$("[data-st]", v).forEach(b => b.addEventListener("click", () => { const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]); const i = +b.dataset.st; journeyPos = (firstOpen === -1 || i <= firstOpen) ? i : firstOpen; go("journey"); }));
    $$("[data-drill]", v).forEach(b => b.addEventListener("click", () => { pendingDrill = +b.dataset.drill; go("drills"); }));
    $$("[data-bp]", v).forEach(b => b.addEventListener("click", () => { bpTab = b.dataset.bp; go("blueprints"); }));
  }

  /* =========================================================
     DOCS — reference
     ========================================================= */
  const DOC_LINKS = [
    ["Apple: release a version update in phases", "https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases"],
    ["Android: Play App Signing", "https://developer.android.com/studio/publish/app-signing"],
    ["fastlane: GitHub Actions integration", "https://docs.fastlane.tools/best-practices/continuous-integration/github/"],
    ["fastlane: match", "https://docs.fastlane.tools/actions/match/"],
    ["fastlane: setup_ci", "https://docs.fastlane.tools/actions/setup_ci/"],
    ["fastlane: upload_to_testflight", "https://docs.fastlane.tools/actions/upload_to_testflight/"],
    ["GitHub: security hardening for Actions", "https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions"],
    ["GitHub: OpenID Connect", "https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect"],
    ["Microsoft: App Center retirement", "https://learn.microsoft.com/en-us/appcenter/retirement"],
    ["Expo: runtime versions", "https://docs.expo.dev/eas-update/runtime-versions/"]
  ];
  const CHEATS = [
    ["Xcode", ["xcodebuild -version && xcode-select -p", "xcodebuild -showdestinations -scheme RouteReady", "xcrun simctl list devices available", "xcodebuild -showBuildSettings -scheme RouteReady | grep PRODUCT_BUNDLE_IDENTIFIER", "security cms -D -i profile.mobileprovision", "security find-identity -v -p codesigning", "dwarfdump --uuid RouteReady.app.dSYM"]],
    ["Fastlane", ["bundle exec fastlane ios verify destination:\"$(./scripts/pick-simulator.sh)\"", "bundle exec fastlane ios package build_number:57", "bundle exec fastlane ios beta ipa:build/ios/RouteReady.ipa manifest:…", "bundle exec fastlane android package version_code:10512", "bundle exec fastlane run delete_keychain name:fastlane_tmp_keychain"]],
    ["Android / Gradle", ["java -version && ./gradlew --version", "./gradlew lint testDebugUnitTest assembleDebug", "./gradlew :app:bundleRelease", "keytool -printcert -jarfile app-release.aab", "./gradlew :app:dependencies --configuration releaseRuntimeClasspath"]],
    ["Git / GitHub", ["git switch -c feat/eta-confidence", "gh pr create --fill", "gh run list --workflow pr-ci.yml", "gh run rerun <id> --failed"]],
    ["Release evidence", ["shasum -a 256 RouteReady.ipa", "jq . evidence/release-manifest.json", "./scripts/verify-manifest.sh <artifact> <manifest>", "./scripts/record-state.sh ios uploaded"]],
    ["Backend", ["docker buildx imagetools inspect $IMAGE", "oasdiff breaking base.yaml contracts/openapi.yaml --fail-on ERR", "./scripts/smoke.sh $STAGING_API_URL"]]
  ];
  function viewDocs(v) {
    const sec = [["glance", "Pipeline at a glance"], ["lanes", "Fastlane lane contract"], ["events", "Pipeline events and gates"], ["manifest", "Release manifest fields"], ["states", "Store states"], ["secrets", "Secrets: where they live"], ["cheats", "Command cheat sheets"], ["official", "Official docs"], ["repofiles", "Reference repo files"]];
    const tbl = (head, rows) => `<div class="tablewrap"><table class="jd"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Docs</div><h1 class="vtitle">Reference</h1>
      <p class="lede">Everything you'd look up mid-interview or mid-build, in one place. Tables follow the same order as the Journey.</p></header>
      <div class="docs">
        <nav class="toc" aria-label="On this page">${sec.map(([id, t], i) => `<button type="button" data-go="${id}"><span>${i + 1}</span>${esc(t)}</button>`).join("")}</nav>
        <div class="docbody">
          <section id="d-glance"><h2>1. Pipeline at a glance</h2>${tbl(["#", "Station", "Phase", "First command / config", "Sprint"], JOURNEY.map((s, i) => [String(i + 1), `<button type="button" class="linkbtn" data-st="${i}">${esc(s.title)}</button>`, esc(PHASES.find(p => p.id === s.phase).name), `<code>${esc(String(s.tools[0]).split("\n")[0])}</code>`, (SPRINTS.find(sp => sp.stations.includes(s.id)) || {}).n ? "S" + SPRINTS.find(sp => sp.stations.includes(s.id)).n : "–"]))}</section>
          <section id="d-lanes"><h2>2. Fastlane lane contract</h2>${tbl(["Lane", "Does", "Never"], [["<code>ios verify</code>", "Simulator build + tests, xcresult saved", "Load signing secrets"], ["<code>ios package</code>", "Preflight, setup_ci, match readonly, signed IPA + dSYMs, manifest", "Create or revoke certificates"], ["<code>ios beta</code>", "Verify checksum, upload existing IPA, record 'uploaded'", "Rebuild"], ["<code>ios promote</code>", "Submit existing build for review, phased release", "Upload a new binary"], ["<code>android verify</code>", "Lint, unit tests, debug build", "Load keystores"], ["<code>android package</code>", "Signed AAB with upload key, fingerprint preflight, manifest", "Use the debug key"], ["<code>android beta</code>", "Upload existing AAB to internal track", "Rebuild"], ["<code>android promote</code>", "Promote versionCode to production staged rollout", "Upload a new AAB"]])}</section>
          <section id="d-events"><h2>3. Pipeline events and gates</h2>${tbl(["Trigger", "Work", "Must not", "Evidence"], [["Pull request", "Lint, unit, contract, integration, simulator/emulator tests", "Load signing keys, publish, deploy prod", "Test reports, logs"], ["Merge to main", "Trusted validation, immutable images, staging deploy, smoke", "Imply app-store release", "SHA, image digest, staging checks"], ["Explicit beta", "Allocate number, sign, archive, upload to test track", "Rebuild on retry, log secrets", "Checksums, symbols, states"], ["Promotion", "Verify candidate + approvals, promote existing build", "Recompile, bypass review", "Manifest, approval, state"], ["Nightly", "Device matrix, dependency scans, drills", "Unlimited macOS minutes", "Flake history, owners"]].map(r => r.map(esc)))}</section>
          <section id="d-manifest"><h2>4. Release manifest fields</h2>${tbl(["Field", "Why"], [["application_id, platform", "Which app"], ["marketing_version, build_number", "Which release and binary"], ["git_sha, workflow_run_id, toolchain", "Where it came from"], ["artifact_sha256, symbol_artifact_ids", "Proves the bytes; enables crash symbolication"], ["backend_image_digest, api_contract_revision, tested_client_versions", "Compatibility evidence"], ["feature_flag_defaults, target_track, approvals", "What ships and who approved"], ["store_state, distribution_status", "Separate truthful states"], ["NEVER: tokens, passwords, keys, personal data", "It's shared evidence"]].map(r => r.map(esc)))}</section>
          <section id="d-states"><h2>5. Store states</h2>${Object.values(STATES).map(tr => `<h3>${esc(tr.name)}</h3><ol class="mdlist">${tr.items.map(([a, b]) => `<li><b>${esc(a)}</b> — ${esc(b)}</li>`).join("")}</ol>`).join("")}</section>
          <section id="d-secrets"><h2>6. Secrets: where they live</h2>${tbl(["Secret", "GitHub environment", "Used by"], [["MATCH_GIT_URL, MATCH_PASSWORD", "release-ios", "ios package (readonly match)"], ["ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8_BASE64", "release-ios, production", "ios beta, promote"], ["UPLOAD_KEYSTORE_BASE64 + passwords + alias", "release-android", "android package"], ["PLAY_JSON_KEY", "release-android, production", "android beta, promote"], ["(none)", "PR workflows", "PR jobs see no secrets"]].map(r => r.map(esc)))}</section>
          <section id="d-cheats"><h2>7. Command cheat sheets</h2><div class="cheats">${CHEATS.map(([t, cmds]) => `<div class="copyable"><div class="so-head"><h3>${esc(t)}</h3><button type="button" class="btn small" data-copy="${esc(t)}">Copy</button></div><div class="code small"><pre class="copysrc">${cmds.map(esc).join("\n")}</pre></div></div>`).join("")}</div></section>
          <section id="d-official"><h2>8. Official docs</h2><p class="sub">Links open in a new tab. Pages move; search the title if one 404s.</p><ul class="mdlist">${DOC_LINKS.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join("")}</ul></section>
          <section id="d-repofiles"><h2>9. Reference repo files</h2>${typeof REPO === "object" ? fileBtns(Object.keys(REPO).filter(p => !p.startsWith("drills/")), "") : "<p>Not loaded.</p>"}</section>
        </div>
      </div>`;
    $$(".toc button", v).forEach(b => b.addEventListener("click", () => { const el = $("#d-" + b.dataset.go, v); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    $$("[data-st]", v).forEach(b => b.addEventListener("click", () => { const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]); const i = +b.dataset.st; journeyPos = (firstOpen === -1 || i <= firstOpen) ? i : firstOpen; go("journey"); }));
    $$("[data-copy]", v).forEach(b => b.addEventListener("click", () => { const c = CHEATS.find(x => x[0] === b.dataset.copy); copyText(c[1].join("\n"), b); }));
    bindFileBtns(v);
  }

  /* =========================================================
     INTERVIEW ROOM
     ========================================================= */
  let ivTab = "tech", iqIdx = 0, starIdx = 0, walkProj = "RouteReady";
  function viewInterview(v) {
    const tabs = [["tech", "Technical questions"], ["star", "STAR stories"], ["builder", "STAR builder"], ["walk", "8-minute walkthrough"], ["rubric", "Rubric"]];
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Interview Room</div><h1 class="vtitle">Say it out loud, then check it</h1>
      <p class="lede">Technical answers get scored against key points. Behavioral answers use STAR: <b>S</b>ituation, <b>T</b>ask, <b>A</b>ction, <b>R</b>esult. Keep every story honest about being a portfolio lab.</p></header>
      <div class="filters" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === ivTab}" class="chip ${k === ivTab ? "on" : ""}" data-t="${k}">${l}</button>`).join("")}</div>
      <div id="ivbody"></div>`;
    $$(".chip[data-t]", v).forEach(b => b.addEventListener("click", () => { ivTab = b.dataset.t; viewInterview(v); }));
    const body = $("#ivbody", v);
    ({ tech: ivTech, star: ivStar, builder: ivBuilder, walk: ivWalk, rubric: ivRubric })[ivTab](body);
  }
  function clock(sec) { const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, "0")}`; }
  function ivTech(b) {
    const it = IQ[iqIdx];
    let left = 120, running = false, t;
    b.innerHTML = `
      <div class="ivq">
        <div class="ivq-top"><span class="eyebrow">Question ${iqIdx + 1} of ${IQ.length}${S.iq[iqIdx] != null ? ` · best ${S.iq[iqIdx]}/${it.k.length}` : ""}</span>
        <span class="timer"><span id="tclock">2:00</span><button type="button" class="btn small" id="tbtn">Start 2-min timer</button></span></div>
        <p class="bigq">${esc(it.q)}</p>
        <label class="sr" for="ans">Your answer</label>
        <textarea id="ans" rows="6" placeholder="Talk through it out loud first. Jot the points you made here."></textarea>
        <div class="row"><button type="button" class="btn primary" id="rev">Score me</button><button type="button" class="btn ghost" id="rnd">Random question</button><button type="button" class="btn ghost" id="nxt">Next →</button></div>
        <div id="aiIQ" class="ai-stack"></div>
        <div id="kp" hidden>
          <div class="eyebrow">Tick the points you actually made</div>
          <div class="kps">${it.k.map((k, i) => `<label class="kp"><input type="checkbox" id="kp${iqIdx}_${i}"><span>${esc(k)}</span></label>`).join("")}</div>
          <div class="row"><button type="button" class="btn primary" id="saveKp">Save score</button><span id="kpmsg" class="sub"></span></div>
        </div>
      </div>`;
    $("#tbtn", b).addEventListener("click", e => {
      if (running) { clearInterval(t); running = false; e.target.textContent = "Resume"; return; }
      running = true; e.target.textContent = "Pause";
      t = setInterval(() => { left--; $("#tclock", b).textContent = clock(Math.max(0, left)); if (left <= 0) { clearInterval(t); running = false; e.target.textContent = "Time"; $("#tclock", b).classList.add("over"); } }, 1000);
      timers.push(t);
    });
    $("#rev", b).addEventListener("click", () => { $("#kp", b).hidden = false; $("#kp", b).scrollIntoView({ behavior: "smooth", block: "nearest" }); });
    $("#rnd", b).addEventListener("click", () => { iqIdx = Math.floor(Math.random() * IQ.length); ivTech(b); });
    $("#nxt", b).addEventListener("click", () => { iqIdx = (iqIdx + 1) % IQ.length; ivTech(b); });
    aiBox($("#aiIQ", b), { label: "AI feedback on my answer", json: true, cache: false,
      prompt: () => { const a = $("#ans", b).value.trim(); if (a.length < 20) throw new Error("Type your answer first (a few sentences)."); return `${AI_CONTEXT}\n\nInterview question: ${it.q}\nKey points a strong answer covers (0-indexed): ${it.k.map((k, i) => i + ": " + k).join(" | ")}\nThe candidate answered: """${a.slice(0, 5000)}"""\nReply with only one JSON object: {"covered": [indexes of key points the answer genuinely covers], "score": 0|1|2, "verdict": "one sentence", "strengths": ["..."], "missing": ["..."], "better": "a stronger 4-6 sentence answer in first person"}.`; },
      onJSON: (f, out) => {
        renderFeedback(out, f);
        $("#kp", b).hidden = false;
        (Array.isArray(f.covered) ? f.covered : []).forEach(i => { const cb = $(`#kp${iqIdx}_${+i}`, b); if (cb) cb.checked = true; });
        out.insertAdjacentHTML("afterbegin", `<p class="sub">Covered points are ticked below. Adjust them if you disagree, then save your score.</p>`);
      } });
    aiBox($("#aiIQ", b), { label: "Ask me a harder follow-up", compact: true, cache: false,
      prompt: () => `${AI_CONTEXT}\n\nYou are the interviewer. The question was: ${it.q}\nThe candidate said: """${($("#ans", b).value.trim() || "(no notes)").slice(0, 3000)}"""\nAsk ONE harder follow-up question that probes a gap or adds a complication (for example, what happens to already-installed clients). Then on a new line, "What a strong answer includes:" with 3 short bullets.` });
    $("#saveKp", b).addEventListener("click", () => {
      const got = $$(".kp input", b).filter(x => x.checked).length;
      const prev = S.iq[iqIdx] || 0;
      if (got > prev || S.iq[iqIdx] == null) { addXP(Math.max(0, got - prev) * 6, "Interview answer"); S.iq[iqIdx] = Math.max(got, prev); save(); }
      $("#kpmsg", b).textContent = got >= it.k.length - 1 ? `${got}/${it.k.length}. Senior-level answer.` : `${got}/${it.k.length}. Try again and hit the missing points.`;
    });
  }
  function ivStar(b) {
    const it = STARQ[starIdx];
    b.innerHTML = `
      <div class="starlist">${STARQ.map((s, i) => `<button type="button" class="chip ${i === starIdx ? "on" : ""}" data-s="${i}">${esc(s.q.replace(/^Tell me about (a time )?/, "").replace(/\.$/, ""))}</button>`).join("")}</div>
      <div class="ivq">
        <p class="bigq">${esc(it.q)}</p>
        <div class="eli"><div class="eli-k">STAR, like you're 10</div><p>STAR is telling a story about a time you fixed something: where you were (Situation), what you had to do (Task), what <i>you</i> did, step by step (Action), and how it turned out and how you know (Result). Like explaining to your parents how you fixed the bike chain: "I was riding to school, the chain fell off, I flipped the bike and hooked it back on starting at the small gear, and I made it on time and now I check it every morning."</p></div>
        <p class="hint">Practice first: cover the model, say your version out loud in about 90 seconds, then reveal and compare. This one is built from drill ${it.drill}.</p>
        <button type="button" class="btn" id="showStar">Reveal model STAR</button>
        <div class="star4" id="star4" hidden>
          <div class="s4 s"><b>S</b><span>Situation</span><p>${esc(it.S)}</p></div>
          <div class="s4 t"><b>T</b><span>Task</span><p>${esc(it.T)}</p></div>
          <div class="s4 a"><b>A</b><span>Action</span><p>${esc(it.A)}</p></div>
          <div class="s4 r"><b>R</b><span>Result</span><p>${esc(it.R)}</p></div>
        </div>
        <label class="sr" for="myStar">Your version</label>
        <textarea id="myStar" rows="6" placeholder="Type your version here: Situation, Task, Action, Result."></textarea>
        <div id="aiSt" class="ai-stack"></div>
        <div class="row"><button type="button" class="btn ghost" id="runIt">Run drill ${it.drill} to earn this story</button></div>
      </div>`;
    $$(".chip[data-s]", b).forEach(c => c.addEventListener("click", () => { starIdx = +c.dataset.s; ivStar(b); }));
    $("#showStar", b).addEventListener("click", e => { $("#star4", b).hidden = false; e.target.hidden = true; if (!S.star["m" + starIdx]) { S.star["m" + starIdx] = true; save(); addXP(10, "STAR story reviewed"); } });
    $("#runIt", b).addEventListener("click", () => { pendingDrill = it.drill; go("drills"); });
    aiBox($("#aiSt", b), { label: "AI feedback on my STAR", json: true, cache: false,
      prompt: () => { const a = $("#myStar", b).value.trim(); if (a.length < 40) throw new Error("Write your STAR version first."); return `${AI_CONTEXT}\n\nBehavioral question: ${it.q}\nModel STAR (for reference): S: ${it.S} T: ${it.T} A: ${it.A} R: ${it.R}\nThe candidate's STAR answer: """${a.slice(0, 5000)}"""\nJudge structure (clear S, T, A, R), ownership ("I" not "we"), specificity, verification in the result, and honesty (portfolio lab, no invented numbers). ${FEEDBACK_SHAPE}`; },
      onJSON: (f, out) => renderFeedback(out, f) });
  }
  function ivBuilder(b) {
    const prompts = {
      S: ["Situation", "Where and when? Name the lab and the symptom. Say 'portfolio lab' so nobody mistakes it for employer work."],
      T: ["Task", "What were YOU responsible for? One or two sentences."],
      A: ["Action", "What did you do, in order? Use 'I', name real commands or checks, say what you ruled out."],
      R: ["Result", "How did it turn out and how do you know? Name the verification and the prevention. Only real, measured numbers."]
    };
    b.innerHTML = `
      <div class="ivq">
        <p class="hint">Start from any drill's auto-generated story, then make it yours. The checks below flag common STAR mistakes interviewers notice.</p>
        <div class="row"><label for="seed" class="sub">Start from drill</label>
        <select id="seed"><option value="">— blank —</option>${DRILLS.map(d => `<option value="${d.n}">${d.n}. ${esc(d.t)}</option>`).join("")}</select></div>
        <div class="builder">${Object.entries(prompts).map(([k, [n, h]]) => `<div class="bfield s4 ${k.toLowerCase()}"><b>${k}</b><span>${n}</span><label class="sr" for="st${k}">${n}</label><textarea id="st${k}" rows="4" placeholder="${esc(h)}"></textarea></div>`).join("")}</div>
        <div class="checks" id="checks"></div>
        <div class="row"><button type="button" class="btn primary" id="copyStar">Copy my STAR</button><span class="sub" id="wc"></span></div>
        <div id="aiSB" class="ai-stack"></div>
      </div>`;
    const f = k => $("#st" + k, b);
    const saved = S.star.draft || {};
    ["S", "T", "A", "R"].forEach(k => { f(k).value = saved[k] || ""; });
    function check() {
      const s = f("S").value, t = f("T").value, a = f("A").value, r = f("R").value;
      const all = [s, t, a, r].join(" ");
      const words = all.trim() ? all.trim().split(/\s+/).length : 0;
      const tests = [
        [/\b(lab|portfolio|practice|sandbox|mock)\b/i.test(s), "Situation says it's a portfolio lab, not employer work"],
        [/\b(I|my)\b/.test(t), "Task names your own responsibility"],
        [(a.match(/\bI\b/g) || []).length >= 2, "Action uses 'I' for what you did (not 'we')"],
        [/(`|\b(ran|checked|compared|inspected|traced|added|built|split|pinned|wrote|turned|paused)\b)/i.test(a), "Action names concrete steps or commands"],
        [/\b(verif|test|passed|fail|evidence|proved|confirmed)/i.test(r), "Result says how you know it worked"],
        [/\b(prevent|preflight|regression|runbook|guard|gate|so it can't|next time)/i.test(r), "Result includes prevention"],
        [!/(\$\s?\d|\d+\s?(k|K|million)\s?(users|customers)|production outage)/.test(all), "No invented production metrics or dollar figures"],
        [words >= 120 && words <= 320, "About 90 seconds spoken (120–320 words)"]
      ];
      $("#checks", b).innerHTML = tests.map(([ok, l]) => `<div class="ck ${ok ? "ok" : ""}"><span>${ok ? "✓" : "·"}</span>${esc(l)}</div>`).join("");
      $("#wc", b).textContent = `${words} words`;
      S.star.draft = { S: s, T: t, A: a, R: r }; save();
      if (tests.every(x => x[0]) && !S.star.built) { S.star.built = true; save(); addXP(40, "STAR story passes every check"); }
    }
    ["S", "T", "A", "R"].forEach(k => f(k).addEventListener("input", check));
    $("#seed", b).addEventListener("change", e => {
      const d = DRILLS.find(x => x.n === +e.target.value); if (!d) return;
      const st = starFor(d); ["S", "T", "A", "R"].forEach(k => (f(k).value = st[k])); check();
    });
    $("#copyStar", b).addEventListener("click", e => copyText(["S", "T", "A", "R"].map(k => `${k} — ${f(k).value}`).join("\n"), e.target));
    aiBox($("#aiSB", b), { label: "AI coach: review and rewrite", json: true, cache: false,
      prompt: () => { const parts = ["S", "T", "A", "R"].map(k => `${k}: ${f(k).value.trim()}`); if (parts.join("").length < 60) throw new Error("Fill in your story first, or start from a drill."); return `${AI_CONTEXT}\n\nReview this STAR interview story:\n${parts.join("\n")}\nReply with only one JSON object: {"S": {"ok": true|false, "tip": "one sentence"}, "T": {...}, "A": {...}, "R": {...}, "honesty": ["any claim that sounds invented or like employer experience; empty if none"], "rewrite": {"S": "...", "T": "...", "A": "...", "R": "..."}}. The rewrite keeps the learner's facts, uses "I", stays honest about being a portfolio lab, and is about 150-250 words total.`; },
      onJSON: (r, out) => {
        const keys = ["S", "T", "A", "R"];
        out.innerHTML = `<div class="fb-k">Section by section</div><ul>${keys.map(k => `<li><b>${k}</b> ${r[k] && r[k].ok ? "✓" : "·"} ${esc((r[k] && r[k].tip) || "")}</li>`).join("")}</ul>
          ${Array.isArray(r.honesty) && r.honesty.length ? `<div class="fb-k miss">Honesty check</div><ul>${r.honesty.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<div class="fb-k ok">Honesty check passed</div>`}
          ${r.rewrite && keys.every(k => str(r.rewrite[k])) ? `<div class="row"><button type="button" class="btn primary" id="useRw">Use the rewrite</button></div>` : ""}`;
        const u = $("#useRw", out); if (u) u.addEventListener("click", () => { keys.forEach(k => { f(k).value = str(r.rewrite[k]); }); check(); toast("Rewrite applied. Make it yours."); });
      } });
    check();
  }
  function ivWalk(b) {
    const segs = WALK[walkProj];
    let sec = 0, running = false, t;
    b.innerHTML = `
      <div class="ivq">
        <div class="ivq-top">
          <div class="filters">${Object.keys(WALK).map(p => `<button type="button" class="chip ${p === walkProj ? "on" : ""}" data-p="${p}">${p}</button>`).join("")}</div>
          <span class="timer"><span id="wclock">0:00</span><span class="sub">/ 8:00</span><button type="button" class="btn small primary" id="wbtn">Start</button><button type="button" class="btn small ghost" id="wreset">Reset</button></span>
        </div>
        <div class="wprog"><i id="wfill"></i></div>
        <ol class="walk">${segs.map(([m, h, txt], i) => `<li data-i="${i}"><span class="wm">${m}</span><div><b>${esc(h)}</b><p>${esc(txt)}</p></div><label class="wck"><input type="checkbox" id="w${walkProj}${i}"><span class="sr">Covered</span></label></li>`).join("")}</ol>
        <p class="hint">Show real artifacts on screen as you go: the PR, the lane, the manifest, the failing and passing runs. Finish with what is still BLOCKED or SIMULATED.</p>
        <label class="sr" for="walkNotes">Walkthrough notes</label>
        <textarea id="walkNotes" rows="5" placeholder="Paste or jot what you said for each minute, then get feedback."></textarea>
        <div id="aiW" class="ai-stack"></div>
      </div>`;
    $$(".chip[data-p]", b).forEach(c => c.addEventListener("click", () => { walkProj = c.dataset.p; ivWalk(b); }));
    const paint = () => {
      $("#wclock", b).textContent = clock(sec);
      $("#wfill", b).style.width = Math.min(100, sec / 480 * 100) + "%";
      const cur = Math.min(7, Math.floor(sec / 60));
      $$(".walk li", b).forEach((li, i) => { li.classList.toggle("now", running && i === cur); li.classList.toggle("past", i < cur && sec > 0); });
    };
    $("#wbtn", b).addEventListener("click", e => {
      if (running) { clearInterval(t); running = false; e.target.textContent = "Resume"; paint(); return; }
      running = true; e.target.textContent = "Pause";
      t = setInterval(() => {
        sec++; paint();
        if (sec >= 480) {
          clearInterval(t); running = false; e.target.textContent = "Done";
          if (!S.walk[walkProj]) { S.walk[walkProj] = true; save(); addXP(50, `${walkProj} walkthrough`); }
        }
      }, 1000);
      timers.push(t);
    });
    $("#wreset", b).addEventListener("click", () => { clearInterval(t); ivWalk(b); });
    aiBox($("#aiW", b), { label: "AI feedback on my walkthrough", cache: false,
      prompt: () => { const n = $("#walkNotes", b).value.trim(); if (n.length < 60) throw new Error("Jot down what you said first."); return `${AI_CONTEXT}\n\nThe learner rehearsed an 8-minute ${walkProj} portfolio walkthrough. The expected outline: ${segs.map(([m, h, t]) => `${m} min ${h}: ${t}`).join(" | ")}\nTheir notes: """${n.slice(0, 6000)}"""\nGive feedback: which minutes were covered well, which were missing or weak, any claim that sounds like employer experience instead of a portfolio lab, and the single most important fix. Use short bullets. Under 220 words.`; } });
    paint();
  }
  function ivRubric(b) {
    b.innerHTML = `
      <div class="ivq">
        <p>Score each scenario 0–2 on six dimensions. A 10/12 with no security or release-model error is a good practice target, not a certification.</p>
        <div class="rubric self">${RUBRIC.map((r, i) => `<div class="rb"><span>${esc(r)}</span><span class="seg" role="group" aria-label="${esc(r)}">${[0, 1, 2].map(n => `<button type="button" data-r="${i}" data-n="${n}">${n}</button>`).join("")}</span></div>`).join("")}</div>
        <div class="res-score"><span class="big" id="rtot">0</span><span>/12</span></div>
        <h3>Questions to be ready for</h3>
        <ul class="plain">${IQ.slice(0, 8).map(q => `<li>${esc(q.q)}</li>`).join("")}</ul>
        <h3>Traps the examiner will set</h3>
        <ul class="plain">
          <li>You say "rollback." They ask exactly what is rolled back and what happens to already-installed clients.</li>
          <li>You describe lab work as job experience. They ask you to separate the portfolio lab from employment history.</li>
          <li>You say CI is green. They ask what the tests don't cover.</li>
        </ul>
      </div>`;
    b.querySelector(".ivq").insertAdjacentHTML("beforeend", `<div id="aiR" class="ai-stack"></div>`);
    aiBox($("#aiR", b), { label: "Mock examiner: give me a scenario", input: "Optional area, e.g. signing, rollback, tenant leak", optional: true, cache: false,
      prompt: area => `${AI_CONTEXT}\n\nAct as the interview examiner. Give ONE incident scenario${area ? ` about ${area}` : ""}: the symptom and a 4-6 line redacted log excerpt in a code block. Do NOT give the answer. End with: "Tell me your hypothesis, next diagnostic command, containment, fix, verification and prevention." Then a line "Rubric:" listing the six dimensions: ${RUBRIC.join("; ")}.` });
    const sc = Array(6).fill(0);
    $$(".seg button", b).forEach(x => x.addEventListener("click", () => {
      const i = +x.dataset.r; sc[i] = +x.dataset.n;
      $$(`.seg button[data-r="${i}"]`, b).forEach(y => y.classList.toggle("on", y === x));
      $("#rtot", b).textContent = sc.reduce((a, c) => a + c, 0);
    }));
  }

  /* =========================================================
     REFERENCE REPO
     ========================================================= */
  let repoFile = "README.md";
  const hasRepo = () => typeof REPO === "object" && REPO;
  function openFile(p) { if (hasRepo() && REPO[p]) { repoFile = p; go("repo"); } }
  function fileBtns(paths, cls = "") {
    return `<div class="filelinks ${cls}">${paths.filter(p => hasRepo() && REPO[p]).map(p => `<button type="button" class="fileln" data-file="${esc(p)}"><span class="fl-ico" aria-hidden="true">${p.endsWith(".md") ? "¶" : "{ }"}</span>${esc(p)}</button>`).join("")}</div>`;
  }
  function bindFileBtns(root) { $$(".fileln[data-file], [data-file].mdlink", root).forEach(b => b.addEventListener("click", () => openFile(b.dataset.file))); }
  function resolvePath(from, rel) {
    if (/^[a-z]+:/i.test(rel) || rel.startsWith("#")) return null;
    const parts = from.split("/").slice(0, -1);
    for (const seg of rel.split("/")) { if (seg === "..") parts.pop(); else if (seg && seg !== ".") parts.push(seg); }
    return parts.join("/");
  }
  function inlineMd(s, cur) {
    return s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, href) => {
        const raw = href.replace(/&amp;/g, "&");
        const p = resolvePath(cur, raw);
        if (p && REPO[p]) return `<button type="button" class="mdlink" data-file="${esc(p)}">${t}</button>`;
        if (/^https:\/\//.test(raw)) return `<a href="${esc(raw)}" target="_blank" rel="noopener">${t}</a>`;
        return t;
      });
  }
  function mdRender(text, cur) {
    const L = text.split("\n"); let html = "", i = 0;
    while (i < L.length) {
      const line = L[i];
      if (/^```/.test(line)) { let code = []; i++; while (i < L.length && !/^```/.test(L[i])) code.push(L[i++]); i++; html += `<pre class="mdcode">${esc(code.join("\n"))}</pre>`; continue; }
      if (/^\|/.test(line)) {
        const rows = []; while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
        const cells = r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        const head = cells(rows[0]), body = rows.slice(2).map(cells);
        html += `<div class="tablewrap"><table class="mdtable"><thead><tr>${head.map(h => `<th>${inlineMd(esc(h), cur)}</th>`).join("")}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inlineMd(esc(c).replace(/&lt;br&gt;/g, "<br>"), cur)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        continue;
      }
      let m;
      if ((m = line.match(/^(#{1,4})\s+(.*)/))) { const n = m[1].length; html += `<h${n + 1} class="mdh">${inlineMd(esc(m[2]), cur)}</h${n + 1}>`; i++; continue; }
      if ((m = line.match(/^<details><summary>(.*)<\/summary>/))) { html += `<details class="mddet"><summary>${esc(m[1])}</summary>`; i++; continue; }
      if (/^<\/details>/.test(line)) { html += "</details>"; i++; continue; }
      if (/^>\s?/.test(line)) { html += `<blockquote>${inlineMd(esc(line.replace(/^>\s?/, "")), cur)}</blockquote>`; i++; continue; }
      if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
        const ordered = /^\s*\d+\./.test(line); const items = [];
        while (i < L.length && /^\s*(?:[-*]|\d+\.)\s+/.test(L[i])) items.push(L[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
        html += `<${ordered ? "ol" : "ul"} class="mdlist">${items.map(t => { const cb = t.match(/^\[( |x)\]\s+(.*)/); return cb ? `<li class="cb">${cb[1] === "x" ? "☑" : "☐"} ${inlineMd(esc(cb[2]), cur)}</li>` : `<li>${inlineMd(esc(t), cur)}</li>`; }).join("")}</${ordered ? "ol" : "ul"}>`;
        continue;
      }
      if (!line.trim()) { i++; continue; }
      const para = []; while (i < L.length && L[i].trim() && !/^(#|```|\||>|\s*[-*]\s|\s*\d+\.\s|<\/?details)/.test(L[i])) para.push(L[i++]);
      html += `<p>${inlineMd(esc(para.join(" ")), cur)}</p>`;
    }
    return html;
  }
  function backlinks(p) {
    const out = [];
    JOURNEY.forEach((s, i) => { if ((REPO_LINKS.stations[s.id] || []).includes(p)) out.push({ k: "station", i, label: `Station ${i + 1}: ${s.title}` }); });
    DRILLS.forEach(d => { if ((REPO_LINKS.drills[d.n] || []).includes(p) || drillSlug(d) === p) out.push({ k: "drill", n: d.n, label: `Drill ${d.n}: ${d.t}` }); });
    BUGS.forEach(b => { if ((REPO_LINKS.bugs[b.id] || []).includes(p)) out.push({ k: "bug", id: b.id, label: `Bug Hunt: ${b.t}` }); });
    return out;
  }
  let zipLib = null;
  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (zipLib) return zipLib;
    zipLib = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; s.onload = () => res(window.JSZip); s.onerror = () => { zipLib = null; rej(new Error("load")); }; document.head.appendChild(s); });
    return zipLib;
  }
  let DL; // downloads capability
  (function initDL() { const c = window.claude; if (!c || typeof c.use !== "function") { DL = null; return; } Promise.resolve(c.use("downloads")).then(d => { DL = d || null; const b = $("#dlRepo"); if (b) b.hidden = !DL; }, () => { DL = null; }); })();
  function viewRepo(v) {
    if (!hasRepo()) { v.innerHTML = `<p>The reference repo didn't load.</p>`; return; }
    const paths = Object.keys(REPO);
    if (!REPO[repoFile]) repoFile = "README.md";
    const dirs = {};
    paths.forEach(p => { const d = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : ""; (dirs[d] = dirs[d] || []).push(p); });
    const dirNames = Object.keys(dirs).sort((a, b) => a === "" ? -1 : b === "" ? 1 : a.localeCompare(b));
    const openDir = repoFile.includes("/") ? repoFile.slice(0, repoFile.lastIndexOf("/")) : "";
    const content = REPO[repoFile];
    const isMd = repoFile.endsWith(".md");
    const bl = backlinks(repoFile);
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Reference Repo · routeready-mobile-devops</div><h1 class="vtitle">The files behind every station</h1>
      <p class="lede">Real workflows, Fastlane lanes, release scripts, contracts and drill write-ups. Versions are <code>&lt;VERIFY&gt;</code> placeholders and app code isn't included, so treat it as a reference to clone and fill in, not a verified pipeline.</p>
      <div class="row"><button type="button" class="btn primary" id="dlRepo" ${DL ? "" : "hidden"}>Download repo (.zip)</button><button type="button" class="btn ghost" id="toReadme">README</button><span class="sub">${paths.length} files</span></div></header>
      <div class="repo">
        <nav class="tree" aria-label="Repository files">${dirNames.map(d => `<details class="tdir" ${d === "" || d === openDir || openDir.startsWith(d + "/") ? "open" : ""}><summary>${esc(d || "/ (root)")}</summary>
          ${dirs[d].map(p => `<button type="button" class="tfile ${p === repoFile ? "on" : ""}" data-file="${esc(p)}">${esc(p.split("/").pop())}</button>`).join("")}</details>`).join("")}</nav>
        <article class="viewer copyable">
          <div class="vbar"><span class="vpath">${esc(repoFile)}</span><button type="button" class="btn small" id="copyFile">Copy file</button></div>
          ${bl.length ? `<div class="usedin"><span class="eyebrow">Used in</span>${bl.map((x, i) => `<button type="button" class="chip" data-bl="${i}">${esc(x.label)}</button>`).join("")}</div>` : ""}
          ${isMd ? `<div class="md">${mdRender(content, repoFile)}</div>` : `<div class="code fileview"><pre class="copysrc">${content.split("\n").map((l, i) => `<span class="lno">${i + 1}</span>${esc(l)}`).join("\n")}</pre></div>`}
          <div id="aiRepo" class="ai-stack"></div>
        </article>
      </div>`;
    $$(".tfile", v).forEach(b => b.addEventListener("click", () => { repoFile = b.dataset.file; viewRepo(v); $(".viewer", v).scrollIntoView({ block: "start", behavior: "smooth" }); }));
    bindFileBtns(v);
    $("#toReadme", v).addEventListener("click", () => { repoFile = "README.md"; viewRepo(v); });
    $("#copyFile", v).addEventListener("click", e => copyText(content, e.target));
    $$("[data-bl]", v).forEach(b => b.addEventListener("click", () => {
      const x = bl[+b.dataset.bl];
      if (x.k === "station") { const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]); journeyPos = (firstOpen === -1 || x.i <= firstOpen) ? x.i : firstOpen; go("journey"); }
      else if (x.k === "drill") { pendingDrill = x.n; go("drills"); }
      else { pendingBug = x.id; go("bugs"); }
    }));
    $("#dlRepo", v).addEventListener("click", async e => {
      const btn = e.target; btn.disabled = true; const label = btn.textContent; btn.textContent = "Zipping…";
      try {
        const JSZip = await loadJSZip(); const zip = new JSZip(); const root = zip.folder("routeready-mobile-devops");
        paths.forEach(p => root.file(p, REPO[p], p.startsWith("scripts/") ? { unixPermissions: "755" } : {}));
        const data = await zip.generateAsync({ type: "uint8array", platform: "UNIX" });
        await DL.save({ filename: "routeready-mobile-devops.zip", data });
        toast("Repo zip ready");
      } catch (err) { toast(err && err.code === "declined" ? "Download cancelled" : "Couldn't prepare the download. Try again."); }
      finally { btn.disabled = false; btn.textContent = label; }
    });
    aiBox($("#aiRepo", v), { label: "Explain this file", compact: true,
      prompt: () => `${AI_CONTEXT}\n\nExplain this reference file from the learner's lab repo, ${repoFile}:\n\`\`\`\n${content.slice(0, 12000)}\n\`\`\`\nGive: what it's for and where it sits in the code-to-customer pipeline (1-2 sentences), the 3-5 lines that matter most and why, what to fill in before it runs (any <VERIFY> or <pin-...> placeholders), and a 10-year-old analogy. Under 250 words.` });
    aiBox($("#aiRepo", v), { label: "Ask", input: "Ask about this file, e.g. 'why is cancel-in-progress false here?'", cache: false,
      prompt: q => `${AI_CONTEXT}\n\nFile ${repoFile}:\n\`\`\`\n${content.slice(0, 12000)}\n\`\`\`\nQuestion: ${q}\nAnswer in under 200 words, quoting line contents where useful.` });
  }


  /* =========================================================
     DAY ONE — you've just been hired
     ========================================================= */
  function toolCard(id, os) {
    const t = TOOLS[id]; if (!t) return "";
    if (os === "mac" && id === "wsl") return "";
    if (os === "win" && id === "brew") return "";
    const k = "tool:" + id, done = S.setup && S.setup[k];
    return `<div class="toolc ${done ? "done" : ""}">
      <div class="toolc-h"><b>${esc(t.name)}</b><span class="tag">${esc(t.cost)}</span></div>
      <p>${esc(t.what)}</p>
      <p class="sub"><b>Runs on:</b> ${esc(t.os)}</p>
      <div class="code small"><pre>${esc(t.check)}</pre></div>
      <label class="kp"><input type="checkbox" id="${k}" data-k="${k}" ${done ? "checked" : ""}><span>Installed / checked</span></label></div>`;
  }
  function bindToolChecks(root, rerender) {
    $$("input[data-k^='tool:'], input[data-k^='ob:']", root).forEach(cb => cb.addEventListener("change", () => {
      S.setup = S.setup || {};
      if (cb.checked) { S.setup[cb.dataset.k] = true; addXP(5, "Setup step"); } else delete S.setup[cb.dataset.k];
      save(); rerender && rerender();
    }));
  }
  function viewDayOne(v) {
    S.setup = S.setup || {}; const os = S.os || "mac";
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Day One · ${esc(STORY.role)} at ${esc(STORY.company)}</div><h1 class="vtitle">You've just been hired</h1>
      <p class="lede">${esc(STORY.intro)}</p></header>
      <div class="filters" role="group" aria-label="Your computer"><span class="sub" style="align-self:center">Your computer:</span>${[["mac", "Mac"], ["win", "Windows"], ["linux", "Linux"]].map(([k, l]) => `<button type="button" class="chip ${os === k ? "on" : ""}" data-os="${k}">${l}</button>`).join("")}</div>
      <ol class="obline">${ONBOARD.map((o, i) => { const k = "ob:" + i, done = S.setup[k]; return `<li class="${done ? "done" : ""}">
        <div class="ob-day">${esc(o.day)}</div>
        <div class="ob-body"><h2>${esc(o.t)}</h2><p>${esc(o.what)}</p>
          <div class="eli"><div class="eli-k">Explain it like I'm 10</div><p>${esc(o.an)}</p></div>
          ${o.tools.length ? `<div class="toolgrid">${o.tools.map(id => toolCard(id, os)).join("")}</div>` : ""}
          <p class="ob-action"><b>Do this:</b> ${esc(o.action)}</p>
          <label class="kp"><input type="checkbox" id="${k}" data-k="${k}" ${done ? "checked" : ""}><span>Done</span></label>
        </div></li>`; }).join("")}</ol>
      <div class="row"><button type="button" class="btn primary" id="toTicket">Open your first ticket: ${esc(TICKETS[JOURNEY[0].id].id)} →</button></div>`;
    $$("[data-os]", v).forEach(b => b.addEventListener("click", () => { S.os = b.dataset.os; save(); viewDayOne(v); }));
    bindToolChecks(v, () => viewDayOne(v));
    $("#toTicket", v).addEventListener("click", () => { journeyPos = 0; go("journey"); });
  }


  /* =========================================================
     JIRA-STYLE issues + board
     ========================================================= */
  const TYPE_ICON = { Story: "▣", Bug: "●", Spike: "◆", Task: "✓", Incident: "▲" };
  function sprintOf(id) { const sp = SPRINTS.find(x => x.stations.includes(id)); return sp ? sp.n : null; }
  function statusOf(id) { if (S.journey[id]) return "Done"; const i = JOURNEY.findIndex(s => !S.journey[s.id]); return JOURNEY[i] && JOURNEY[i].id === id ? "In Progress" : "To Do"; }
  function issueHTML(st) {
    const tk = TICKETS[st.id], is = ISSUE[st.id]; if (!tk || !is) return "";
    const ep = EPICS[st.phase], sp = sprintOf(st.id), status = statusOf(st.id);
    return `<div class="jira">
      <div class="jr-top"><span class="jr-type t-${is.type.toLowerCase()}">${TYPE_ICON[is.type] || "▣"} ${esc(is.type)}</span><span class="jr-key">${esc(tk.id)}</span><span class="jr-status s-${status.replace(" ", "").toLowerCase()}">${esc(status)}</span></div>
      <h2 class="jr-sum">${esc(st.title)}</h2>
      <div class="jr-fields">
        <div><span>Epic (feature)</span><b class="jr-epic c-${ep.color}">${esc(ep.key)} · ${esc(ep.name)}</b></div>
        <div><span>Sprint</span><b>${sp ? "MOB Sprint " + sp : "Backlog"}</b></div>
        <div><span>Story points</span><b>${is.pts}</b></div>
        <div><span>Priority</span><b>${esc(is.prio)}</b></div>
        <div><span>Assignee</span><b>${esc(JIRA.assignee)}</b></div>
        <div><span>Reporter</span><b>${esc(JIRA.reporter)}</b></div>
        <div class="wide"><span>Labels</span><b>${is.labels.map(l => `<i class="jr-label">${esc(l)}</i>`).join("")}</b></div>
      </div>
      <div class="jr-sec"><div class="bp-k">User story</div><p class="jr-story">${esc(is.story)}</p></div>
      <div class="jr-sec"><div class="bp-k">Description (from ${esc(JIRA.reporter.split(" ")[0])})</div><p>${esc(tk.ask)}</p></div>
      <div class="jr-sec"><div class="bp-k">Acceptance criteria</div><ul class="jr-ac">${is.ac.map(a => `<li>${esc(a)}</li>`).join("")}</ul></div>
      <div class="jr-sec"><div class="bp-k">Sub-tasks</div><ol class="jr-sub">${is.sub.map((t, i) => `<li><span class="jr-key">${esc(tk.id)}-${i + 1}</span> ${esc(t)}</li>`).join("")}</ol></div>
    </div>`;
  }
  let boardSprint = "all";
  function viewBoard(v) {
    const cols = ["To Do", "In Progress", "Done"];
    const items = JOURNEY.map((st, i) => ({ st, i, is: ISSUE[st.id], tk: TICKETS[st.id], sp: sprintOf(st.id), status: statusOf(st.id) })).filter(x => boardSprint === "all" || String(x.sp) === boardSprint);
    const pts = items.reduce((a, x) => a + x.is.pts, 0), donePts = items.filter(x => x.status === "Done").reduce((a, x) => a + x.is.pts, 0);
    v.innerHTML = `
      <header class="vhead"><div class="eyebrow">Board · ${esc(JIRA.project)} (${esc(JIRA.projectName)})</div><h1 class="vtitle">Your sprint board</h1>
      <p class="lede">Every Journey ticket as a Jira-style issue. Epics are features, issues are user stories (plus a bug, a spike and an incident), each with story points and a sprint. Finish a ticket's checkpoint to move it to Done.</p></header>
      <div class="filters" role="group" aria-label="Sprint"><button type="button" class="chip ${boardSprint === "all" ? "on" : ""}" data-sp="all">All sprints</button>${SPRINTS.map(sp => `<button type="button" class="chip ${boardSprint === String(sp.n) ? "on" : ""}" data-sp="${sp.n}">Sprint ${sp.n}</button>`).join("")}</div>
      <div class="jr-burn"><b>${donePts}</b> of ${pts} story points done${boardSprint !== "all" ? ` · ${esc(SPRINTS.find(x => String(x.n) === boardSprint).goal)}` : ""}<span class="jr-bar"><i style="width:${pts ? Math.round(donePts / pts * 100) : 0}%"></i></span></div>
      <div class="jr-epics">${Object.entries(EPICS).map(([ph, e]) => `<span class="jr-epic c-${e.color}">${esc(e.key)} · ${esc(e.name)}</span>`).join("")}</div>
      <div class="board">${cols.map(c => `<div class="bcol"><div class="bcol-h">${c} <span>${items.filter(x => x.status === c).length}</span></div>
        ${items.filter(x => x.status === c).map(x => `<button type="button" class="bcard2" data-i="${x.i}">
          <span class="bc-sum">${esc(x.st.title)}</span>
          <span class="jr-epic c-${EPICS[x.st.phase].color} small">${esc(EPICS[x.st.phase].name)}</span>
          <span class="bc-foot"><span class="jr-type t-${x.is.type.toLowerCase()}">${TYPE_ICON[x.is.type]}</span><span class="jr-key">${esc(x.tk.id)}</span><span class="bc-sp">S${x.sp}</span><span class="bc-pts">${x.is.pts}</span></span></button>`).join("") || `<p class="sub">Nothing here.</p>`}</div>`).join("")}</div>`;
    $$("[data-sp]", v).forEach(b => b.addEventListener("click", () => { boardSprint = b.dataset.sp; viewBoard(v); }));
    $$(".bcard2", v).forEach(b => b.addEventListener("click", () => { const firstOpen = JOURNEY.findIndex(s => !S.journey[s.id]); const i = +b.dataset.i; journeyPos = (firstOpen === -1 || i <= firstOpen) ? i : firstOpen; if (i > journeyPos) toast("Finish earlier tickets first; showing the next open one."); go("journey"); }));
  }

  /* ---------- boot ---------- */
  buildNav(); renderPlayer(); route();
  $("#guideBtn").addEventListener("click", () => openIntro(0));
  $("#intro").addEventListener("close", () => { if (!S.seenIntro) { S.seenIntro = true; save(); } if ((location.hash || "#home") === "#home") route(); });
  $("#intro").addEventListener("click", e => { if (e.target.id === "intro") closeIntro(); });
  if (!S.seenIntro) openIntro(0);
  window.addEventListener("hashchange", route);
})();
