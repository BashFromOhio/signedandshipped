# Drill 4: Duplicate build numbers

**Lab:** Either · **Area:** Release · **Interview priority**

> Like you're 10: Two deli machines both printed ticket 57. Only one customer gets served; the other is confused.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, launched two release jobs at the same time against the same counter.

## 2. Expected symptom
One upload succeeds, the other is rejected, and a retry creates an ambiguous artifact.

Example (redacted) output, release-ios #418 / #419:
```
release-ios #418  sha=9f2c4e1  build_number=57  upload ✔
release-ios #419  sha=b71a0d3  build_number=57
[upload_to_testflight] ERROR ITMS-90189: Redundant Binary Upload.
  You've already uploaded a build with build version '57' for version number '1.4.0'.
[retry] gym: Archiving RouteReady…   # rebuilt on retry
```

## 3. Diagnose
- Leading hypothesis: Two jobs read the same counter at once; allocation isn't serialized or durable
- Next command: Compare both manifests (SHA, build number, artifact SHA-256), the allocator's state/log and the store's build history

## 4. Contain and fix
Serialize allocation per app/platform with an atomic store; persist the reservation with the SHA; retries reuse the original artifact and checksum

## 5. Verify
Launch two parallel release jobs in a sandbox: distinct numbers; an upload retry references the same checksum without rebuilding

## 6. Complication to rehearse
The repo moves to a new GitHub org. Run counters reset to 1. → The allocator is external and seeded from the store's latest build number; it never goes backward

## 7. Senior follow-up
**What changes when moving to a new CI repository?**

<details><summary>Strong answer</summary>

Run counters reset, secrets and environments must be recreated, OIDC trust conditions reference the repo name, and caches start cold. The allocator must live outside the CI repo and be seeded from the store's highest build number. Also watch Android's versionCode ceiling.
</details>

## Reference files
- [scripts/allocate-build-number.sh](../../scripts/allocate-build-number.sh)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
