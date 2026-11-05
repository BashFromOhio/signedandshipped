# Incident runbook

1. **Signal:** what alerted, when (relative time), which release/build.
2. **Scope:** which platforms, versions, cohorts. Who's installed (old clients too).
3. **Contain:** flag off · pause phased release / halt staged rollout · revert backend to a *compatible* digest.
4. **Diagnose:** evidence first (manifest, logs, symbols). Write rejected hypotheses down.
5. **Fix:** compatible backend fix, or replacement binary with a higher build number through the normal gates.
6. **Verify:** against the actual failure, including the installed population.
7. **Prevent:** a preflight, test or gate. Name an owner.
8. **Write up:** `drills/_template/incident.md`. No invented minutes or money.
