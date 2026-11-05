# Drill 15: Store processing or review delay

**Lab:** Either · **Area:** Release

> Like you're 10: You told everyone Grandma got the present. It's still at the sorting center.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, made the distribution adapter stay in processing/review.

## 2. Expected symptom
CI upload is green, but testers or users can't install.

Example (redacted) output, release-ios #431 · beta:
```
[upload_to_testflight] Successfully uploaded the new binary to App Store Connect
[poll] build 61 processingState=PROCESSING (t+45m)
[slack-bot] ✅ RouteReady 1.5 released!
tester: "No new build in TestFlight"
```

## 3. Diagnose
- Leading hypothesis: Upload was treated as release; processing/availability/review are separate and still pending
- Next command: Query App Store Connect for build processing and beta review state and check agreements/metadata

## 4. Contain and fix
Track separate states in the manifest, use bounded polling and a scheduled status check, keep the feature off, report truthfully

## 5. Verify
The manifest schema rejects 'released' while processing

## 6. Complication to rehearse
The backend for 1.5 is already live and marketing wants to announce today. → Keep the flag off (backend is additive, so no impact), share the real state and a next check time

## 7. Senior follow-up
**How do you communicate a launch delay when backend is already live?**

<details><summary>Strong answer</summary>

State facts: the backend is deployed, additive and dark behind a flag; the binary is in processing/review; here's the next update time. No promises the store controls.
</details>

## Reference files
- [scripts/record-state.sh](../../scripts/record-state.sh)
- [scripts/poll-store-state.sh](../../scripts/poll-store-state.sh)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
