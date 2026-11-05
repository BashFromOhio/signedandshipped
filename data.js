/* Signed & Shipped — game content. Built from the Mobile DevOps Portfolio and Interview Playbook.
   Convention: in every multiple-choice item, o[0] is the correct answer. The engine shuffles. */

/* ---------- THE JOURNEY: code to customer, in the real order ---------- */
const PHASES = [
  { id: "build", name: "Build", blurb: "Get code ready and proven safe to merge.",
    why: "Prove a change is safe before it touches main. Code here is untrusted, so nothing in this phase ever sees a signing key or store password.",
    analogy: "The homework check at the classroom door. The checker looks at your work, but never gets the keys to the office.",
    ask: "How do you keep secrets away from fork pull requests?" },
  { id: "integrate", name: "Integrate", blurb: "Merge to main, build trusted artifacts, ship the backend first.",
    why: "Turn merged code into exact, fingerprinted artifacts, rehearse them in staging, and ship the backend change first so every installed app version keeps working.",
    analogy: "Dress rehearsal on the real stage, and building the new bike-rack slots before the kids with new bikes arrive, while keeping the old slots.",
    ask: "Why does the API change ship before the app?" },
  { id: "package", name: "Package", blurb: "Number it, sign it, fingerprint it.",
    why: "Give the build a number nobody else has, sign it with keys that only come out for that minute, and write down exactly what it is so you can prove it later.",
    analogy: "A deli ticket number, a wax seal from the king, and a packing slip with fingerprints.",
    ask: "How do you prove the promoted artifact is the one you tested?" },
  { id: "release", name: "Release", blurb: "Beta, approval, store review, gradual rollout.",
    why: "Move the same binary through beta, approval, store review and a gradual rollout, and report each state truthfully. Uploaded is not released.",
    analogy: "Mailing a package (dropped off, sorting, out for delivery), getting the principal's signature, then letting kids onto the water slide a few at a time.",
    ask: "Apple phased release vs Google Play staged rollout: what can you control?" },
  { id: "operate", name: "Operate", blurb: "Watch it, fix it, learn from it.",
    why: "Watch the release with the right symbols, contain problems you can't uninstall from phones, ship the fix, and write down what changes next time.",
    analogy: "Labeled smoke detectors, sending a quick 'ignore that!' text because you can't un-send the first one, and the notes after a fire drill.",
    ask: "What does rollback mean for a binary that's already installed?" }
];

/* ---------- THE GAME PLAN: how to tackle this, step by step ---------- */
const PLAN = [
  { n: 1, t: "Learn the words", modes: [["cards", "Flashcards"], ["blueprints", "Blueprints"]],
    what: "Flip the 22 flashcards and tap through the 4 Blueprints. If 'upload key' and 'app signing key' sound like the same thing, every later step is harder.",
    an: "Learn the names of the tools before you build the treehouse.",
    done: "15 cards marked known and all 4 blueprints opened" },
  { n: 2, t: "Walk the Journey in order", modes: [["journey", "Journey"]],
    what: "Clear all 16 stations, phase by phase: Build → Integrate → Package → Release → Operate. This road is the backbone of every interview answer. When you get stuck in the room, find where you are on it.",
    an: "Walk the route to school once, slowly, before you try to run it.",
    done: "16 of 16 stations cleared" },
  { n: 3, t: "Bust the myths", modes: [["quiz", "Myth Busters"]],
    what: "Play rounds of 10 until you score 8 or more on the first try. These are the exact wrong ideas old articles teach and interviewers like to catch.",
    an: "Unlearn the playground rumors before someone quizzes you on them.",
    done: "Best round of 8/10 or higher" },
  { n: 4, t: "Work the controls", modes: [["gates", "Pipeline Gates"], ["states", "Release States"], ["rollback", "Rollback Lab"]],
    what: "Sort work into the right pipeline event, put store states in order for both platforms, and pick the right levers when something breaks. These are the 'which button do I press' skills.",
    an: "Know what every light switch does before the power goes out.",
    done: "14/14 gates, both state tracks, 5/5 rollback scenarios" },
  { n: 5, t: "Hunt the bugs", modes: [["bugs", "Bug Hunt"]],
    what: "Read 12 real-looking workflows, Fastfiles, API handlers and manifests, and tap the lines that would hurt you. Reviewing config is half of this job.",
    an: "Spot-the-difference, except the differences break the app.",
    done: "12 of 12 files fixed" },
  { n: 6, t: "Run the incident drills", modes: [["drills", "Incident Drills"]],
    what: "Do the six priority drills first (1, 3, 4, 10, 11, 16), then the other 14. Each one ends with a STAR story and an incident note. Score 8/10 to mark it VERIFIED.",
    an: "Fire drills: practice the emergency while nothing is actually on fire.",
    done: "6 priority drills, then all 20" },
  { n: 7, t: "Rehearse the interview", modes: [["interview", "Interview Room"]],
    what: "Answer the 12 technical questions out loud on a 2-minute timer, build one STAR story that passes every check, and do one full 8-minute walkthrough. Then go run these drills for real in your own repo.",
    an: "Dress rehearsal with the stage lights on.",
    done: "12 questions scored, 1 STAR story, 1 walkthrough" }
];

const JOURNEY = [
  {
    id: "toolchain", phase: "build", title: "Pin the toolchain",
    what: "Before writing app code, record an exact, compatible set of tools: Xcode, macOS runner image, simulator runtime, Swift, Android SDK, JDK, Gradle wrapper, Android Gradle Plugin, Kotlin, Node, React Native, Ruby, Bundler, Fastlane, Python and Java. Pick versions from official compatibility docs and runners that actually exist. Commit lockfiles and the Gradle wrapper checksum. Note the date you verified it.",
    analogy: "Imagine the whole class baking the same cake. If one kid uses a different oven temperature and a different kind of flour, their cake comes out weird and nobody knows why. Pinning the toolchain means everyone uses the same recipe card, the same oven setting and the same flour brand.",
    tools: ["xcodebuild -version", "xcode-select -p", "xcodebuild -showdestinations -scheme RouteReady", "xcrun simctl list devices available", "java -version && ./gradlew --version", "bundle lock && git add Gemfile.lock"],
    jd: ["Xcode, Gradle, Fastlane"],
    done: "docs/toolchain.md lists every version with the date verified; lockfiles and wrapper checksum are committed; CI prints toolchain versions into its logs.",
    drills: [5, 6],
    check: { q: "CI used to pass. The hosted runner image updated overnight and now xcodebuild says 'Unable to find a destination'. What was the process gap?", o: ["The runner image and simulator destination were not pinned and detected; the job relied on whatever macos-latest shipped", "The Swift code had a bug that only shows on new simulators", "The signing certificate expired overnight", "GitHub Actions is down"], w: "Toolchain drift. Pin the runner image and Xcode, detect real destinations, and upgrade through a reviewed toolchain PR." }
  },
  {
    id: "branch", phase: "build", title: "Branch small, hide unfinished work",
    what: "Work on a short-lived feature branch off protected main. Keep changes small so review is real. Anything not ready for users goes behind a feature flag (like eta_confidence_enabled), so main stays releasable at all times. No permanent develop branch.",
    analogy: "It's like borrowing a library book: take it out, read it, bring it back fast. If you keep it for months, the library changes and your book no longer fits on the shelf. A feature flag is like a curtain on a stage: the set can be built behind it while the show goes on.",
    tools: ["git switch -c feat/eta-confidence", "git commit -m \"Add ETA confidence behind flag\"", "gh pr create --fill"],
    jd: ["Git/trunk-based development"],
    done: "Branch lives hours or a few days, PR is small, new behavior defaults OFF behind a flag.",
    drills: [],
    check: { q: "Why is main expected to be releasable at all times in trunk-based development?", o: ["Small merges plus feature flags mean any commit on main could become a release candidate without waiting for a big integration", "Because main deploys to the App Store automatically", "Because develop holds the unfinished work", "Because reviewers never look at main"], w: "Main being releasable comes from small changes and flags. It does NOT mean every merge goes to the store." }
  },
  {
    id: "prci", phase: "build", title: "Pull request CI (untrusted)",
    what: "When the PR opens, CI runs lint, unit tests, API contract checks, backend integration tests, iOS simulator build/tests on macOS and Android Gradle build/tests on Linux. This code is untrusted, especially from forks: read-only token, no signing keys, no store credentials, no production deploys. Superseded runs get cancelled. Reports upload even on failure.",
    analogy: "This is the spelling-and-math check before you turn in homework. And because it's a stranger's homework, the substitute teacher checking it does NOT get the keys to the principal's office. The checker can look, but can't unlock anything.",
    tools: ["on: pull_request", "permissions: { contents: read }", "concurrency: { group: pr-${{ github.ref }}, cancel-in-progress: true }", "bundle exec fastlane ios verify", "bundle exec fastlane android verify", "openapi-diff contracts/v1-prev.yaml contracts/openapi.yaml"],
    jd: ["Mobile build/test/release automation", "Web/backend CI/CD"],
    done: "A deliberately failing unit test and a breaking contract change each block merge; a fork cannot read a canary secret.",
    drills: [8, 9, 10],
    check: { q: "Which trigger is safe for running a fork's PR code?", o: ["pull_request, with read-only permissions and no secrets", "pull_request_target with the PR head checked out", "pull_request_target with secrets in env", "push to main"], w: "pull_request_target runs in the base repo's privileged context. Checking out and running fork code there hands strangers your secrets." }
  },
  {
    id: "gate", phase: "build", title: "Required check, review, merge",
    what: "One always-running aggregate check is the only required status. It reports success only if every job that applied to this change passed. Path-aware change detection decides which jobs apply, and shared things (contracts, lockfiles, workflows, config) trigger everything affected. A human reviews. Then merge to protected main.",
    analogy: "Think of a hall monitor at the door. Every kid in the group must show a hall pass. If the hall monitor goes home early, the line just stands there forever. So the hall monitor always shows up, even on days only one kid needs to pass.",
    tools: ["jobs.changes: dorny/paths-filter (pinned SHA)", "jobs.ci-gate: if: always()", "needs: [changes, ios, android, api, web]", "branch protection: require ci-gate + 1 review", "on: merge_group  # if using a merge queue"],
    jd: ["Git/trunk-based development", "Engineering guidance"],
    done: "Tests cover docs-only, mobile-only, contract-only, workflow-only and lockfile-only PRs; the gate never hangs pending.",
    drills: [9],
    check: { q: "A job that 'needs' a failed job gets skipped. If the required check is that skipped job, what happens?", o: ["GitHub treats skipped as passing, so a broken PR can merge. The gate needs if: always() and must check each result", "The PR is blocked forever", "GitHub reruns the failed job", "The PR closes automatically"], w: "Skipped jobs report success. That's why the aggregate job runs with if: always() and inspects needs.*.result." }
  },
  {
    id: "main", phase: "integrate", title: "Trusted main build + staging",
    what: "After merge, trusted validation repeats on main. Backend and web are built once into immutable artifacts: a container image identified by its sha256 digest, not a floating tag like :latest. That exact digest deploys to staging and integration smoke tests run against it. Merging to main does NOT mean a public app-store release.",
    analogy: "This is the dress rehearsal on the real stage with the real costumes. And every costume gets a name tag sewn in, so on opening night you know it's the exact same costume, not one that just looks similar.",
    tools: ["docker build -t $REGISTRY/routeready-api:$GITHUB_SHA services/api", "docker push $REGISTRY/routeready-api:$GITHUB_SHA", "docker buildx imagetools inspect $REGISTRY/routeready-api:$GITHUB_SHA  # read digest", "deploy image@sha256:<digest> to staging", "./scripts/smoke.sh staging"],
    jd: ["Web/backend CI/CD"],
    done: "Commit SHA, image digest and staging smoke results are recorded together.",
    drills: [13],
    check: { q: "Why deploy by image digest rather than a tag like :latest?", o: ["A digest names exactly one image; a tag can move, so what you tested might not be what runs", "Digests make images smaller", "Tags are not allowed in production", "Digests skip the registry"], w: "Tags are sticky notes that can be moved. A digest is a fingerprint." }
  },
  {
    id: "backend", phase: "integrate", title: "Backend first, additive only",
    what: "Deploy the additive API change before the mobile release. Keep /api/v1 and only add things: new optional fields, new endpoints. Never rename, remove or change a field's type that installed apps read. Contract tests run current and previous client fixtures against the candidate API. Marketing version (1.4 → 2.0) has nothing to do with API path versions. Use expand → backfill → transition → contract for database changes.",
    analogy: "You're building a new bike rack because next week kids get new bikes with wider tires. You build the new wide slots FIRST, and you keep the old skinny slots too, because lots of kids still ride old bikes. If you rip out the old slots, those kids have nowhere to park.",
    tools: ["openapi-diff --fail-on-incompatible prev.yaml openapi.yaml", "./gradlew :api:contractTest -PclientFixtures=v1.3,v1.4", "GET /api/v1/capabilities  # advertise new features", "migration 0007_expand_add_eta_confidence.sql"],
    jd: ["Systems design", "Web/backend CI/CD", "Release processes"],
    done: "Version 1 fixtures still pass while version 2 is tested; the new field is optional and the feature flag is off.",
    drills: [11, 14],
    check: { q: "Why must the backend change ship before the new app version?", o: ["The new app may reach some users before others, and old apps stay installed, so the API must already serve both", "Because the App Store requires it", "Because mobile builds take longer", "So the backend can force everyone to update"], w: "Mobile and API releases are coordinated, not atomic. Store review and users who delay updates mean many versions are installed at once." }
  },
  {
    id: "preflight", phase: "package", title: "Release preflight + build number",
    what: "An explicit release run (not every merge) starts with preflight: is this a trusted commit on main, correct application ID, correct target environment, required approvals and evidence present, signing access available? Then a single, concurrency-protected allocator reserves the next build number for that app and platform, persists it with the Git SHA, and never reuses it for a different binary. Retries reuse the same artifact.",
    analogy: "It's the take-a-number machine at the deli. Two customers can never get ticket 57. If your ticket falls on the floor, you pick up YOUR ticket again; you don't print a fresh one and cut the line. And a new deli location doesn't restart at ticket 1 when the old tickets are still in people's pockets.",
    tools: ["bundle exec fastlane release preflight", "concurrency: { group: release-ios-routeready, cancel-in-progress: false }", "./scripts/allocate-build-number.sh ios org.routeready.parent $GITHUB_SHA", "latest_testflight_build_number  # cross-check store", "google_play_track_version_codes(track: \"internal\")"],
    jd: ["Release processes", "Mobile build/test/release automation"],
    done: "Two parallel release jobs get distinct numbers; an upload retry refers to the original checksum without rebuilding.",
    drills: [4],
    check: { q: "Why not just use GITHUB_RUN_NUMBER as the build number?", o: ["It can collide across workflows, repeats on rerun, and resets in a new repo", "It's a string, not a number", "Apple rejects numbers over 100", "It isn't available on macOS runners"], w: "Build numbers need one durable allocator per app/platform, cross-checked with the store." }
  },
  {
    id: "sign", phase: "package", title: "Sign and package",
    what: "iOS: on a macOS runner, setup_ci makes a temporary keychain; match runs readonly to fetch the existing distribution certificate and profile; a signing preflight checks bundle ID, team, entitlements and profile; gym archives and exports an IPA plus dSYMs; the keychain is deleted even if the job fails. Android: decode the upload keystore from a protected secret into a temp file, build a signed AAB with Gradle, collect mapping.txt and native symbols, delete the keystore file always. Never regenerate or revoke team certificates to 'fix' a build.",
    analogy: "Signing is like a wax seal on a letter from the king. The seal proves who sent it and that nobody opened it. You keep the seal stamp in a locked drawer, take it out only for the minute you need it, and lock it away again. You never make a new seal just because the wax was cold.",
    tools: ["setup_ci", "match(type: \"appstore\", readonly: true)", "security find-identity -v -p codesigning", "gym(scheme: \"RouteReady\", export_method: \"app-store\")", "./gradlew :app:bundleRelease", "keytool -printcert -jarfile app-release.aab", "delete_keychain  # in an always-run cleanup"],
    jd: ["Xcode, Gradle, Fastlane", "Mobile build/test/release automation"],
    done: "Signed IPA/AAB exists, or the step is honestly marked BLOCKED (no accounts). Simulator success is recorded separately and never called distribution verification.",
    drills: [1, 2, 3],
    check: { q: "Simulator tests are green. What does that prove about distribution signing?", o: ["Nothing. Simulator builds don't use your distribution certificate, profile, entitlements or export", "Signing works", "Only the App Store icon is untested", "The provisioning profile is valid"], w: "Archive and export are where signing actually gets checked." }
  },
  {
    id: "manifest", phase: "package", title: "Release manifest + artifacts",
    what: "Write a machine-readable release manifest: application ID, platform, marketing version, build number, Git SHA, workflow run ID, toolchain versions, artifact SHA-256, symbol artifact IDs, backend image digest, API contract revision, tested client versions, feature-flag defaults, target track, approvals and distribution status. Store it with the IPA/AAB, dSYMs, mapping files and source maps, with a retention period longer than your support window. Never put tokens, passwords, keys or personal data in it.",
    analogy: "It's the packing slip inside a shipping box, plus a fingerprint of everything inside. If something goes wrong later, you read the slip and know exactly which toy, from which factory, on which day, went into that box.",
    tools: ["shasum -a 256 RouteReady.ipa", "dwarfdump --uuid RouteReady.app.dSYM", "jq . evidence/release-manifest.json", "actions/upload-artifact (pinned SHA) with retention-days"],
    jd: ["Release processes", "Observability"],
    done: "One native build can be traced from the manifest to its source, toolchain, backend compatibility evidence and symbols.",
    drills: [19],
    check: { q: "Which field must NEVER appear in a release manifest?", o: ["The keystore password", "The artifact SHA-256", "The backend image digest", "The API contract revision"], w: "The manifest is evidence that gets shared and stored. Secrets never belong there." }
  },
  {
    id: "beta", phase: "release", title: "Beta upload",
    what: "Upload the already-built artifact. Before uploading, verify SHA, application ID, version and checksum. iOS goes to TestFlight; Android goes to the Play internal testing track. A retry uploads the same file; it never recompiles. Then track separate states: uploaded, processing, available to testers. A green upload step is not 'released'.",
    analogy: "Mailing a package: you dropped it at the post office (uploaded). It's at the sorting center (processing). It's out for delivery (testers can install). Saying 'Grandma got her present' when you only dropped it off would be fibbing.",
    tools: ["upload_to_testflight(ipa: \"build/RouteReady.ipa\", skip_waiting_for_build_processing: true)", "upload_to_play_store(aab: \"build/app-release.aab\", track: \"internal\")", "./scripts/poll-store-state.sh --timeout 30m"],
    jd: ["Release processes", "Mobile build/test/release automation"],
    done: "Manifest records upload receipt, processing state and tester availability separately.",
    drills: [15],
    check: { q: "The upload job retried after a network error. What should it do?", o: ["Re-upload the same IPA/AAB with the same checksum and build number", "Rebuild from the same SHA to get a fresh binary", "Increment the build number and rebuild", "Skip upload and mark released"], w: "Rebuilding creates a different binary with different symbols. Retries are idempotent for the existing artifact." }
  },
  {
    id: "candidate", phase: "release", title: "Validate the production candidate",
    what: "Testers exercise the exact binary you intend to promote, pointed at the production configuration. A staging app that talks to a staging backend is a different binary, so it doesn't count. Preflight checks the compiled public config (API base URL, environment name) matches the target. Previous and current clients both pass contract tests against the live API.",
    analogy: "It's the taste test of the actual cake you're bringing to the party, not a cupcake made from the same batter. If you tested the cupcake and bring the cake, you didn't really test the cake.",
    tools: ["plutil -p Payload/RouteReady.app/Info.plist | grep API_BASE_URL", "bundletool dump manifest --bundle app-release.aab", "./scripts/preflight-env.sh production"],
    jd: ["Release processes", "Systems design"],
    done: "The candidate's checksum matches the manifest and its environment config matches production.",
    drills: [17],
    check: { q: "Your staging app (different bundle ID, staging API) passed testing. Can you promote it to production?", o: ["No. It's a different binary; test the production candidate itself", "Yes, same Git SHA means same app", "Yes, if the UI looks the same", "Only on Android"], w: "Same-artifact promotion works within one application identity and environment." }
  },
  {
    id: "approve", phase: "release", title: "Approval gate + store review",
    what: "A protected environment requires a named approver before promotion. The workflow verifies candidate, compatibility evidence, monitoring readiness and target track, then promotes the existing build. It does not silently recompile or skip review. Apple App Review and Google Play review are separate states you report truthfully, with bounded polling.",
    analogy: "The principal has to sign the field-trip form before the bus leaves. And the bus company also checks the form. Until both say yes, you don't tell parents the bus left.",
    tools: ["environment: production  # required reviewers", "deliver(submit_for_review: true, skip_binary_upload: true, build_number: \"57\")", "upload_to_play_store(track: \"internal\", track_promote_to: \"production\", rollout: \"0.1\", skip_upload_aab: true)"],
    jd: ["Release processes", "Engineering guidance"],
    done: "Approval, reviewer identity and review state are in the manifest.",
    drills: [15],
    check: { q: "Production promotion should...", o: ["Promote the eligible existing candidate after approval", "Recompile from main to pick up latest fixes", "Skip review if CI is green", "Upload a new build with the same number"], w: "Recompiling at promotion means you ship something nobody tested." }
  },
  {
    id: "rollout", phase: "release", title: "Phased / staged rollout + feature cohorts",
    what: "Apple phased release follows Apple's fixed 7-day schedule for automatic updates (1%, 2%, 5%, 10%, 20%, 50%, 100%). You can pause it, but anyone can still update manually and new installs get the new version. Google Play staged rollout lets you choose and raise the percentage, and halt it. Separately, backend feature flags expose new behavior to a cohort you control, and can turn it off for already-installed apps.",
    analogy: "Rollout is like letting kids onto a water slide a few at a time. But some kids can climb the stairs on their own (manual update), and you can't pull a kid back up once they've gone down. The feature flag is the light switch for the slide's water: you can turn it off for everyone already on it.",
    tools: ["App Store Connect: Phased Release for Automatic Updates", "upload_to_play_store(track: \"production\", rollout: \"0.2\", skip_upload_aab: true)", "PATCH /flags/eta_confidence_enabled  { cohort: \"beta-district-1\" }"],
    jd: ["Release processes", "Git/trunk-based development"],
    done: "You can explain which lever controls the binary and which controls the feature.",
    drills: [16],
    check: { q: "Why use feature flags if stores already stage releases?", o: ["Store rollout controls who gets the binary; flags control who sees the feature and can switch it off on installed apps", "Flags make the app smaller", "Store rollouts don't exist on iOS", "Flags replace App Review"], w: "Decouple shipping code from exposing behavior." }
  },
  {
    id: "observe", phase: "operate", title: "Observe with the right symbols",
    what: "Structured logs carry request IDs, app version/build, environment and redacted route/tenant identifiers. Crash reporting (optional Sentry) gets the exact dSYMs, mapping files and React Native source maps for that build's release/dist. Dashboards segment crash-free rate and API latency by release, OS, device and feature cohort. Targets are lab targets, not achieved results.",
    analogy: "Smoke detectors are great, but only if each one is labeled with its room. Symbols are the room labels. Without them the alarm says 'fire somewhere in a building' instead of 'kitchen, by the toaster'.",
    tools: ["sentry-cli debug-files upload --include-sources build/dSYMs", "sentry-cli sourcemaps upload --release $RELEASE --dist $BUILD", "grep request_id=7c1e logs/api.jsonl"],
    jd: ["Observability"],
    done: "A controlled crash resolves to the expected source line and correlates with a backend request ID.",
    drills: [19],
    check: { q: "Why can rebuilding the same Git SHA give unusable symbols?", o: ["Each build gets new binary UUIDs, so the new dSYM doesn't match the shipped binary", "Git SHAs change on rebuild", "Symbols expire after 24 hours", "Sentry only accepts the first upload"], w: "Keep the symbols from the exact build you shipped." }
  },
  {
    id: "incident", phase: "operate", title: "Respond: contain, fix, verify",
    what: "When something breaks: contain first (flag off, pause phased release or halt staged rollout, restore compatible backend), then fix the root cause (compatible backend fix, or a replacement binary with a higher build number), then verify against the actual failure, including the installed population. 'Rollback' must name what is rolled back: a backend digest, a flag, or a distribution. You cannot uninstall a binary from someone's phone.",
    analogy: "You can't un-send a text message. If you sent the wrong thing, you send a quick 'ignore that!' (flag off), stop forwarding it (pause rollout), and send the corrected message (new build). Pretending you can delete it from their phone doesn't work.",
    tools: ["PATCH /flags/eta_confidence_enabled false", "App Store Connect: Pause Phased Release", "upload_to_play_store(track: \"production\", rollout: \"0.2\", release_status: \"halted\", skip_upload_aab: true)", "deploy image@sha256:<previous-compatible-digest>"],
    jd: ["Debugging", "Release processes", "Observability"],
    done: "The affected installed build is handled, not just new installs.",
    drills: [11, 16, 12],
    check: { q: "Someone says 'just roll back' after a crash in iOS 1.5. What's the best response?", o: ["Ask what exactly is rolled back: binary distribution can be paused, the flag disabled, the backend reverted if compatible, but installed 1.5 stays until a new binary replaces it", "Roll back the App Store to 1.4", "Delete 1.5 from users' devices", "Restore the database"], w: "In mobile, rollback is mostly roll-forward with containment." }
  },
  {
    id: "learn", phase: "operate", title: "Write it up, prevent it",
    what: "A one-page incident note: impact and scope, first signal, timeline (relative), hypotheses rejected, root cause, containment, corrective change, regression test, prevention owner, and links to real evidence. No invented outage minutes or business losses. Turn the lesson into a preflight check, a test or a runbook line.",
    analogy: "After a fire drill, the teacher writes down what went well, what was slow, and what to change (like 'the back door sticks, fix the hinge'). Next time, the drill goes better because something actually changed.",
    tools: ["drills/04-duplicate-build-numbers/incident.md", "evidence/README.md links each claim to command output", "docs/incident-runbook.md"],
    jd: ["Debugging", "Engineering guidance", "Responsible AI"],
    done: "Each drill has a failing run, hypotheses, commands, fix, passing run and a short note.",
    drills: [4, 10],
    check: { q: "Which belongs in a lab incident note?", o: ["Relative timeline, rejected hypotheses, root cause, regression test and links to real evidence", "Estimated dollars lost", "A guess at how many users were affected in production", "Only the final fix"], w: "Lab evidence is honest evidence. Don't invent production numbers." }
  }
];

/* ---------- JD coverage ---------- */
const JD = [
  ["Mobile build/test/release automation", "Both native verification jobs, Fastlane lanes, signed-package and distribution evidence"],
  ["Xcode, Gradle, Fastlane", "Toolchain record, commands, signing diagnostics and failing/passing runs"],
  ["Web/backend CI/CD", "Separate API/web workflows and backward-compatibility tests"],
  ["Release processes", "Manifest, beta states, promotion gate, pause/roll-forward runbook"],
  ["Git/trunk-based development", "Small PR history, main protection and feature-flag rollout"],
  ["Systems design", "Authorization, idempotency, telemetry ordering, compatibility and migrations"],
  ["Debugging", "Twenty drill records with hypotheses and redacted logs"],
  ["Engineering guidance", "ADRs, reusable lane interfaces, checklists and review comments"],
  ["Responsible AI", "Small AI-assisted PR with human explanation, tests and rejected unsafe suggestions"],
  ["React Native / EAS", "StayReady native build evidence and optional comparison branch"],
  ["Observability", "Release-correlated crashes, symbols, API logs and incident evidence"]
];

/* ---------- MYTH BUSTERS QUIZ ---------- */
const QUIZ = [
  { t: "Rollout", q: "Your PM wants iOS 1.5 rolled out 5% → 25% → 100% with Apple's phased release. What actually happens?", o: ["Apple applies its own fixed 7-day schedule to automatic updates; anyone can still update manually", "You set the percentages in App Store Connect", "Phased release blocks manual downloads until 100%", "Phased release controls which users see the new feature"], w: "Phased release only affects automatic updates, on Apple's schedule (1, 2, 5, 10, 20, 50, 100%). For controlled exposure, use backend feature cohorts.", a: "It's like a school letting classes out for recess in a set order. You can't pick the order, and a kid with a hall pass can walk out anytime." },
  { t: "Rollout", q: "You pause a rollout after a crash spike. What happens to devices that already installed the build?", o: ["They keep it; you need a flag disable, compatible backend fix or replacement binary", "The store rolls them back to the previous version", "The app is disabled until you resume", "Google Play uninstalls it, Apple keeps it"], w: "Pausing stops new automatic distribution. It never removes an installed binary.", a: "Closing the cookie jar doesn't take cookies back out of kids' hands." },
  { t: "Tooling", q: "A tutorial builds its pipeline around App Center Build and Distribute. What's the issue?", o: ["Those services were retired on March 31, 2025; build new pipelines elsewhere", "Nothing; it is Microsoft's recommended path", "It only supports Android", "It requires Jenkins"], w: "App Center Build/Test/Distribute are retired. Its analytics/diagnostics had a separate, later end date. Don't build new pipelines on it.", a: "Following directions to a store that closed down." },
  { t: "Android", q: "With Play App Signing, which key signs your uploads?", o: ["Your upload key; Google re-signs with the app signing key it holds", "The app signing key, every time", "No key; Play signs unsigned bundles", "Your debug keystore"], w: "Upload key proves the upload came from you. App signing key, held by Google, is what devices check on updates.", a: "Your upload key is your library card. The app signing key is the library's official stamp in the book." },
  { t: "Android", q: "Which artifact goes to Google Play for publishing?", o: ["A signed AAB", "A debug APK", "An unsigned APK", "An IPA"], w: "AAB for Play. A debug APK is for direct local install.", a: "The AAB is a box of LEGO pieces; Play builds the right model for each phone." },
  { t: "Release", q: "Fastlane's upload_to_testflight finished green. What do you know?", o: ["The binary was uploaded. Processing, tester availability, review and release are separate states", "Testers can install it now", "It passed App Review", "It's live for 1% of users"], w: "Upload ≠ processed ≠ available ≠ approved ≠ released.", a: "Dropping a letter in the mailbox isn't the same as it being read." },
  { t: "API", q: "Your app goes from 1.4 to 2.0. What happens to the API path?", o: ["Nothing; keep /api/v1 with additive changes, independent of marketing version", "Move to /api/v2 to match", "Create /api/2.0", "Block 1.x clients"], w: "App marketing versions and API contract versions are independent.", a: "A new edition of your textbook doesn't mean the classroom number changes." },
  { t: "Release", q: "What does 'promote the same artifact' mean for mobile?", o: ["Move the exact tested binary (same checksum, app ID, build number) between eligible tracks without rebuilding", "Rebuild from the same Git SHA for production", "Copy the staging app to production even if it points at staging", "Merge the staging branch into main"], w: "Same bytes, same identity, same environment. Rebuilding produces a different binary.", a: "Bring the actual cake you taste-tested, not a new one from the same recipe." },
  { t: "Security", q: "Why is pull_request_target dangerous in a build workflow?", o: ["It runs with the base repo's secrets and write token, so running fork PR code there exposes them", "It cannot read the PR diff", "It only runs on forks", "It is deprecated"], w: "Never check out and execute an untrusted PR head in a privileged pull_request_target job.", a: "Letting a stranger use the teacher's desk, with the answer key in the drawer." },
  { t: "Security", q: "You set up cloud OIDC for staging deploys. What about your App Store Connect key and Android keystore?", o: ["They still need their own protected storage and rotation; OIDC doesn't replace them", "OIDC replaces them", "They can go in repository variables", "Commit them encrypted to the repo"], w: "OIDC handles cloud federation. Store credentials and signing assets are separate.", a: "A visitor badge gets you into the building. It doesn't open the safe." },
  { t: "iOS", q: "In CI, how should fastlane match run?", o: ["readonly: true, after setup_ci creates a temporary keychain", "readonly: false so it can repair expired certs", "With match nuke before each build", "Using the developer's login keychain"], w: "CI fetches existing signing assets; it never creates or revokes team certificates.", a: "CI gets to read the recipe card, not rewrite it." },
  { t: "Release", q: "Build numbers come from GITHUB_RUN_NUMBER. What goes wrong?", o: ["It can collide across workflows, repeat on rerun and reset in a new repo", "It's too large for iOS", "It isn't visible in logs", "Nothing"], w: "Use one durable, concurrency-safe allocator per app/platform.", a: "Two deli machines printing the same ticket numbers." },
  { t: "CI", q: "What should a dependency cache key include?", o: ["OS, architecture, toolchain version and lockfile hash", "Just the branch name", "Just runner.os", "The commit SHA, so every run misses"], w: "If an input can change the result, it belongs in the key.", a: "Label the lunchbox with whose it is and what day, or someone eats last week's sandwich." },
  { t: "CI", q: "A required workflow uses on.pull_request.paths. A docs-only PR opens. What happens?", o: ["The workflow never runs, so the required check stays pending and blocks merge", "GitHub marks it successful", "It runs anyway", "It fails"], w: "Workflow-level path filtering leaves required checks pending. Run an always-on aggregate job instead.", a: "The hall monitor stayed home, so the line never moves." },
  { t: "CI", q: "What concurrency setting fits release jobs?", o: ["Serialize per app/platform with cancel-in-progress: false so an upload is never killed mid-flight", "cancel-in-progress: true everywhere", "No concurrency; parallel is faster", "Cancel the release when a new commit lands"], w: "Cancel superseded PR runs; never cancel a store upload half-done.", a: "Don't yank a letter halfway out of the mail slot." },
  { t: "Backend", q: "A script tags routeready-api:1.4, pushes registry/routeready:latest, then deploys :latest. Best fix?", o: ["Build an explicit registry reference, push it, and deploy the verified image digest", "Push both tags", "Deploy :latest with imagePullPolicy Always", "Tag with the date"], w: "Tag one thing, push that thing, deploy its digest.", a: "You labeled the red box but mailed the blue one." },
  { t: "Security", q: "Where should the tenant for a StayReady request come from?", o: ["The server, from the authenticated identity", "The X-Tenant-Id header", "The app's theme config", "The reservation ID prefix"], w: "A client header, flag or app version is never an authorization decision.", a: "A kid can write any name on their name tag. The teacher checks the class list." },
  { t: "Backend", q: "Same idempotency key arrives with a different payload. The server should...", o: ["Reject it (e.g. 409 or 422); never silently return or overwrite", "Create a new request", "Return the original result anyway", "Overwrite the original"], w: "Same key + same payload = replay. Same key + different payload = client bug.", a: "Ticket #12 was for a hot dog. Showing ticket #12 and asking for pizza doesn't work." },
  { t: "RN/EAS", q: "A PR adds a native module. Can you ship it as an EAS Update to existing installs?", o: ["No. It needs a new binary with a new runtime version; old binaries lack the native code", "Yes, updates can add native code", "Yes if it's behind a flag", "Only on Android"], w: "OTA updates change JS and assets for a compatible runtime. Native changes need a new binary.", a: "You can send new game levels to a console, but you can't send it a new controller through Wi-Fi." },
  { t: "iOS", q: "Simulator tests are green. What does that prove about distribution signing?", o: ["Nothing; simulator builds don't use your distribution certificate, profile or export", "Signing is fine", "Only entitlements are untested", "Provisioning is verified"], w: "Archive/export is where distribution signing gets checked.", a: "Practicing in your bedroom doesn't prove you have a ticket to the concert." },
  { t: "Backend", q: "You need to remove a database column old servers still read. Safe sequence?", o: ["Expand → backfill → transition readers → contract later", "Drop it and roll back if needed", "Rename it in place", "Drop it during low traffic"], w: "Both server versions must work during a rolling deploy.", a: "Build the new hallway before closing the old one." },
  { t: "Backend", q: "Which check belongs in readiness, not liveness?", o: ["Database connection available", "Process responds at all", "Event loop not deadlocked", "Container started"], w: "Readiness: can I take traffic? Liveness: should I be restarted? Putting dependencies in liveness causes restart storms.", a: "'Are you awake?' is different from 'Do you have your homework?'" },
  { t: "Observability", q: "Crash reports are unsymbolicated. You rebuild the same SHA and upload its dSYM. Result?", o: ["Usually still broken: the new build's UUIDs don't match the shipped binary", "Fixed", "Fixed only on new iOS versions", "Fixed if the Xcode version matches"], w: "Keep and upload the exact symbols from the shipped build.", a: "A map of a different city, even if it was drawn by the same person." },
  { t: "Backend", q: "Telemetry arrives as seq 102 then seq 99 for the same bus. What happens to 99?", o: ["Stored idempotently, but it does not replace the newer position", "It replaces the current position", "The whole producer is rejected", "The route is replayed in order"], w: "Ordering policy prevents the bus from jumping backward. Freshness is shown from observed_at.", a: "An old postcard arriving late doesn't mean your friend went back home." },
  { t: "Android", q: "Your upload key is lost. What do you do?", o: ["Request an upload key reset in Play Console; the app signing key and users are unaffected", "Request an app signing key upgrade", "Publish a new app listing", "Wait for it to expire"], w: "Upload key problems are recoverable without touching the app signing key.", a: "Lost your library card? Get a new card. The library doesn't restamp every book." },
  { t: "Rollout", q: "Google Play staged rollout vs Apple phased release?", o: ["Play: you choose and change the percentage and can halt. Apple: fixed 7-day schedule you can pause", "They're identical", "Apple lets you pick percentages", "Play has no staged rollout"], w: "Know which knobs each platform gives you.", a: "Play gives you a dimmer switch. Apple gives you a timer you can pause." },
  { t: "Release", q: "Which field must never appear in a release manifest?", o: ["Keystore password", "Artifact SHA-256", "Backend image digest", "API contract revision"], w: "Manifests are shared evidence. No secrets, no personal data.", a: "A packing slip lists what's in the box, not the combination to your locker." },
  { t: "Git", q: "Which branching model fits this playbook?", o: ["Short-lived branches into protected main; flags hide unfinished work", "A permanent develop branch with Git Flow", "Commit straight to main without checks", "Long-lived release branches per feature"], w: "Trunk-based with protection, small PRs and flags.", a: "Return library books fast so the shelf never gets out of order." }
];

/* ---------- 20 INCIDENT DRILLS ----------
   Stages: Hypothesis, Next diagnostic, Contain & fix, Verify. Then a complication, then a senior follow-up. */
const STAGE_LABELS = ["Hypothesis", "Next diagnostic", "Contain & fix", "Verify"];
const DRILLS = [
  { n: 1, t: "iOS provisioning mismatch", p: "RouteReady", c: "Signing", pri: true,
    inj: "configured the release with an entitlement missing from its provisioning profile",
    an: "Your concert ticket is for Seat 12, but you're trying to sit in Seat 14. Practicing at home (simulator) never checked your ticket.",
    sym: "PR CI on the simulator is green. The explicit release run fails during export.",
    logT: "release-ios #212 · fastlane ios package",
    log: ["[13:02:04] gym: ▸ Archive Succeeded", "[13:02:11] gym: Exporting archive with export_method app-store", "error: exportArchive: Provisioning profile \"RouteReady AppStore\" doesn't include the com.apple.developer.associated-domains entitlement.", "error: exportArchive: Profile doesn't match the entitlements file's value for the application-identifier entitlement.", "** EXPORT FAILED **", "[13:02:12] Error building the application - see the log above"],
    s: [
      { q: "What's your leading hypothesis?", o: ["The profile doesn't cover the app's bundle ID/entitlements, a distribution-signing mismatch the simulator never exercised", "The simulator runtime is missing from the runner", "The Apple distribution certificate expired; revoke and regenerate everything"], w: "Archive succeeded, export failed on entitlements. That points at the identity/profile mapping." },
      { q: "Which command do you run next?", o: ["xcodebuild -showBuildSettings | grep -E 'PRODUCT_BUNDLE_IDENTIFIER|CODE_SIGN_ENTITLEMENTS|DEVELOPMENT_TEAM' and security cms -D -i the .mobileprovision", "xcrun simctl list devices available", "fastlane match nuke distribution"], w: "Compare what the target asks for against what the decoded profile grants." },
      { q: "How do you contain and fix it?", o: ["Stop the release; add the capability to the App ID and regenerate the profile through the authorized provisioning process; CI stays read-only", "Remove the entitlement from the app so export passes", "Set match readonly: false in CI so it repairs itself"], w: "Removing an entitlement is a product change. CI must never create or revoke team signing assets." },
      { q: "How do you verify?", o: ["A preflight fixture with the wrong mapping fails fast, and a real archive/export passes with valid assets, recorded in the manifest", "Simulator tests pass again", "Rerun until it's green"], w: "Verify the actual failure path, and add a guard that catches it earlier next time." }
    ],
    x: { t: "The admin regenerated the profile. CI still fails and the log shows the OLD profile UUID.", q: "What now?", o: ["A stale profile is cached on the runner or in a restored cache; make match fetch fresh and scope or clear only that cache", "Revoke the distribution certificate", "Switch CI to automatic signing with an admin Apple ID"], w: "Find which copy is being used before changing anything else." },
    f: { q: "Why does successful simulator testing say nothing about distribution signing?", a: "Simulator builds aren't signed with your distribution certificate, don't embed an App Store profile, and never go through export. Bundle ID, team, entitlements and profile are only validated at archive/export, so the simulator can't catch this class of failure." } },

  { n: 2, t: "Locked CI keychain", p: "RouteReady", c: "Signing", pri: false,
    inj: "skipped CI keychain setup on a disposable runner",
    an: "The seal stamp is in a locked drawer and nobody's there to type the code, so the job just stands there waiting.",
    sym: "codesign hangs until the job times out, or fails with 'errSecInternalComponent'.",
    logT: "release-ios #219 · fastlane ios package",
    log: ["[09:14:02] gym: /usr/bin/codesign --force --sign ●●●●●●●● --entitlements …", "[09:14:02] … no output …", "[09:44:02] Error: The operation was canceled. (timeout-minutes: 30)", "--- retry on a different runner ---", "Warning: unable to build chain to self-signed root for signer", "RouteReady.app: errSecInternalComponent"],
    s: [
      { q: "Leading hypothesis?", o: ["codesign can't access the private key non-interactively: the keychain is locked or the key partition list isn't set", "The certificate is missing from the match repo", "Apple's servers are slow"], w: "A hang with no output often means a hidden UI prompt asking for keychain access." },
      { q: "Next command?", o: ["security find-identity -v -p codesigning and security list-keychains -d user, to separate 'identity missing' from 'access denied'", "xcodebuild -showdestinations", "./gradlew --version"], w: "Distinguish credential absence from keychain access failure." },
      { q: "Fix?", o: ["Restore setup_ci (temporary unlocked keychain set as default), match readonly into it, and delete_keychain in a cleanup that always runs", "Unlock the login keychain permanently on the shared runner", "Raise the timeout to 90 minutes"], w: "Temporary, per-job, always cleaned up." },
      { q: "Verify?", o: ["Two fresh runners package without prompts, and a post-job check shows no temp keychain or .p12 left behind", "One green run on the same reused runner", "The simulator job passes"], w: "Prove it works from clean, and prove the secrets are gone." }
    ],
    x: { t: "On a self-hosted Mac, a job crashed mid-way. The next job on that runner finds a leftover keychain with the signing identity.", q: "What do you change?", o: ["Cleanup runs in an always()/ensure block, keychain names are unique per run, and a sweep step removes stragglers", "Stop using self-hosted runners forever", "Reuse the leftover keychain to save time"], w: "Assume jobs die. Cleanup has to survive that." },
    f: { q: "Why not leave a shared runner's keychain permanently unlocked?", a: "Any job that lands on that runner, including other projects or untrusted code, could sign arbitrary binaries with your identity. Keys sit on disk indefinitely, isolation and audit break, and you'd never know who used them." } },

  { n: 3, t: "Wrong Android upload key", p: "Either", c: "Signing", pri: true,
    inj: "pointed the package lane at a different test keystore",
    an: "You signed the permission slip with your friend's name. The office knows your signature and says no.",
    sym: "The Gradle build succeeds, but Play rejects the upload.",
    logT: "release-android #88 · fastlane android beta",
    log: ["> Task :app:bundleRelease", "BUILD SUCCESSFUL in 3m 12s", "[upload_to_play_store] Uploading app-release.aab to track 'internal'…", "Google Api Error: Invalid request - The Android App Bundle was signed with the wrong key.", "  Found: SHA1: 3B:●●:●●:…:91", "  Expected: SHA1: A7:●●:●●:…:0C"],
    s: [
      { q: "Leading hypothesis?", o: ["The AAB was signed with a key that isn't the registered upload key", "Google's app signing key was compromised and must be rotated", "The versionCode is a duplicate"], w: "The error compares two certificate fingerprints. That's the upload key." },
      { q: "Next command?", o: ["keytool -printcert -jarfile app-release.aab, and compare to the upload certificate in Play Console (not the app signing cert)", "adb install app-release.aab", "./gradlew clean"], w: "Two certificates are in play. Compare against the right one." },
      { q: "Fix?", o: ["Point the lane back at the intended upload keystore from the protected secret; if truly lost, use Play's upload key reset", "Request an app signing key upgrade", "Create a new app listing"], w: "Upload key problems don't need the app signing key touched." },
      { q: "Verify?", o: ["A fingerprint preflight blocks the wrong key before upload; a fixture test with the wrong test keystore fails", "Upload again and see", "Build a debug APK"], w: "Catch it before the store does." }
    ],
    x: { t: "A teammate suggests committing the keystore to the repo 'so this never happens again'.", q: "Your answer?", o: ["No. Keep it in a secret manager/protected environment, decode to a temp file per job, delete it in an always step; the preflight catches mismatches", "Fine, if it's base64-encoded", "Fine, if the password is in gradle.properties"], w: "Encoding is not encryption, and repos get cloned everywhere." },
    f: { q: "Why shouldn't an upload-key incident trigger app signing key replacement?", a: "The app signing key is held by Google and is what installed apps verify updates against. The upload key only authenticates your uploads to Play. An upload key reset doesn't affect users at all, while an app signing key upgrade is heavyweight and unnecessary here." } },

  { n: 4, t: "Duplicate build numbers", p: "Either", c: "Release", pri: true,
    inj: "launched two release jobs at the same time against the same counter",
    an: "Two deli machines both printed ticket 57. Only one customer gets served; the other is confused.",
    sym: "One upload succeeds, the other is rejected, and a retry creates an ambiguous artifact.",
    logT: "release-ios #418 / #419",
    log: ["release-ios #418  sha=9f2c4e1  build_number=57  upload ✔", "release-ios #419  sha=b71a0d3  build_number=57", "[upload_to_testflight] ERROR ITMS-90189: Redundant Binary Upload.", "  You've already uploaded a build with build version '57' for version number '1.4.0'.", "[retry] gym: Archiving RouteReady…   # rebuilt on retry"],
    s: [
      { q: "Leading hypothesis?", o: ["Two jobs read the same counter at once; allocation isn't serialized or durable", "App Store Connect outage", "The marketing version is wrong"], w: "Two SHAs, one number. That's a race." },
      { q: "Next diagnostic?", o: ["Compare both manifests (SHA, build number, artifact SHA-256), the allocator's state/log and the store's build history", "git log", "Rerun both jobs"], w: "Evidence first: what number went with which binary?" },
      { q: "Fix?", o: ["Serialize allocation per app/platform with an atomic store; persist the reservation with the SHA; retries reuse the original artifact and checksum", "Use GITHUB_RUN_NUMBER", "Add a random number to each build"], w: "And a retry must never rebuild." },
      { q: "Verify?", o: ["Launch two parallel release jobs in a sandbox: distinct numbers; an upload retry references the same checksum without rebuilding", "A single job passes", "Bump the number by hand"], w: "Reproduce the race, prove it can't happen." }
    ],
    x: { t: "The repo moves to a new GitHub org. Run counters reset to 1.", q: "What protects you?", o: ["The allocator is external and seeded from the store's latest build number; it never goes backward", "Start numbering at 1 again", "Reuse old numbers since the old repo is archived"], w: "The store remembers every number you've used." },
    f: { q: "What changes when moving to a new CI repository?", a: "Run counters reset, secrets and environments must be recreated, OIDC trust conditions reference the repo name, and caches start cold. The allocator must live outside the CI repo and be seeded from the store's highest build number. Also watch Android's versionCode ceiling." } },

  { n: 5, t: "Runner/toolchain drift", p: "RouteReady", c: "CI", pri: false,
    inj: "changed the runner image so the expected simulator disappeared",
    an: "Your recipe says 'bake in Oven #3', but the school replaced the ovens over the weekend.",
    sym: "xcodebuild says 'Unable to find a destination' or reports an SDK incompatibility.",
    logT: "pr-ci #1042 · ios-verify",
    log: ["$ xcodebuild test -scheme RouteReady -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'", "xcodebuild: error: Unable to find a destination matching the provided destination specifier:", "    { platform:iOS Simulator, OS:17.0, name:iPhone 15 }", "  Available destinations for the \"RouteReady\" scheme:", "    { platform:iOS Simulator, arch:arm64, id:●●●●, OS:26.0, name:iPhone 17 }"],
    s: [
      { q: "Leading hypothesis?", o: ["The runner image/Xcode changed and the hardcoded destination no longer exists", "A SwiftUI bug in RouteView", "A signing failure"], w: "Read the 'Available destinations' list. It's telling you." },
      { q: "Next command?", o: ["xcodebuild -version; xcode-select -p; xcodebuild -showdestinations; xcrun simctl list devices available, and compare to docs/toolchain.md", "security find-identity -v -p codesigning", "./gradlew test"], w: "Print the toolchain, compare with the record." },
      { q: "Fix?", o: ["Pin the runner image and Xcode, pick a destination from the detected list, upgrade through a reviewed toolchain PR", "Switch to macos-latest", "Delete the iOS test step"], w: "Pin and detect beats hardcode and hope." },
      { q: "Verify?", o: ["A fresh-runner matrix passes for the declared images and the job prints its toolchain into evidence", "It passes on your Mac", "It passes once"], w: "Fresh environments only." }
    ],
    x: { t: "The image you pinned is announced for retirement in six weeks.", q: "What's the plan?", o: ["Open a toolchain PR now that runs the new image in a non-blocking matrix job, compare results, then switch the required check", "Wait until it breaks", "Use macos-latest from now on"], w: "Upgrade on your schedule, not the runner's." },
    f: { q: "How do you upgrade before a hosted image is retired?", a: "Watch the runner-images announcements, add the candidate image to the nightly matrix, update toolchain.md with verified versions, measure build time and failures, then flip the required job through a reviewed PR." } },

  { n: 6, t: "Gradle/JDK incompatibility", p: "Either", c: "CI", pri: false,
    inj: "changed the JDK without changing the pinned Android build tools",
    an: "The game cartridge needs a newer console than the one plugged in.",
    sym: "'Unsupported class file major version' or the Android Gradle Plugin refuses to apply.",
    logT: "pr-ci #1051 · android-verify",
    log: ["FAILURE: Build failed with an exception.", "* What went wrong:", "An exception occurred applying plugin request [id: 'com.android.application']", "> Failed to apply plugin 'com.android.internal.application'.", "   > Android Gradle plugin requires Java 17 to run. You are currently using Java 11."],
    s: [
      { q: "Leading hypothesis?", o: ["The JDK on the runner changed outside the pinned set that AGP requires", "A Kotlin syntax error", "The Play upload key is wrong"], w: "The error literally names both Java versions." },
      { q: "Next command?", o: ["java -version; ./gradlew --version; check gradle-wrapper.properties and the AGP version", "adb devices", "xcodebuild -version"], w: "Confirm what's actually running." },
      { q: "Fix?", o: ["Pin the JDK distribution/version from toolchain.md in setup-java and include it in the cache key", "Downgrade AGP until it works", "Delete all caches on every run"], w: "Restore the compatible set, and make caches aware of it." },
      { q: "Verify?", o: ["A clean build and a warm cache-hit build both pass", "Only the clean build passes", "It passes locally"], w: "Warm builds are where hidden cache problems show up." }
    ],
    x: { t: "After the fix, warm builds still fail now and then with 'Unsupported class file major version'.", q: "Why?", o: ["The cache key lacks the JDK version, so caches compiled with a different JDK are restored", "Gradle is flaky; add retries", "The runner is out of disk"], w: "If the toolchain isn't in the key, caches cross toolchains." },
    f: { q: "Why is deleting every cache not a durable root-cause fix?", a: "It hides the cause, costs build minutes every run, and the problem returns when caching comes back. The real fix is a key that encodes every input that changes the output: OS, architecture, toolchain and lockfiles." } },

  { n: 7, t: "Poisoned or stale dependency cache", p: "Either", c: "CI", pri: false,
    inj: "removed the lockfile hash from the cache key",
    an: "Someone ate last week's sandwich because the lunchbox wasn't labeled with the day.",
    sym: "Clean builds pass, warm builds fail or quietly use old dependencies.",
    logT: "pr-ci #1077 · android-verify (warm)",
    log: ["Cache restored from key: gradle-Linux", "> Task :app:dependencies", "releaseRuntimeClasspath", "+--- com.squareup.okhttp3:okhttp:4.11.0", "# gradle.lockfile pins okhttp 4.12.0", "e: Unresolved reference: newBuilderWithTimeout"],
    s: [
      { q: "Leading hypothesis?", o: ["The cache key lacks lockfile/toolchain inputs, so a stale dependency cache is restored", "OkHttp has a bug", "The PR author forgot to push"], w: "Warm vs clean difference points straight at caching." },
      { q: "Next diagnostic?", o: ["Compare resolved dependency graphs on clean vs warm runs and read the cache restore key in the logs", "Delete the cache and move on", "Rerun"], w: "Find out what was restored and why." },
      { q: "Fix?", o: ["Key on OS, arch, toolchain and hashFiles of lockfiles and wrapper; untrusted runs don't write caches release jobs read", "Use a key of 'gradle'", "Turn caching off"], w: "Precise keys and separate trust zones." },
      { q: "Verify?", o: ["Deliberately change a dependency and confirm the new key misses and resolves correctly", "Run once", "Check that a cache exists"], w: "Prove invalidation works." }
    ],
    x: { t: "You learn a fork-triggered run wrote a cache that a release job later restored.", q: "What principle was broken?", o: ["Trust boundary: release jobs must not consume caches untrusted runs can write", "None, caches are harmless", "The cache was too large"], w: "A cache is an input. Untrusted inputs can't feed signed releases." },
    f: { q: "Which build outputs should never be shared across trust boundaries?", a: "Compiled binaries, Gradle build caches, node_modules (postinstall scripts run code), signed artifacts and anything a release job will sign or ship. Untrusted jobs can read safe caches but must not write ones trusted jobs consume." } },

  { n: 8, t: "Flaky UI test", p: "RouteReady", c: "Testing", pri: false,
    inj: "added random simulator/API delay",
    an: "You check the oven after exactly 2 minutes every time. Some days the cookies aren't done yet, and you blame the cookies.",
    sym: "The route screen assertion fails intermittently.",
    logT: "pr-ci · RouteScreenUITests (20 runs)",
    log: ["Test Case '-[RouteScreenUITests testShowsBusStatus]' failed (2.104 seconds).", "  XCTAssertTrue failed - Failed to find \"Bus 12 · On time\" after 2.0s", "Failures: 3 / 20 runs", "Fixture seed: random (not recorded)"],
    s: [
      { q: "Leading hypothesis?", o: ["A race between fixture latency and a fixed-time assertion", "The simulator is broken", "The feature is wrong"], w: "Intermittent plus timing equals race." },
      { q: "Next diagnostic?", o: ["Inspect the xcresult (screenshots, timing) and rerun many times with a fixed fixture seed", "Add retry: 3", "Ignore it"], w: "Make it reproducible before fixing." },
      { q: "Fix?", o: ["Deterministic fixture server and explicit readiness waits on an accessibility identifier; remove sleeps; quarantine only with an owner and deadline", "sleep(10)", "Delete the test"], w: "Wait for a condition, not a clock." },
      { q: "Verify?", o: ["Repeat 50 times on the declared device matrix and report the failure frequency", "One green run", "Run on your Mac"], w: "Flakiness is a rate, so measure a rate." }
    ],
    x: { t: "A teammate proposes auto-retrying failed UI tests in CI.", q: "Your view?", o: ["Only with reporting of flaky rate and a cap; retries can hide a real race users would hit", "Great, ship it", "Retry everything five times"], w: "If the app itself races, the retry hides a real bug." },
    f: { q: "When does a retry conceal a genuine race?", a: "When the race is in the app, not the test. For example, the UI briefly shows a 'current' bus before the stale check runs. A retry makes CI green while real users still see wrong data." } },

  { n: 9, t: "Required check stuck pending", p: "Either", c: "CI", pri: false,
    inj: "changed a contract file the path filters didn't include",
    an: "The hall monitor only works Mondays. On Tuesday, the line never moves.",
    sym: "The PR never finishes, or mobile checks are skipped incorrectly.",
    logT: "PR #73 · checks",
    log: ["ci-gate         Expected — Waiting for status to be reported", "Changed files: contracts/openapi.yaml", "on:", "  pull_request:", "    paths: ['apps/**']"],
    s: [
      { q: "Leading hypothesis?", o: ["Workflow-level path filtering skipped the whole workflow, so the required check never reported", "GitHub is down", "The PR author lacks permission"], w: "No run means no status means pending forever." },
      { q: "Next diagnostic?", o: ["Inspect the workflow's on.paths, job needs/if and the PR's check runs", "Close and reopen the PR", "Merge as admin"], w: "Read the trigger logic." },
      { q: "Fix?", o: ["Always trigger the workflow, detect changes in a job, map contracts to all clients, and run the aggregate with if: always()", "Remove the required check", "Add contracts/** and stop there"], w: "Adding one path patches today; the gate design fixes the class." },
      { q: "Verify?", o: ["Test PRs for mobile-only, contract-only, docs-only, workflow-only and lockfile-only changes", "This PR passes", "Admin merge works"], w: "Cover the matrix of change types." }
    ],
    x: { t: "You enable a merge queue. Queue entries sit waiting with no checks.", q: "What's missing?", o: ["The merge_group trigger on the workflow", "More runners", "A second required check"], w: "Merge queues fire merge_group events." },
    f: { q: "How does your design work with a merge queue?", a: "The workflow listens to merge_group as well as pull_request. The always-running gate reports for queue entries too, so the queue tests the combined result before it lands on main." } },

  { n: 10, t: "Secret exposure through a PR", p: "Either", c: "Security", pri: true,
    inj: "proposed a workflow that runs fork code with release secrets (harmless canary)",
    an: "A visitor asked to use the teacher's desk. The answer key was in the drawer.",
    sym: "A proposed workflow gives untrusted code access to a release environment. The canary showed up in logs.",
    logT: "proposed .github/workflows/build.yml",
    log: ["on: pull_request_target", "jobs:", "  build:", "    environment: release", "    steps:", "      - uses: actions/checkout@v4", "        with: { ref: ${{ github.event.pull_request.head.sha }} }", "      - run: ./scripts/build.sh", "        env: { MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }} }", "[log] CANARY_7f3a●●●● printed by scripts/build.sh from fork"],
    s: [
      { q: "Leading hypothesis?", o: ["A privileged pull_request_target job checks out and runs fork code with secrets", "The canary leaked from a developer laptop", "GitHub masks failed"], w: "Event + checkout ref + secrets = exposure." },
      { q: "Next diagnostic?", o: ["Trace the event, checkout ref, permissions, environment gates and cache/artifact inputs; list which secrets were in scope", "Rerun to confirm", "Search the web for the canary"], w: "Map exactly what the untrusted code could reach." },
      { q: "Contain and fix?", o: ["Stop the job and disable the workflow, rotate any real exposed credentials, audit logs/artifacts/caches; split PR validation (pull_request, no secrets) from trusted release", "Delete the log and move on", "Make the repo private"], w: "Contain, rotate, then redesign." },
      { q: "Verify?", o: ["A fork PR in a test repo cannot read the canary", "Secrets are masked in logs", "Nobody noticed"], w: "Masking is not protection. Test the boundary." }
    ],
    x: { t: "A new design uses workflow_run to sign artifacts produced by the PR build.", q: "Risk?", o: ["Those artifacts are untrusted input; don't sign them. Rebuild from a trusted SHA and validate", "None, workflow_run is privileged", "Only a risk on Android"], w: "Privilege flows through artifacts too." },
    f: { q: "Why does workflow_run need careful artifact trust validation?", a: "workflow_run runs privileged code, but the artifacts it downloads may have been produced by untrusted PR code. Treat them as data from strangers: validate, never execute or sign them, and build releases from trusted refs." } },

  { n: 11, t: "API breaks an installed client", p: "RouteReady", c: "API", pri: true,
    inj: "changed delay_minutes from a number to a string",
    an: "You ripped out the old skinny bike-rack slots. Every kid on an old bike now has nowhere to park.",
    sym: "The new client works; the previous client fails to parse route status.",
    logT: "RouteReady iOS 1.3 (installed) · crash log",
    log: ["DecodingError.typeMismatch(Swift.Int, Context(", "  codingPath: [status, delay_minutes],", "  debugDescription: \"Expected to decode Int but found a string instead.\"))", "API deploy: routeready-api@sha256:4be1●●●● (12 min ago)", "Installed: 1.3 (12%), 1.4 (61%), 1.5 phased (27%)"],
    s: [
      { q: "Leading hypothesis?", o: ["The backend changed a field's type; 1.3 is still installed and can't decode it", "The 1.3 binary got corrupted", "iOS updated and broke Codable"], w: "Right after an API deploy, only old clients break." },
      { q: "Next diagnostic?", o: ["Replay recorded 1.3 fixtures against the candidate API and run a contract diff old vs new", "Ask users to reinstall", "Read App Store reviews"], w: "Old-client fixtures are your time machine." },
      { q: "Contain and fix?", o: ["Restore the additive shape (revert the backend to a compatible digest or forward-fix), and disable the new behavior flag", "Force-update all users to 1.5", "Pull 1.3 from the store"], w: "Fix it on the server; that's the side you control instantly." },
      { q: "Verify?", o: ["Previous and current client contract tests pass as a required PR check", "1.5 works", "No new crashes for 10 minutes"], w: "Make the old-client test a gate so it can't recur." }
    ],
    x: { t: "Reverting the backend would also revert a migration that 1.5 depends on.", q: "Now what?", o: ["Roll forward: a compatible backend fix that serves both shapes; never roll back schema blindly", "Revert everything anyway", "Ship 1.6 and wait"], w: "Rollback is not always safe. Compatibility is the goal." },
    f: { q: "Why can't you just require all users to update immediately?", a: "Store review takes time, users delay updates, some devices can't run the newest OS, some are offline, and a force-update screen itself requires the old app to parse the server's response. Installed apps outlive any single deployment." } },

  { n: 12, t: "Stale or out-of-order GPS data", p: "RouteReady", c: "Data", pri: false,
    inj: "sent sequence 102, then 99, then stopped the producer",
    an: "An old postcard arrives late and you think your friend went back home. And when postcards stop, you assume they're still where the last one said.",
    sym: "The bus appears to move backward, or stays 'current' after updates stop.",
    logT: "telemetry · bus_id=bus-12",
    log: ["event_id=e-71a seq=102 observed_at=14:03:10Z received_at=14:03:11Z  ACCEPTED", "event_id=e-6f0 seq=99  observed_at=14:02:40Z received_at=14:03:12Z  ACCEPTED (replaced current)", "-- no events after 14:03:12Z --", "client 14:06:30: \"Bus 12 — 2 min away\" (no freshness shown)"],
    s: [
      { q: "Leading hypothesis?", o: ["The server orders by received time, and the client has no freshness indicator", "GPS hardware is broken", "The clock on the phone is wrong"], w: "99 replaced 102 because it arrived later." },
      { q: "Next diagnostic?", o: ["Query telemetry for the bus comparing observed_at, received_at, sequence and event_id", "Restart the simulator", "Check the map provider"], w: "Line up all three clocks." },
      { q: "Fix?", o: ["Keep the latest position by sequence/observed_at, ignore older events (stored idempotently by event_id), show 'stale' after 60s without fresh data", "Sort on the client", "Drop all late events silently"], w: "Order on the server, freshness on the screen." },
      { q: "Verify?", o: ["Fake-clock and out-of-order tests: 102 then 99 keeps 102; no events for 60s shows stale", "Watch it live once", "Ask a parent"], w: "Deterministic time makes the test reliable." }
    ],
    x: { t: "The producer reboots and its sequence restarts at 1.", q: "How do you handle it?", o: ["Add a producer boot/epoch ID and order by (epoch, sequence), with observed_at and a documented clock-skew allowance as a check", "Reject everything after a reboot", "Trust received_at"], w: "Sequences need a scope." },
    f: { q: "How do you handle producer reboot, sequence reset and clock skew?", a: "Scope sequence numbers with a boot epoch, accept a documented skew window on observed_at, record received_at for diagnosis, and flag events far outside the window rather than silently trusting or dropping them." } },

  { n: 13, t: "Backend readiness and bad rollout", p: "RouteReady", c: "Backend", pri: false,
    inj: "made the container report healthy before its database pool was ready",
    an: "A student says 'I'm ready!' before finding their pencil. The teacher calls on them anyway.",
    sym: "The deployment passes, but mobile requests fail intermittently for minutes.",
    logT: "routeready-api · rollout",
    log: ["pod api-7d9f ready=true after 3s", "HikariPool-1 - Connection is not available, request timed out after 30000ms.", "GET /api/v1/routes/r-2/status 503 (x214 in 4m)", "readinessProbe: GET /actuator/health/liveness"],
    s: [
      { q: "Leading hypothesis?", o: ["Readiness reports ready before the DB pool is usable (it's pointed at the liveness endpoint)", "The mobile app retries too fast", "Postgres is down"], w: "Look at what the readiness probe actually checks." },
      { q: "Next diagnostic?", o: ["Compare liveness vs readiness endpoint behavior and pod events with kubectl describe", "Scale to 20 pods", "Restart Postgres"], w: "Separate 'alive' from 'able to serve'." },
      { q: "Fix?", o: ["Readiness includes required dependencies, liveness doesn't; bounded startup; revert to the previous compatible digest if needed", "Put the DB check in liveness too", "Add a 60s sleep at startup"], w: "Right probe, right purpose." },
      { q: "Verify?", o: ["During a controlled DB outage, pods go unready and receive no traffic, but aren't restarted", "Deploy succeeds", "Errors stop"], w: "Test the dependency failure on purpose." }
    ],
    x: { t: "Someone adds the database check to the liveness probe 'to be safe'.", q: "What happens in the next DB blip?", o: ["Every pod fails liveness and restarts, turning a short blip into a full outage", "Nothing", "Traffic routes faster"], w: "Restarts can't fix a dependency outage." },
    f: { q: "When would a liveness restart make an outage worse?", a: "When the cause is external, like a slow database. Restarting all pods at once drops in-flight work, causes cold starts and a thundering herd on reconnect, and adds downtime without fixing anything." } },

  { n: 14, t: "Destructive database migration", p: "Either", c: "Backend", pri: false,
    inj: "dropped a column that previous API versions still read",
    an: "You tore down the old hallway before the new one was finished, and half the class is still walking through it.",
    sym: "A rolling deploy fails after some instances update.",
    logT: "routeready-api · rolling deploy",
    log: ["migration 0009_drop_eta_minutes applied", "v1 pod: ERROR: column \"eta_minutes\" does not exist", "v2 pods: OK", "rollout: 3/6 updated, v1 error rate 41%"],
    s: [
      { q: "Leading hypothesis?", o: ["The migration removed a column older pods still read during the rollout overlap", "v2 has a bug", "The database ran out of space"], w: "Only old pods fail. Version overlap." },
      { q: "Next diagnostic?", o: ["Check schema revision, the failing queries and which versions are running", "Restart the database", "Delete the v1 pods"], w: "Map schema to running versions." },
      { q: "Contain and fix?", o: ["Pause the rollout, apply a forward migration restoring the column, then redo it as expand → backfill → transition → contract", "Roll back the app image only", "Drop more columns"], w: "Rolling back the image alone leaves the schema changed." },
      { q: "Verify?", o: ["CI runs both server versions against the migrated schema", "v2 works", "Errors stop"], w: "Both sides of the overlap must pass." }
    ],
    x: { t: "v2 has written new rows since the column was dropped.", q: "What else is needed?", o: ["Backfill the restored column for those rows before old readers rely on it", "Nothing", "Delete the new rows"], w: "Data written in the gap needs repair." },
    f: { q: "Why is rolling back the application image alone insufficient?", a: "The database already changed. Old code against new schema still fails. Schema changes need their own forward fix and an expand/contract plan so every running version works throughout." } },

  { n: 15, t: "Store processing or review delay", p: "Either", c: "Release", pri: false,
    inj: "made the distribution adapter stay in processing/review",
    an: "You told everyone Grandma got the present. It's still at the sorting center.",
    sym: "CI upload is green, but testers or users can't install.",
    logT: "release-ios #431 · beta",
    log: ["[upload_to_testflight] Successfully uploaded the new binary to App Store Connect", "[poll] build 61 processingState=PROCESSING (t+45m)", "[slack-bot] ✅ RouteReady 1.5 released!", "tester: \"No new build in TestFlight\""],
    s: [
      { q: "Leading hypothesis?", o: ["Upload was treated as release; processing/availability/review are separate and still pending", "TestFlight is broken", "The tester's phone is old"], w: "The bot announced the wrong state." },
      { q: "Next diagnostic?", o: ["Query App Store Connect for build processing and beta review state and check agreements/metadata", "Re-upload", "Ask Apple"], w: "Read the actual state." },
      { q: "Fix?", o: ["Track separate states in the manifest, use bounded polling and a scheduled status check, keep the feature off, report truthfully", "Re-upload with a new build number", "Delete the Slack message"], w: "Honest states, bounded waiting." },
      { q: "Verify?", o: ["The manifest schema rejects 'released' while processing", "The bot says released", "It eventually shows up"], w: "Make the wrong claim impossible." }
    ],
    x: { t: "The backend for 1.5 is already live and marketing wants to announce today.", q: "What do you do?", o: ["Keep the flag off (backend is additive, so no impact), share the real state and a next check time", "Announce anyway", "Roll back the backend"], w: "Additive backend means waiting is safe." },
    f: { q: "How do you communicate a launch delay when backend is already live?", a: "State facts: the backend is deployed, additive and dark behind a flag; the binary is in processing/review; here's the next update time. No promises the store controls." } },

  { n: 16, t: "Crash increase after rollout", p: "Either", c: "Operate", pri: true,
    inj: "crashed a flagged code path for a disposable cohort",
    an: "The water slide is making kids bump their heads. Turn off the water (flag), stop the line (pause), fix the slide (new build). You can't un-slide the kids already at the bottom.",
    sym: "The new build's crash rate rises compared to baseline.",
    logT: "crash dashboard · lab fixture",
    log: ["release      phase        crash-free sessions   sessions", "1.4.2        100%         99.6%                 n=18,400", "1.5.0 (57)   day 2 (~2%)  97.1%                 n=640", "top crash: ETAConfidenceView.render — 88% of 1.5.0 crashes", "segment: eta_confidence_enabled=true cohort only"],
    s: [
      { q: "Leading hypothesis?", o: ["The new flagged code path crashes for the enabled cohort", "iOS has a bug", "Sample size is too small, ignore it"], w: "The crash is concentrated in the flag cohort." },
      { q: "Next diagnostic?", o: ["Segment by release, OS, device, flag cohort and sample size", "Look at overall crash rate only", "Read reviews"], w: "Note n=640: real, but say so." },
      { q: "Contain?", o: ["Turn off eta_confidence_enabled remotely and pause the phased release", "Remove 1.5 from users' phones", "Roll back the backend"], w: "Two levers you control right now." },
      { q: "Verify?", o: ["Crash rate for the installed 1.5.0 population returns to baseline after the flag is off, and a fixed build with a higher number passes", "New installs are fine", "Phased release resumed"], w: "Handle installed users, not just new installs." }
    ],
    x: { t: "A variant crashes at launch, before flags are fetched.", q: "Now what?", o: ["The flag can't help: rely on safe cached defaults, pause/halt rollout, ship a replacement build (expedited review if needed), use a server mitigation if the crash comes from a response", "Turn the flag off harder", "Wait for it to stop"], w: "Know what each lever can and can't reach." },
    f: { q: "What if the crash occurs before feature flags can be fetched?", a: "Flags with server-side defaults won't reach it. Design safe defaults (new features off unless cached on), pause/halt distribution, and ship a replacement binary with a higher build number. If a server response triggers it, change the response." } },

  { n: 17, t: "Wrong environment or tenant config", p: "StayReady", c: "Security", pri: false,
    inj: "let tenant identity come from an editable header",
    an: "Anyone can write any name on a name tag. The teacher has to check the class list, not the tag.",
    sym: "A Cedar Cove guest sees a Harbor House reservation.",
    logT: "stayready-api · access log",
    log: ["GET /api/v1/reservations/current", "  auth.sub=guest-cedar-014  X-Tenant-Id: harbor-house", "  200 OK  tenant=harbor-house reservation=res-hh-221", "code: tenant_id = request.headers.get('X-Tenant-Id')"],
    s: [
      { q: "Leading hypothesis?", o: ["The server trusts a client header to choose the tenant", "The app theme is wrong", "Database replication lag"], w: "auth.sub says Cedar, header says Harbor, server obeyed the header." },
      { q: "Next diagnostic?", o: ["Trace the authorization code path and run a negative test with a modified header; check logs for scope", "Change the theme colors", "Restart the API"], w: "Confirm, then measure blast radius." },
      { q: "Contain and fix?", o: ["Restrict the endpoint/deploy the fix now, assess exposure from logs; derive tenant from the authenticated identity server-side", "Hide the header in the app", "Add a warning to the UI"], w: "UI branding is not authorization." },
      { q: "Verify?", o: ["Negative cross-tenant tests (IDs and headers) fail closed in CI", "The UI looks right", "No complaints"], w: "Fail closed, tested." }
    ],
    x: { t: "You also find the production candidate IPA has a staging API URL baked in.", q: "What prevents this next time?", o: ["A preflight that inspects compiled public config against the target environment before upload", "Rebuild with the right URL and hope", "Check it manually"], w: "Validate what's in the binary, not what's in the YAML." },
    f: { q: "Which configuration is safe to bundle in a mobile app?", a: "Public things: API base URL, environment name, public crash-reporting DSN, theme, flag defaults. Never anything that grants privilege: API secrets, signing keys, admin tokens. Anything in the app can be read by anyone." } },

  { n: 18, t: "Offline duplicate service request", p: "StayReady", c: "API", pri: false,
    inj: "committed a request, then dropped the response so the client retried",
    an: "You mailed a letter, never heard back, mailed it again. Now the plumber shows up twice.",
    sym: "Two maintenance tickets for one tap.",
    logT: "stayready · service_requests",
    log: ["client: POST /service-requests key=7c1e… → timeout (server committed)", "client: reconnect, retry POST key=7c1e…", "db: #881 tenant=cedar-cove 'Leaking faucet' 18:02:11", "db: #882 tenant=cedar-cove 'Leaking faucet' 18:02:13"],
    s: [
      { q: "Leading hypothesis?", o: ["The retry after commit isn't deduplicated atomically by idempotency key", "The guest tapped twice", "The manager console duplicated it"], w: "Same key, two rows." },
      { q: "Next diagnostic?", o: ["Trace the key in request logs and the DB; check for a unique constraint and transaction boundaries", "Delete #882", "Add a loading spinner"], w: "Where is the key enforced, if anywhere?" },
      { q: "Fix?", o: ["Unique (tenant_id, idempotency_key); store the original response in the same transaction; on conflict return it; client reuses the key", "Dedupe by title within 5 seconds", "Disable retries"], w: "Database-enforced, tenant-scoped." },
      { q: "Verify?", o: ["Real network-response loss (proxy drops the reply after commit) plus concurrent retries create exactly one row", "Mocked success test", "One manual tap"], w: "Test the actual failure, not a mock." }
    ],
    x: { t: "A client bug sends the same key with a different description.", q: "Server behavior?", o: ["Reject with a clear error (409/422); don't return the old result or overwrite", "Create a new ticket", "Overwrite silently"], w: "Same key must mean same request." },
    f: { q: "How should the server handle the same key with a different payload?", a: "Store a hash of the original payload with the key. On replay, compare hashes: same returns the stored response, different returns a conflict error so the client bug surfaces." } },

  { n: 19, t: "Crash report lacks usable symbols", p: "StayReady", c: "Observability", pri: false,
    inj: "skipped dSYM/source-map upload for the shipped build",
    an: "The smoke detector rings but nobody labeled the rooms.",
    sym: "The stack trace is unreadable or points to the wrong source line.",
    logT: "crash report · StayReady 2.1 (140)",
    log: ["Thread 0 Crashed:", "0  StayReady   0x0000000104a2c3f8 StayReady + 1234936", "1  StayReady   0x0000000104a1b210 StayReady + 1164560", "warning: missing dSYM for UUID 9A1B●●●●-…", "JS: index.android.bundle:1:48211 (no source map for dist=140)"],
    s: [
      { q: "Leading hypothesis?", o: ["The exact build's dSYM/source map wasn't uploaded, or another build's was", "The crash is in iOS itself", "The app was jailbroken"], w: "'missing dSYM for UUID' says it directly." },
      { q: "Next diagnostic?", o: ["dwarfdump --uuid on the retained dSYM vs the crash UUID; compare release/dist with the manifest", "Rebuild and upload", "Search Stack Overflow"], w: "Match identities." },
      { q: "Fix?", o: ["Upload the exact retained dSYMs/maps from the shipped build artifact with correct release and dist", "Rebuild the same SHA and upload those symbols", "Turn off minification"], w: "Only the shipped build's symbols match." },
      { q: "Verify?", o: ["A controlled crash resolves to the expected source line", "Upload succeeded", "Dashboard looks fine"], w: "Prove the mapping end to end." }
    ],
    x: { t: "The build's CI artifacts expired after 7 days.", q: "What changes?", o: ["Symbol retention must exceed the support window; store them with the manifest in long-term artifact storage", "Rebuild from source", "Accept unreadable crashes"], w: "You support builds for months; keep symbols that long." },
    f: { q: "Why may rebuilding the same Git SHA produce unusable replacement symbols?", a: "Each compile produces new binary UUIDs and can differ in toolchain, flags or code layout. Symbols must come from the exact binary users are running." } },

  { n: 20, t: "Incompatible OTA update / unsafe AI change", p: "StayReady", c: "AI + RN", pri: false,
    inj: "had an AI-generated PR add a native dependency and propose a JS-only update",
    an: "You can download new game levels to your console, but you can't download a new controller over Wi-Fi.",
    sym: "Old installed clients crash: the native module doesn't exist.",
    logT: "PR #96 'Add camera check-in' (AI-generated, 1,812 lines)",
    log: ["package.json: + \"react-native-vision-camera\"", "ios/Podfile.lock: + VisionCamera", "release plan: eas update --channel production (runtimeVersion unchanged)", "installed 2.1: Invariant Violation: requireNativeComponent: \"CameraView\" was not found in the UIManager."],
    s: [
      { q: "Leading hypothesis?", o: ["Native code was shipped through a JS-only update to binaries that lack the module, with the runtime version unchanged", "The camera permission is missing", "React Native is broken"], w: "Native diff + OTA plan = mismatch." },
      { q: "Next diagnostic?", o: ["Review the native diff (Podfile.lock, android/, native modules), runtime version policy and channel", "Clear app cache", "Reinstall Node"], w: "What changed natively, and what runtime is targeted?" },
      { q: "Contain and fix?", o: ["Block publication or republish the last compatible update; build a new binary with a new runtime version; split the PR; add a preflight", "Push another OTA with a fix", "Tell users to reinstall"], w: "Native change takes the binary path." },
      { q: "Verify?", o: ["A CI test proves a native change can't take the OTA-only path", "The update published", "PR is green"], w: "Make the unsafe path impossible." }
    ],
    x: { t: "The AI PR is green and 1,812 lines long. Your reviewer says 'CI passed, approve it'.", q: "Your response?", o: ["Split it, explain every generated command, check native diffs, secrets and tests; green CI isn't judgment", "Approve, CI is enough", "Reject all AI code forever"], w: "You own what you merge." },
    f: { q: "Why does approving a green PR still require engineering judgment?", a: "CI only checks what tests cover. It won't notice an unsafe release path, a secret in a script, an over-broad permission or a command nobody understands. I review the native diff, run the risky paths, and can explain every line before approving." } }
];

/* ---------- BUG HUNT ---------- */
const BUGS = [
  { id: "b1", t: "Fork PR with release secrets", f: ".github/workflows/pr.yml", jd: "Security",
    an: "Letting a stranger borrow the teacher's keys to check homework.",
    l: ["name: pr-ci", "on: pull_request_target", "permissions: write-all", "jobs:", "  test:", "    runs-on: ubuntu-24.04", "    steps:", "      - uses: actions/checkout@v4", "        with:", "          ref: ${{ github.event.pull_request.head.sha }}", "      - run: ./gradlew test", "        env:", "          PLAY_JSON_KEY: ${{ secrets.PLAY_JSON_KEY }}"],
    b: { 1: "pull_request_target runs with the base repo's secrets and token. Use pull_request for untrusted code.", 2: "write-all gives PR code broad write access. Use permissions: { contents: read }.", 9: "Checking out the fork's head commit in a privileged job runs strangers' code with your privileges.", 12: "Unit tests never need store credentials. Secrets belong only in protected release environments." },
    fix: ["name: pr-ci", "on: pull_request", "permissions:", "  contents: read", "jobs:", "  test:", "    runs-on: ubuntu-24.04", "    steps:", "      - uses: actions/checkout@<pinned-commit-sha> # v4.x", "      - run: ./gradlew test"] },
  { id: "b2", t: "Cache key that never changes", f: ".github/workflows/android.yml", jd: "CI",
    an: "Every lunchbox labeled just 'lunch'. You'll eat someone's old sandwich.",
    l: ["- uses: actions/cache@v4", "  with:", "    path: |", "      ~/.gradle/caches", "      ~/.gradle/wrapper", "    key: gradle-${{ runner.os }}", "    restore-keys: gradle-"],
    b: { 5: "The key ignores lockfiles, wrapper, JDK and architecture, so stale dependencies get restored forever." },
    fix: ["- uses: actions/cache@<pinned-commit-sha> # v4.x", "  with:", "    path: |", "      ~/.gradle/caches", "      ~/.gradle/wrapper", "    key: gradle-${{ runner.os }}-${{ runner.arch }}-jdk17-${{ hashFiles('**/gradle.lockfile', 'gradle/wrapper/gradle-wrapper.properties', '**/*.gradle.kts') }}", "    restore-keys: gradle-${{ runner.os }}-${{ runner.arch }}-jdk17-"] },
  { id: "b3", t: "Tag one, push another", f: "scripts/deploy-api.sh", jd: "Backend CI/CD",
    an: "You labeled the red box but mailed the blue one, then told the store 'whatever's newest'.",
    l: ["docker build -t routeready-api:$GITHUB_SHA services/api", "docker push $REGISTRY/routeready-api:latest", "aws ecs update-service --cluster lab --service api --force-new-deployment"],
    b: { 1: "This pushes a name that was never built (no registry prefix on the build tag, and :latest instead of the SHA).", 2: "Deploys whatever the task definition points at; no image digest is specified or verified." },
    fix: ["IMAGE=$REGISTRY/routeready-api:$GITHUB_SHA", "docker build -t \"$IMAGE\" services/api", "docker push \"$IMAGE\"", "DIGEST=$(docker buildx imagetools inspect \"$IMAGE\" --format '{{json .Manifest.Digest}}' | tr -d '\"')", "./scripts/register-task-def.sh \"$REGISTRY/routeready-api@$DIGEST\"  # then update-service with that revision"] },
  { id: "b4", t: "Fastfile that rewrites signing", f: "fastlane/Fastfile", jd: "Xcode, Fastlane",
    an: "The kid grading homework also gets to rewrite the answer key, and reads the safe's combination out loud.",
    l: ["platform :ios do", "  lane :package do", "    unlock_keychain(path: \"login.keychain\", password: ENV[\"LOGIN_PW\"])", "    match(type: \"appstore\", readonly: false)", "    gym(scheme: \"RouteReady\", export_method: \"app-store\")", "    sh(\"cat ../fastlane/.env.release\")", "  end", "end"],
    b: { 2: "Uses the shared login keychain. CI should create a temporary keychain with setup_ci and delete it afterward.", 3: "readonly: false lets CI create or modify team certificates and profiles.", 5: "Prints release env (secrets) into the build log." },
    fix: ["platform :ios do", "  lane :package do", "    setup_ci", "    match(type: \"appstore\", readonly: true)", "    gym(scheme: \"RouteReady\", export_method: \"app-store\", output_directory: \"build\")", "  end", "  after_all { delete_keychain(name: ENV[\"MATCH_KEYCHAIN_NAME\"]) if is_ci }", "  error { delete_keychain(name: ENV[\"MATCH_KEYCHAIN_NAME\"]) if is_ci }", "end"] },
  { id: "b5", t: "Beta lane that rebuilds", f: "fastlane/Fastfile", jd: "Release",
    an: "Ticket number from the wrong machine, and if the mail truck is late you bake a whole new cake.",
    l: ["lane :beta do", "  increment_build_number(build_number: ENV[\"GITHUB_RUN_NUMBER\"])", "  build_app(scheme: \"RouteReady\")", "  upload_to_testflight", "end"],
    b: { 1: "Run numbers collide across workflows, repeat on rerun and reset in a new repo.", 2: "The beta lane compiles, so a retry rebuilds a different binary. Beta should upload an existing, checksummed IPA." },
    fix: ["lane :beta do |opts|", "  ipa = opts[:ipa] || UI.user_error!(\"pass ipa: path from package\")", "  verify_manifest(ipa: ipa)   # SHA-256, app ID, build number", "  upload_to_testflight(ipa: ipa, skip_waiting_for_build_processing: true)", "  record_state(state: \"uploaded\")", "end"] },
  { id: "b6", t: "Release workflow that cancels itself", f: ".github/workflows/release-ios.yml", jd: "CI",
    an: "Yanking a letter halfway out of the mail slot, using whatever oven showed up today, and letting it bake for ten hours.",
    l: ["name: release-ios", "on:", "  workflow_dispatch:", "concurrency:", "  group: release-ios-routeready", "  cancel-in-progress: true", "jobs:", "  beta:", "    runs-on: macos-latest", "    environment: release", "    timeout-minutes: 600"],
    b: { 5: "A new run would kill an upload mid-flight. Release jobs serialize with cancel-in-progress: false.", 8: "macos-latest drifts. Pin the image that docs/toolchain.md verified.", 10: "600 minutes isn't a bound. Set a realistic timeout so hangs fail fast." },
    fix: ["concurrency:", "  group: release-ios-routeready", "  cancel-in-progress: false", "jobs:", "  beta:", "    runs-on: macos-15   # from docs/toolchain.md", "    environment: release", "    timeout-minutes: 45"] },
  { id: "b7", t: "Tenant from a header", f: "services/api/reservations.py", jd: "Systems design",
    an: "The teacher reads the name tag the kid wrote themselves instead of the class list.",
    l: ["@app.get(\"/api/v1/reservations/current\")", "def current_reservation(request: Request, user=Depends(current_user)):", "    tenant_id = request.headers.get(\"X-Tenant-Id\")", "    return db.reservations.find_one(", "        tenant_id=tenant_id,", "        guest_id=request.query_params.get(\"guest_id\"),", "    )"],
    b: { 2: "Tenant comes from a client-controlled header. It must come from the authenticated identity.", 5: "guest_id comes from the query string, so any guest can request any reservation. Use the authenticated user's ID." },
    fix: ["@app.get(\"/api/v1/reservations/current\")", "def current_reservation(user=Depends(current_user)):", "    return db.reservations.find_one(", "        tenant_id=user.tenant_id,", "        guest_id=user.id,", "    ) or raise_not_found()"] },
  { id: "b8", t: "Idempotency that isn't", f: "services/api/service_requests.py", jd: "Systems design",
    an: "Checking if the plumber was called, then calling, while your sibling does the exact same thing at the same time.",
    l: ["@app.post(\"/api/v1/service-requests\")", "def create(req: NewRequest, user=Depends(current_user)):", "    existing = db.query(SR).filter_by(idempotency_key=req.key).first()", "    if existing:", "        return existing", "    sr = SR(tenant_id=user.tenant_id, **req.dict())", "    db.add(sr); db.commit()", "    return sr"],
    b: { 2: "The lookup isn't scoped to the tenant, so keys collide across tenants and could leak another tenant's record.", 4: "Returns the old record without checking the payload matches. Same key with a different payload should be a conflict.", 6: "Check-then-insert with no unique constraint: two concurrent retries both pass the check and insert twice." },
    fix: ["# unique index on (tenant_id, idempotency_key)", "def create(req: NewRequest, user=Depends(current_user)):", "    h = payload_hash(req)", "    try:", "        sr = SR(tenant_id=user.tenant_id, key=req.key, payload_hash=h, **req.fields())", "        db.add(sr); db.commit(); return sr", "    except IntegrityError:", "        db.rollback()", "        old = db.query(SR).filter_by(tenant_id=user.tenant_id, key=req.key).one()", "        if old.payload_hash != h: raise HTTPException(409, \"key reused with different payload\")", "        return old"] },
  { id: "b9", t: "A contract that breaks 1.3", f: "contracts/openapi.yaml", jd: "API compatibility",
    an: "You changed the shape of the bike slot, and added a new kind of bike the old racks have never seen.",
    l: ["RouteStatus:", "  type: object", "  required: [route_id, status, observed_at]", "  properties:", "    route_id: { type: string }", "    status: { type: string, enum: [ON_TIME, DELAYED, STALE] }", "    delay_minutes: { type: string }", "    observed_at: { type: string, format: date-time }", "    eta_confidence: { type: number, nullable: true }"],
    b: { 5: "Adding STALE to an enum breaks old clients that decode enums strictly (e.g. Swift Codable without an unknown case). Send it only to clients that advertise support, or ship unknown-value handling first.", 6: "delay_minutes changed from integer to string, which installed clients can't decode." },
    fix: ["    status: { type: string, enum: [ON_TIME, DELAYED] }   # STALE via capabilities", "    is_stale: { type: boolean }   # additive", "    delay_minutes: { type: integer }", "    eta_confidence: { type: number, nullable: true }   # additive, optional"] },
  { id: "b10", t: "Gate that waves broken PRs through", f: ".github/workflows/ci.yml", jd: "CI",
    an: "The hall monitor only comes on days the art room changed, and when a kid fails the check, the monitor goes home instead of saying 'stop'.",
    l: ["name: ci", "on:", "  pull_request:", "    paths: [\"apps/ios/**\", \"apps/android/**\"]", "jobs:", "  ios:", "    runs-on: macos-15", "    steps: [ ... ]", "  required:", "    needs: [ios]", "    runs-on: ubuntu-24.04", "    steps:", "      - run: echo \"all good\""],
    b: { 3: "Workflow-level path filter: contract, lockfile or docs PRs never run the workflow, so the required check hangs pending.", 9: "Without if: always(), a failed ios job makes this job skip, and skipped counts as success for required checks. It must inspect needs.*.result." },
    fix: ["on: [pull_request, merge_group]", "jobs:", "  changes: { ... }   # path detection inside the workflow", "  ios: { needs: changes, if: needs.changes.outputs.ios == 'true', ... }", "  ci-gate:", "    if: always()", "    needs: [changes, ios, android, api]", "    runs-on: ubuntu-24.04", "    steps:", "      - run: ./scripts/gate.sh '${{ toJSON(needs) }}'   # fail on failure/cancelled"] },
  { id: "b11", t: "Drifting iOS job", f: ".github/workflows/ios.yml", jd: "Xcode",
    an: "A recipe that says 'any oven' and 'the 2019 cookie sheet' that the school threw away.",
    l: ["jobs:", "  ios-verify:", "    runs-on: macos-latest", "    steps:", "      - uses: actions/checkout@v4", "      - run: xcodebuild test -scheme RouteReady -destination \"platform=iOS Simulator,name=iPhone 11,OS=13.0\""],
    b: { 2: "macos-latest changes underneath you. Pin the verified image.", 4: "Third-party actions should be pinned to a full commit SHA, not a moving tag.", 5: "Hardcoded old simulator. Detect available destinations and select one from the toolchain record." },
    fix: ["jobs:", "  ios-verify:", "    runs-on: macos-15", "    steps:", "      - uses: actions/checkout@<full-commit-sha> # v4.x", "      - run: sudo xcode-select -s \"$XCODE_PATH\"   # from toolchain.md", "      - run: DEST=$(./scripts/pick-simulator.sh) && bundle exec fastlane ios verify destination:\"$DEST\""] },
  { id: "b12", t: "Manifest that leaks and lies", f: "evidence/release-manifest.json", jd: "Release",
    an: "A packing slip with your locker combination on it, that says 'delivered' while the box is still at the post office.",
    l: ["{", "  \"application_id\": \"org.routeready.parent\",", "  \"platform\": \"android\",", "  \"marketing_version\": \"1.5.0\",", "  \"build_number\": 10512,", "  \"git_sha\": \"9f2c4e1d8a…\",", "  \"artifact_sha256\": \"e3b0c442…\",", "  \"keystore_password\": \"hunter2-lab\",", "  \"backend_image\": \"routeready-api:latest\",", "  \"store_state\": \"processing\",", "  \"distribution_status\": \"released\"", "}"],
    b: { 7: "Secrets never go in a manifest.", 8: "A floating tag isn't evidence. Record the image digest.", 10: "Contradicts store_state. Can't be released while processing." },
    fix: ["  \"backend_image\": \"routeready-api@sha256:4be1…\",", "  \"api_contract_revision\": \"v1@3f9a\",", "  \"store_state\": \"processing\",", "  \"distribution_status\": \"uploaded\""] }
];

/* ---------- PIPELINE GATES SORTER ---------- */
const BUCKETS = [
  { id: "pr", name: "Pull request" },
  { id: "main", name: "Merge to main" },
  { id: "beta", name: "Beta release" },
  { id: "promote", name: "Production promotion" },
  { id: "nightly", name: "Nightly" },
  { id: "never", name: "Never" }
];
const PIPE = [
  { t: "Lint and unit tests on fork code with a read-only token", b: "pr", w: "Untrusted validation, no secrets." },
  { t: "iOS simulator and Android emulator tests, unsigned", b: "pr", w: "Proves build/test, not distribution." },
  { t: "Contract diff against previous-client fixtures", b: "pr", w: "Catch breaking API changes before merge." },
  { t: "Build the backend image once and record its digest", b: "main", w: "Immutable artifact from trusted code." },
  { t: "Deploy that digest to staging and run smoke tests", b: "main", w: "Main means staging, not the store." },
  { t: "Allocate a build number, sign and archive", b: "beta", w: "Only an explicit, trusted release run touches signing." },
  { t: "Upload the existing IPA to TestFlight", b: "beta", w: "Upload, then track processing separately." },
  { t: "Verify approvals and promote the existing candidate", b: "promote", w: "Same artifact, approval gate." },
  { t: "Broad device matrix and dependency/security scans", b: "nightly", w: "Expensive breadth, bounded macOS minutes." },
  { t: "Controlled canary-secret security drill", b: "nightly", w: "Regularly prove forks can't read secrets." },
  { t: "Check out the fork PR head in pull_request_target with secrets", b: "never", w: "Hands strangers your keys." },
  { t: "Rebuild the binary because the upload retry failed", b: "never", w: "Retries reuse the existing artifact." },
  { t: "Auto-publish to the App Store on every merge to main", b: "never", w: "Main is releasable, not automatically released." },
  { t: "Recompile at promotion 'to pick up the latest fixes'", b: "never", w: "Then you ship something nobody tested." }
];

/* ---------- RELEASE STATES ---------- */
const STATES = {
  ios: { name: "iOS (App Store Connect)", an: "Like mailing a package, then waiting for the principal's signature, then letting kids onto the slide a few at a time.",
    items: [
      ["Signed IPA + dSYMs archived (build 57)", "Package lane output, checksummed into the manifest."],
      ["Uploaded to App Store Connect", "upload_to_testflight returned success. That's all it means."],
      ["Processing complete", "Apple finished processing. Can take minutes or longer."],
      ["Internal testers can install", "Available in TestFlight to your team."],
      ["Submitted for App Review", "Production candidate sent for review."],
      ["Approved, pending developer release", "Approved, but you control when it goes out."],
      ["Phased release in progress (day 1–7)", "Apple's fixed 7-day schedule for automatic updates; pausable."],
      ["Available to all users", "Phased release complete or released to everyone."]
    ] },
  android: { name: "Android (Google Play)", an: "The LEGO box goes to the toy store, your friends play first, then the store checks it, then more and more kids get it.",
    items: [
      ["Signed AAB + mapping built (versionCode 10512)", "Signed with the upload key; checksum into manifest."],
      ["Uploaded to internal testing track", "Play accepted the upload; upload certificate verified."],
      ["Internal testers can install", "Internal testing is usually available quickly."],
      ["Promoted to production release", "Same versionCode promoted; no rebuild."],
      ["In review", "Production changes go through Play review."],
      ["Staged rollout at 10%", "You choose the percentage."],
      ["Staged rollout at 50%", "Raised after watching crash and ANR rates."],
      ["Rollout complete (100%)", "Everyone eligible gets it. Halting no longer stops it."]
    ] }
};

/* ---------- ROLLBACK LAB ---------- */
const LEVERS = {
  A: "Roll back backend to previous image digest",
  B: "Disable the feature flag remotely",
  C: "Pause phased release / halt staged rollout",
  D: "Ship a replacement binary (higher build number)",
  E: "Restore the database from last night's backup",
  F: "Ask users to downgrade the app",
  G: "Forward-fix migration (restore the column)"
};
const ROLLBACK = [
  { id: "r1", t: "iOS 1.5 is on day 2 of phased release. Crashes spike only where eta_confidence_enabled is on.", ok: ["B", "C", "D"], w: "Flag off stops the crash for installed 1.5 users now. Pause slows new automatic updates. A fixed build with a higher number is the real fix. Backend rollback doesn't touch client code.", an: "Turn off the slide's water, stop the line, fix the slide." },
  { id: "r2", t: "A backend deploy changed delay_minutes to a string. Installed 1.3 apps fail to parse. No migration was involved.", ok: ["A"], w: "The fault is entirely on the server you control. Reverting to the previous compatible digest fixes every installed client at once (a forward-fix restoring the type works too).", an: "Put the old bike slots back." },
  { id: "r3", t: "Android 1.5 crashes at launch, before flags load. Staged rollout is at 20%.", ok: ["C", "D"], w: "Halt to stop more users getting it, then ship a replacement build. The flag can't reach a crash that happens before flags load.", an: "The light switch is in a room you can't get to yet." },
  { id: "r4", t: "During a rolling backend deploy, a migration dropped a column that v1 pods still read. v2 has written new rows since.", ok: ["G"], w: "Restore the column with a forward migration and backfill. Rolling back the image alone leaves the schema broken; restoring a backup throws away new writes.", an: "Rebuild the hallway you tore down; don't rewind the whole school day." },
  { id: "r5", t: "You notice the production candidate on TestFlight points at the staging API. It hasn't been submitted for review.", ok: ["D"], w: "Nothing is in users' hands yet, so there's nothing to pause. Stop promotion and build a correct candidate with a new build number; add a config preflight.", an: "Catch the wrong cake before it leaves the kitchen." }
];

/* ---------- DIAGRAMS ---------- */
const DIAGRAMS = [
  { id: "pipeline", t: "Trust boundaries in the pipeline", w: 900, h: 380,
    an: "Think of a school building: visitors stay in the lobby, staff have hallway badges, and only the principal has the safe key.",
    nodes: [
      { id: "pr", x: 20, y: 30, t: "Fork / branch PR", s: "untrusted code", k: "untrusted", i: "Anyone can open a PR. Treat its code as a stranger's: it may try to print secrets or poison caches." },
      { id: "val", x: 250, y: 30, t: "PR validation", s: "lint · unit · contract · sim", k: "untrusted", i: "on: pull_request with permissions: contents: read. No signing keys, no store credentials. Reports always uploaded." },
      { id: "gate", x: 480, y: 30, t: "ci-gate", s: "always runs · required", k: "neutral", i: "The single required check. Runs with if: always(), fails if any applicable job failed or was cancelled." },
      { id: "main", x: 710, y: 30, t: "Protected main", s: "review + checks", k: "trusted", i: "Branch protection: required ci-gate and review. Main stays releasable." },
      { id: "stg", x: 710, y: 170, t: "Trusted build", s: "image digest · staging", k: "trusted", i: "Rebuild trusted, record image digest, deploy to staging, smoke test. Not an app-store release." },
      { id: "beta", x: 480, y: 170, t: "Beta release", s: "env: release · signing", k: "secret", i: "Explicit run. Preflight, build number allocation, temp keychain, signed IPA/AAB, upload to TestFlight / internal track." },
      { id: "prom", x: 250, y: 170, t: "Promotion", s: "approval · same artifact", k: "secret", i: "Protected production environment with required reviewers. Promotes the existing candidate; never recompiles." },
      { id: "store", x: 20, y: 170, t: "Stores", s: "processing · review · rollout", k: "store", i: "Separate states: uploaded, processing, testers, review, phased/staged rollout, released." },
      { id: "night", x: 480, y: 300, t: "Nightly", s: "device matrix · drills", k: "trusted", i: "Wider device matrix, dependency scans and controlled drills, with bounded macOS minutes." }
    ],
    edges: [["pr", "val"], ["val", "gate"], ["gate", "main", "merge"], ["main", "stg"], ["stg", "beta", "explicit"], ["beta", "prom", "approve"], ["prom", "store"], ["stg", "night", "schedule"]] },
  { id: "android", t: "Android signing: two keys", w: 900, h: 320,
    an: "Your upload key is your library card. The app signing key is the library's official stamp, kept by the librarian.",
    nodes: [
      { id: "ci", x: 20, y: 40, t: "Package lane", s: "./gradlew bundleRelease", k: "trusted", i: "Builds the release AAB on a trusted runner, decoding the keystore to a temp file." },
      { id: "up", x: 250, y: 40, t: "Upload key", s: "yours · protected secret", k: "secret", i: "Signs what you upload. Lives in a secret manager. If lost, request an upload key reset." },
      { id: "play", x: 480, y: 40, t: "Play Console", s: "verifies upload cert", k: "store", i: "Rejects AABs signed with the wrong key: 'signed with the wrong key. Found SHA1… expected…'" },
      { id: "app", x: 710, y: 40, t: "App signing key", s: "held by Google", k: "store", i: "Play re-signs the APKs it generates. Devices verify updates against this certificate." },
      { id: "dev", x: 710, y: 200, t: "User devices", s: "verify app signing cert", k: "user", i: "Installed apps only accept updates signed by the same app signing key." },
      { id: "reset", x: 250, y: 200, t: "Upload key lost?", s: "request reset", k: "neutral", i: "Register a new upload certificate through Play Console. App signing key and users unaffected." }
    ],
    edges: [["ci", "up", "signs"], ["up", "play", "AAB"], ["play", "app", "re-sign"], ["app", "dev", "APKs"], ["reset", "play", "new cert"]] },
  { id: "ios", t: "iOS signing in CI", w: 900, h: 330,
    an: "The seal stamp (certificate) comes out of the locked drawer (match, read-only) into a box that gets thrown away after (temp keychain). The ticket (profile) says which letter it's allowed to seal.",
    nodes: [
      { id: "cert", x: 20, y: 30, t: "Distribution cert", s: "match repo · readonly", k: "secret", i: "Existing team certificate + private key, fetched read-only. CI never creates or revokes it." },
      { id: "kc", x: 250, y: 30, t: "Temp keychain", s: "setup_ci · deleted after", k: "secret", i: "Created per job, unlocked for codesign, deleted in an always-run cleanup." },
      { id: "prof", x: 20, y: 190, t: "Provisioning profile", s: "App ID · team · entitlements", k: "neutral", i: "Must match bundle ID, team and every entitlement. Decode with security cms -D -i." },
      { id: "gym", x: 480, y: 110, t: "Archive + export", s: "gym / xcodebuild", k: "trusted", i: "Where distribution signing actually gets checked. Simulator builds never reach here." },
      { id: "ipa", x: 710, y: 30, t: "IPA + dSYMs", s: "SHA-256 → manifest", k: "trusted", i: "Checksummed, stored with symbols and the release manifest." },
      { id: "asc", x: 710, y: 190, t: "App Store Connect", s: "upload ≠ released", k: "store", i: "Uploaded, processing, testers, review, phased release: separate states." }
    ],
    edges: [["cert", "kc", "import"], ["kc", "gym"], ["prof", "gym"], ["gym", "ipa"], ["ipa", "asc", "upload"]] },
  { id: "installed", t: "Who's installed right now", w: 900, h: 340,
    an: "Many classes share one cafeteria. You can change the menu, but you can't make every class eat at the same time.",
    nodes: [
      { id: "v13", x: 20, y: 20, t: "1.3 installed", s: "12% · strict decoder", k: "user", i: "Never updated. Can't decode new enum values or type changes." },
      { id: "v14", x: 20, y: 130, t: "1.4 installed", s: "61% · reads v1 status", k: "user", i: "Most users. Ignores eta_confidence." },
      { id: "v15", x: 20, y: 240, t: "1.5 phased", s: "27% · reads eta_confidence", k: "user", i: "New field optional; feature behind eta_confidence_enabled." },
      { id: "api", x: 330, y: 130, t: "/api/v1 contract", s: "additive only", k: "trusted", i: "One contract serving all three. Old-client fixtures are required checks." },
      { id: "b212", x: 640, y: 50, t: "Backend #212", s: "adds eta_confidence", k: "trusted", i: "Deployed before 1.5 shipped. Additive, so 1.3 and 1.4 are unaffected." },
      { id: "b198", x: 640, y: 210, t: "Rollback to #198?", s: "drops a field 1.5 reads", k: "danger", i: "A 'simple' backend rollback could break installed 1.5. Check compatibility with every installed version before reverting." }
    ],
    edges: [["v13", "api"], ["v14", "api"], ["v15", "api"], ["api", "b212", "serves"], ["api", "b198", "would serve"]] }
];

/* ---------- FLASHCARDS ---------- */
const CARDS = [
  ["AAB", "Android App Bundle. What you upload to Play; Play generates device-specific APKs.", "A box of LEGO pieces; the store builds the right model for each phone."],
  ["Upload key", "Your key that signs uploads to Play. Resettable through Play Console.", "Your library card."],
  ["App signing key", "Held by Google under Play App Signing. Devices verify updates against it.", "The library's official stamp."],
  ["match readonly", "Fastlane fetches existing certs/profiles without creating or revoking anything.", "Reading the recipe, not rewriting it."],
  ["setup_ci", "Fastlane action that creates a temporary keychain and puts match in readonly mode on CI.", "A throwaway lockbox for the seal stamp."],
  ["dSYM", "Debug symbols for an iOS build, matched by UUID. Needed to read crash stacks.", "Room labels on smoke detectors."],
  ["xcresult", "Xcode's test result bundle: logs, screenshots, timing. Save it as evidence.", "The graded test with the teacher's notes."],
  ["Phased release", "Apple's 7-day automatic-update schedule. Pausable; manual updates still allowed.", "Classes go to recess in a set order."],
  ["Staged rollout", "Play: you choose the percentage and can halt.", "A dimmer switch."],
  ["Release manifest", "Machine-readable record tying a binary to SHA, toolchain, checksums, symbols, backend digest and states.", "The packing slip with fingerprints."],
  ["Idempotency key", "Client-chosen key so a retried request has exactly one effect.", "Your deli ticket: same ticket, same order."],
  ["Expand/contract", "Add new schema, backfill, move readers, remove old later.", "Build the new hallway before closing the old one."],
  ["Readiness vs liveness", "Readiness: can I take traffic? Liveness: should I be restarted?", "'Do you have your homework?' vs 'Are you awake?'"],
  ["OIDC", "Short-lived cloud credentials federated from the CI identity. Doesn't replace store or signing secrets.", "A visitor badge, not the safe key."],
  ["pull_request_target", "Runs in the base repo's privileged context. Never run fork code in it.", "A stranger at the teacher's desk."],
  ["Aggregate check", "One always-running required job that passes only if every applicable job passed.", "The hall monitor who always shows up."],
  ["Runtime version", "Expo: OTA updates only reach binaries with a matching runtime. Native changes need a new one.", "New game levels, same console."],
  ["versionCode / CFBundleVersion", "Build numbers. Must increase and never be reused for a different binary.", "Deli ticket numbers."],
  ["Marketing version", "1.4.0 shown to users. Independent from API version.", "The textbook edition, not the classroom number."],
  ["Feature cohort", "Backend-controlled group that sees a feature. Switchable for installed apps.", "Which kids get to try the new slide."],
  ["Same-artifact promotion", "Move the exact tested bytes between tracks; never rebuild.", "Bring the cake you taste-tested."],
  ["Concurrency group", "Serializes runs. PRs: cancel superseded. Releases: never cancel mid-upload.", "One person at the mail slot at a time."]
];

/* ---------- INTERVIEW: technical questions with key points ---------- */
const IQ = [
  { q: "Why not deploy every merge to production?", k: ["Store review and processing aren't instant or in your control", "Installed binaries can't be recalled", "Main is releasable, not released; releases are explicit", "Approvals, compatibility evidence and monitoring come first", "Backend can deploy continuously; mobile can't the same way"] },
  { q: "Why use feature flags if the stores already stage releases?", k: ["Store rollout controls the binary, flags control the behavior", "Manual updates bypass phased release", "Flags can turn behavior off on already-installed apps", "Cohort targeting you control", "Decouple deploy from release"] },
  { q: "What's the smallest useful device matrix?", k: ["Both platforms", "Minimum supported OS and latest OS", "One small and one large screen", "Chosen from real usage data, not guesses", "Wider matrix nightly with bounded minutes"] },
  { q: "How do you prevent secrets leaking through a fork PR?", k: ["pull_request with read-only permissions for untrusted code", "No secrets available to fork runs", "Never run PR code in pull_request_target", "Release secrets only in protected environments with reviewers", "Test it with a harmless canary"] },
  { q: "What does rollback mean for an installed binary?", k: ["You can't uninstall it from devices", "Pausing/halting only stops new distribution", "Disable the flag for affected behavior", "Compatible backend fix or revert", "Replacement binary with a higher build number"] },
  { q: "How do you prove the promoted artifact is the tested artifact?", k: ["SHA-256 in the release manifest", "Same app ID and build number", "Promote, never rebuild", "Verify checksum before upload", "Store build ID recorded"] },
  { q: "Explain upload key vs app signing key.", k: ["Upload key signs what you send to Play", "App signing key is held by Google", "Devices verify against the app signing key", "Lost upload key: request reset, users unaffected", "Fingerprint preflight catches the wrong key"] },
  { q: "How do you handle iOS signing in CI?", k: ["macOS runner with pinned Xcode", "setup_ci temporary keychain", "match readonly; CI never creates or revokes certs", "Signing preflight: bundle ID, team, entitlements, profile", "Cleanup in an always-run step"] },
  { q: "How do you allocate build numbers?", k: ["One allocator per app/platform", "Concurrency-protected and durable", "Persisted with the Git SHA", "Cross-checked with the store's latest", "Retries reuse the existing artifact"] },
  { q: "Apple phased release vs Google Play staged rollout?", k: ["Apple: fixed 7-day schedule for automatic updates", "Apple: pausable; manual updates still possible", "Play: you choose and change percentage", "Play: you can halt", "Neither removes installed binaries"] },
  { q: "What did you personally review in AI-generated code?", k: ["Every command it ran or proposed", "Native diffs and release path", "Secrets, permissions and workflow triggers", "Tests that cover the risky path", "What I rejected and why"] },
  { q: "What would you simplify for a small team, and strengthen for a regulated one?", k: ["Small: managed runners, fewer environments, maybe EAS", "Small: one reusable lane set", "Regulated: required approvals and separation of duties", "Regulated: audit trail, retention, signed provenance", "Both: same honest evidence model"] }
];

/* ---------- STAR: behavioral questions with model answers ---------- */
const STARQ = [
  { q: "Tell me about a time a release went wrong.", drill: 16,
    S: "In my RouteReady portfolio lab, I ran a drill where version 1.5 rolled out with a new ETA confidence screen behind a feature flag. On day two of the phased release, crash-free sessions for the new build dropped well below the 1.4.2 baseline.",
    T: "I was acting as the release engineer: contain the impact for people who already had 1.5, find the root cause, and make sure it couldn't slip through again.",
    A: "I segmented crashes by release, OS and feature cohort and saw they were concentrated where eta_confidence_enabled was on. I turned the flag off remotely and paused the phased release. Then I fixed the rendering bug, added a regression test, and built a replacement with a higher build number through the normal beta and approval gates.",
    R: "In the lab fixture, the crash rate for installed 1.5 returned to baseline after the flag was off, before the new build shipped. I wrote an incident note and added a preflight that requires new UI behind a flag to have a crash test. I'd explain that this is lab evidence, not production experience." },
  { q: "Tell me about a time you improved a pipeline's reliability.", drill: 9,
    S: "My lab repo used path filters on the CI workflow. A PR that only changed the OpenAPI contract never ran any checks, and the required status sat pending.",
    T: "Make the required check reliable for every kind of change, without running expensive macOS jobs on docs-only PRs.",
    A: "I moved change detection into a job, mapped shared files like contracts and lockfiles to every affected client, and added one aggregate gate with if: always() that fails if any applicable job failed or was cancelled. I added a merge_group trigger for merge queues.",
    R: "I wrote test PRs for docs-only, mobile-only, contract-only, workflow-only and lockfile-only changes, and saved the before/after runs as evidence. No more stuck PRs, and contract changes now trigger both mobile clients." },
  { q: "Tell me about a security issue you caught.", drill: 10,
    S: "While designing my lab's CI, I tested a proposed workflow that used pull_request_target and checked out the PR head, with the release environment attached.",
    T: "Prove whether untrusted fork code could reach release secrets, and redesign so it couldn't.",
    A: "I used a harmless canary secret, opened a PR from a fork, and confirmed the canary printed in the log. I disabled the workflow, split validation onto pull_request with read-only permissions and no secrets, and moved signing into a separate workflow behind a protected environment with reviewers.",
    R: "The same fork test now can't read the canary, and it runs nightly. In a real incident I'd also rotate any genuinely exposed credentials and audit logs, artifacts and caches." },
  { q: "Tell me about a disagreement over a release decision.", drill: 15,
    S: "In a mock exercise, the backend for 1.5 was already live and the build was still processing in App Store Connect. The 'marketing' role wanted to announce the launch that day.",
    T: "Give an honest status and a safe plan without blocking the team unnecessarily.",
    A: "I explained the states separately: backend deployed and additive, feature dark behind a flag, binary uploaded but still processing. I proposed keeping the flag off and giving a next check time instead of a launch time, and changed the manifest so it can't say 'released' while processing.",
    R: "We agreed to announce after tester availability. The lesson I took: separate states make disagreements about facts disappear, so the conversation becomes about timing." },
  { q: "Tell me about how you use AI tools responsibly.", drill: 20,
    S: "In StayReady, an AI-generated PR added a camera library and proposed shipping it as an over-the-air update. It was 1,800 lines and CI was green.",
    T: "Decide whether it was safe to merge and ship, and use AI help without giving up review.",
    A: "I reviewed the native diff and saw a new native module, which can't ship OTA to existing binaries. I split the PR, asked for explanations of every generated command, added a preflight that blocks OTA when the native fingerprint changes, and planned a new binary with a new runtime version.",
    R: "The preflight test fails on the unsafe path and passes once the runtime is bumped. I kept a short record of what I accepted, what I rejected, and why." }
];

/* ---------- 8-minute walkthroughs ---------- */
const WALK = {
  RouteReady: [
    ["0–1", "Open", "I built a transportation portfolio lab to demonstrate mobile release engineering. Parents see synthetic bus status; a Java API ingests simulated events."],
    ["1–2", "Architecture", "Show the two native apps, backend, contract and simulator. Explain independent mobile/backend pipelines and why installed apps outlive a deployment."],
    ["2–3", "PR flow", "Show a small PR, the failing test, the correction and required checks. Explain branch protection and signing isolation."],
    ["3–4", "Lanes", "Show verify/package/beta lanes. Xcode vs Gradle, upload vs app signing keys, and the exact milestone reached."],
    ["4–5", "Evidence", "Show a release manifest and checksums. Trace the build to source and toolchain."],
    ["5–6", "Compatibility", "Demonstrate the additive ETA change while the old client stays compatible."],
    ["6–7", "Incident", "Inject stale telemetry or a signing preflight failure; show diagnosis and regression coverage."],
    ["7–8", "Honest close", "Recovery, what you measured, and what is still blocked or simulated."]
  ],
  StayReady: [
    ["0–1", "Open", "Explain the fictional guest-services use case and tenant boundaries."],
    ["1–2", "Reuse", "Same pipeline interfaces support React Native plus independently deployed FastAPI and web."],
    ["2–3", "PR flow", "Show a PR that fails a cross-tenant or idempotency test."],
    ["3–4", "Identity", "Trace native build, JS bundle, symbols and release identity."],
    ["4–5", "Offline", "Disconnect, queue a request, lose the response after commit, prove one persisted request."],
    ["5–6", "Observe", "Show a release dashboard or clearly labeled local fixture."],
    ["6–7", "OTA boundary", "Explain the blocked native-dependency OTA change."],
    ["7–8", "Trade-offs", "Managed EAS vs self-managed Fastlane, using your actual experiment results."]
  ]
};

const RUBRIC = ["Diagnosis uses evidence", "Containment is safe", "Fix addresses root cause", "Verification tests the actual failure", "Prevention is proportionate", "Explains mobile vs backend vs store behavior"];

/* ---------- REFERENCE REPO LINKS (files live in repo.js) ---------- */
const REPO_LINKS = {
  stations: {
    toolchain: ["docs/toolchain.md", "scripts/print-toolchain.sh", "scripts/pick-simulator.sh", "Gemfile"],
    branch: ["docs/adr/0001-trunk-based-development.md", "config/feature-flags.json", "docs/branch-protection.md"],
    prci: [".github/workflows/pr-ci.yml", "fastlane/Fastfile"],
    gate: ["scripts/gate.sh", ".github/workflows/pr-ci.yml", "docs/branch-protection.md"],
    main: [".github/workflows/main.yml", "scripts/deploy-staging.sh", "scripts/smoke.sh", "infra/docker-compose.yml"],
    backend: ["contracts/openapi.yaml", "contracts/fixtures/v1.3/route-status.json", "scripts/contract-check.sh", "services/api/db/migrations/README.md"],
    preflight: ["scripts/release-preflight.sh", "scripts/allocate-build-number.sh", "config/apps.json"],
    sign: ["fastlane/Fastfile", "fastlane/Matchfile", "scripts/signing-preflight-ios.sh", "apps/android/app/signing.gradle.kts", "scripts/verify-upload-cert.sh"],
    manifest: ["scripts/write-manifest.sh", "evidence/release-manifest.schema.json", "scripts/verify-manifest.sh"],
    beta: [".github/workflows/release-ios.yml", ".github/workflows/release-android.yml", "scripts/record-state.sh"],
    candidate: ["scripts/preflight-env.sh", "config/apps.json"],
    approve: [".github/workflows/promote.yml", "docs/release-checklist.md"],
    rollout: ["docs/rollout.md", "config/feature-flags.json"],
    observe: ["docs/observability.md", "scripts/upload-symbols.sh"],
    incident: ["docs/incident-runbook.md", "docs/rollout.md"],
    learn: ["drills/_template/incident.md", "evidence/README.md", "docs/progress.md"]
  },
  bugs: {
    b1: [".github/workflows/pr-ci.yml"], b2: [".github/workflows/pr-ci.yml"],
    b3: [".github/workflows/main.yml", "scripts/deploy-staging.sh"], b4: ["fastlane/Fastfile", "fastlane/Matchfile"],
    b5: ["fastlane/Fastfile", "scripts/allocate-build-number.sh"], b6: [".github/workflows/release-ios.yml"],
    b7: ["stayready/services/api/app/reservations.py"], b8: ["stayready/services/api/app/service_requests.py"],
    b9: ["contracts/openapi.yaml", "contracts/fixtures/v1.3/route-status.json"], b10: [".github/workflows/pr-ci.yml", "scripts/gate.sh"],
    b11: [".github/workflows/pr-ci.yml", "scripts/pick-simulator.sh"], b12: ["evidence/release-manifest.schema.json", "scripts/write-manifest.sh"]
  },
  drills: {
    1: ["scripts/signing-preflight-ios.sh", "fastlane/Matchfile"], 2: [".github/workflows/release-ios.yml", "fastlane/Fastfile"],
    3: ["scripts/verify-upload-cert.sh", "apps/android/app/signing.gradle.kts"], 4: ["scripts/allocate-build-number.sh"],
    5: ["scripts/pick-simulator.sh", "docs/toolchain.md"], 6: [".github/workflows/pr-ci.yml", "docs/toolchain.md"],
    7: [".github/workflows/pr-ci.yml"], 8: ["fastlane/Fastfile"], 9: ["scripts/gate.sh", ".github/workflows/pr-ci.yml"],
    10: [".github/workflows/pr-ci.yml", "docs/branch-protection.md"], 11: ["scripts/contract-check.sh", "contracts/openapi.yaml", "contracts/fixtures/v1.3/route-status.json"],
    12: ["services/api/src/main/java/org/routeready/telemetry/TelemetryIngestService.java"], 13: ["infra/docker-compose.yml"],
    14: ["services/api/db/migrations/README.md", "services/api/db/migrations/V7__expand_add_eta_confidence.sql"],
    15: ["scripts/record-state.sh", "scripts/poll-store-state.sh"], 16: ["docs/rollout.md", "config/feature-flags.json"],
    17: ["stayready/services/api/app/reservations.py", "scripts/preflight-env.sh"], 18: ["stayready/services/api/app/service_requests.py"],
    19: ["scripts/upload-symbols.sh"], 20: ["stayready/mobile/app.config.snippet.json"]
  }
};
const drillSlug = d => `drills/${String(d.n).padStart(2, "0")}-${d.t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}/README.md`;
