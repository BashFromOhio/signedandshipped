# Drill 10: Secret exposure through a PR

**Lab:** Either · **Area:** Security · **Interview priority**

> Like you're 10: A visitor asked to use the teacher's desk. The answer key was in the drawer.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, proposed a workflow that runs fork code with release secrets (harmless canary).

## 2. Expected symptom
A proposed workflow gives untrusted code access to a release environment. The canary showed up in logs.

Example (redacted) output, proposed .github/workflows/build.yml:
```
on: pull_request_target
jobs:
  build:
    environment: release
    steps:
      - uses: actions/checkout@v4
        with: { ref: ${{ github.event.pull_request.head.sha }} }
      - run: ./scripts/build.sh
        env: { MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }} }
[log] CANARY_7f3a●●●● printed by scripts/build.sh from fork
```

## 3. Diagnose
- Leading hypothesis: A privileged pull_request_target job checks out and runs fork code with secrets
- Next command: Trace the event, checkout ref, permissions, environment gates and cache/artifact inputs; list which secrets were in scope

## 4. Contain and fix
Stop the job and disable the workflow, rotate any real exposed credentials, audit logs/artifacts/caches; split PR validation (pull_request, no secrets) from trusted release

## 5. Verify
A fork PR in a test repo cannot read the canary

## 6. Complication to rehearse
A new design uses workflow_run to sign artifacts produced by the PR build. → Those artifacts are untrusted input; don't sign them. Rebuild from a trusted SHA and validate

## 7. Senior follow-up
**Why does workflow_run need careful artifact trust validation?**

<details><summary>Strong answer</summary>

workflow_run runs privileged code, but the artifacts it downloads may have been produced by untrusted PR code. Treat them as data from strangers: validate, never execute or sign them, and build releases from trusted refs.
</details>

## Reference files
- [.github/workflows/pr-ci.yml](../../.github/workflows/pr-ci.yml)
- [docs/branch-protection.md](../../docs/branch-protection.md)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
