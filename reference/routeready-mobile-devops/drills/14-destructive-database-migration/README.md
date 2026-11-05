# Drill 14: Destructive database migration

**Lab:** Either · **Area:** Backend

> Like you're 10: You tore down the old hallway before the new one was finished, and half the class is still walking through it.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, dropped a column that previous API versions still read.

## 2. Expected symptom
A rolling deploy fails after some instances update.

Example (redacted) output, routeready-api · rolling deploy:
```
migration 0009_drop_eta_minutes applied
v1 pod: ERROR: column "eta_minutes" does not exist
v2 pods: OK
rollout: 3/6 updated, v1 error rate 41%
```

## 3. Diagnose
- Leading hypothesis: The migration removed a column older pods still read during the rollout overlap
- Next command: Check schema revision, the failing queries and which versions are running

## 4. Contain and fix
Pause the rollout, apply a forward migration restoring the column, then redo it as expand → backfill → transition → contract

## 5. Verify
CI runs both server versions against the migrated schema

## 6. Complication to rehearse
v2 has written new rows since the column was dropped. → Backfill the restored column for those rows before old readers rely on it

## 7. Senior follow-up
**Why is rolling back the application image alone insufficient?**

<details><summary>Strong answer</summary>

The database already changed. Old code against new schema still fails. Schema changes need their own forward fix and an expand/contract plan so every running version works throughout.
</details>

## Reference files
- [services/api/db/migrations/README.md](../../services/api/db/migrations/README.md)
- [services/api/db/migrations/V7__expand_add_eta_confidence.sql](../../services/api/db/migrations/V7__expand_add_eta_confidence.sql)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
