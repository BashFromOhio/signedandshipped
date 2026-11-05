# Drill 9: Required check stuck pending

**Lab:** Either · **Area:** CI

> Like you're 10: The hall monitor only works Mondays. On Tuesday, the line never moves.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, changed a contract file the path filters didn't include.

## 2. Expected symptom
The PR never finishes, or mobile checks are skipped incorrectly.

Example (redacted) output, PR #73 · checks:
```
ci-gate         Expected — Waiting for status to be reported
Changed files: contracts/openapi.yaml
on:
  pull_request:
    paths: ['apps/**']
```

## 3. Diagnose
- Leading hypothesis: Workflow-level path filtering skipped the whole workflow, so the required check never reported
- Next command: Inspect the workflow's on.paths, job needs/if and the PR's check runs

## 4. Contain and fix
Always trigger the workflow, detect changes in a job, map contracts to all clients, and run the aggregate with if: always()

## 5. Verify
Test PRs for mobile-only, contract-only, docs-only, workflow-only and lockfile-only changes

## 6. Complication to rehearse
You enable a merge queue. Queue entries sit waiting with no checks. → The merge_group trigger on the workflow

## 7. Senior follow-up
**How does your design work with a merge queue?**

<details><summary>Strong answer</summary>

The workflow listens to merge_group as well as pull_request. The always-running gate reports for queue entries too, so the queue tests the combined result before it lands on main.
</details>

## Reference files
- [scripts/gate.sh](../../scripts/gate.sh)
- [.github/workflows/pr-ci.yml](../../.github/workflows/pr-ci.yml)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
