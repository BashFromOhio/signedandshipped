# Drill 11: API breaks an installed client

**Lab:** RouteReady · **Area:** API · **Interview priority**

> Like you're 10: You ripped out the old skinny bike-rack slots. Every kid on an old bike now has nowhere to park.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, changed delay_minutes from a number to a string.

## 2. Expected symptom
The new client works; the previous client fails to parse route status.

Example (redacted) output, RouteReady iOS 1.3 (installed) · crash log:
```
DecodingError.typeMismatch(Swift.Int, Context(
  codingPath: [status, delay_minutes],
  debugDescription: "Expected to decode Int but found a string instead."))
API deploy: routeready-api@sha256:4be1●●●● (12 min ago)
Installed: 1.3 (12%), 1.4 (61%), 1.5 phased (27%)
```

## 3. Diagnose
- Leading hypothesis: The backend changed a field's type; 1.3 is still installed and can't decode it
- Next command: Replay recorded 1.3 fixtures against the candidate API and run a contract diff old vs new

## 4. Contain and fix
Restore the additive shape (revert the backend to a compatible digest or forward-fix), and disable the new behavior flag

## 5. Verify
Previous and current client contract tests pass as a required PR check

## 6. Complication to rehearse
Reverting the backend would also revert a migration that 1.5 depends on. → Roll forward: a compatible backend fix that serves both shapes; never roll back schema blindly

## 7. Senior follow-up
**Why can't you just require all users to update immediately?**

<details><summary>Strong answer</summary>

Store review takes time, users delay updates, some devices can't run the newest OS, some are offline, and a force-update screen itself requires the old app to parse the server's response. Installed apps outlive any single deployment.
</details>

## Reference files
- [scripts/contract-check.sh](../../scripts/contract-check.sh)
- [contracts/openapi.yaml](../../contracts/openapi.yaml)
- [contracts/fixtures/v1.3/route-status.json](../../contracts/fixtures/v1.3/route-status.json)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
