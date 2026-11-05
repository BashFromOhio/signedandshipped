# Drill 8: Flaky UI test

**Lab:** RouteReady · **Area:** Testing

> Like you're 10: You check the oven after exactly 2 minutes every time. Some days the cookies aren't done yet, and you blame the cookies.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, added random simulator/API delay.

## 2. Expected symptom
The route screen assertion fails intermittently.

Example (redacted) output, pr-ci · RouteScreenUITests (20 runs):
```
Test Case '-[RouteScreenUITests testShowsBusStatus]' failed (2.104 seconds).
  XCTAssertTrue failed - Failed to find "Bus 12 · On time" after 2.0s
Failures: 3 / 20 runs
Fixture seed: random (not recorded)
```

## 3. Diagnose
- Leading hypothesis: A race between fixture latency and a fixed-time assertion
- Next command: Inspect the xcresult (screenshots, timing) and rerun many times with a fixed fixture seed

## 4. Contain and fix
Deterministic fixture server and explicit readiness waits on an accessibility identifier; remove sleeps; quarantine only with an owner and deadline

## 5. Verify
Repeat 50 times on the declared device matrix and report the failure frequency

## 6. Complication to rehearse
A teammate proposes auto-retrying failed UI tests in CI. → Only with reporting of flaky rate and a cap; retries can hide a real race users would hit

## 7. Senior follow-up
**When does a retry conceal a genuine race?**

<details><summary>Strong answer</summary>

When the race is in the app, not the test. For example, the UI briefly shows a 'current' bus before the stale check runs. A retry makes CI green while real users still see wrong data.
</details>

## Reference files
- [fastlane/Fastfile](../../fastlane/Fastfile)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
