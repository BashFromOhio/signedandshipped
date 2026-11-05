# Drill 19: Crash report lacks usable symbols

**Lab:** StayReady · **Area:** Observability

> Like you're 10: The smoke detector rings but nobody labeled the rooms.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, skipped dSYM/source-map upload for the shipped build.

## 2. Expected symptom
The stack trace is unreadable or points to the wrong source line.

Example (redacted) output, crash report · StayReady 2.1 (140):
```
Thread 0 Crashed:
0  StayReady   0x0000000104a2c3f8 StayReady + 1234936
1  StayReady   0x0000000104a1b210 StayReady + 1164560
warning: missing dSYM for UUID 9A1B●●●●-…
JS: index.android.bundle:1:48211 (no source map for dist=140)
```

## 3. Diagnose
- Leading hypothesis: The exact build's dSYM/source map wasn't uploaded, or another build's was
- Next command: dwarfdump --uuid on the retained dSYM vs the crash UUID; compare release/dist with the manifest

## 4. Contain and fix
Upload the exact retained dSYMs/maps from the shipped build artifact with correct release and dist

## 5. Verify
A controlled crash resolves to the expected source line

## 6. Complication to rehearse
The build's CI artifacts expired after 7 days. → Symbol retention must exceed the support window; store them with the manifest in long-term artifact storage

## 7. Senior follow-up
**Why may rebuilding the same Git SHA produce unusable replacement symbols?**

<details><summary>Strong answer</summary>

Each compile produces new binary UUIDs and can differ in toolchain, flags or code layout. Symbols must come from the exact binary users are running.
</details>

## Reference files
- [scripts/upload-symbols.sh](../../scripts/upload-symbols.sh)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
