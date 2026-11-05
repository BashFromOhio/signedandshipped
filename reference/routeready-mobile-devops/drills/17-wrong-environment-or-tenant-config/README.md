# Drill 17: Wrong environment or tenant config

**Lab:** StayReady · **Area:** Security

> Like you're 10: Anyone can write any name on a name tag. The teacher has to check the class list, not the tag.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, let tenant identity come from an editable header.

## 2. Expected symptom
A Cedar Cove guest sees a Harbor House reservation.

Example (redacted) output, stayready-api · access log:
```
GET /api/v1/reservations/current
  auth.sub=guest-cedar-014  X-Tenant-Id: harbor-house
  200 OK  tenant=harbor-house reservation=res-hh-221
code: tenant_id = request.headers.get('X-Tenant-Id')
```

## 3. Diagnose
- Leading hypothesis: The server trusts a client header to choose the tenant
- Next command: Trace the authorization code path and run a negative test with a modified header; check logs for scope

## 4. Contain and fix
Restrict the endpoint/deploy the fix now, assess exposure from logs; derive tenant from the authenticated identity server-side

## 5. Verify
Negative cross-tenant tests (IDs and headers) fail closed in CI

## 6. Complication to rehearse
You also find the production candidate IPA has a staging API URL baked in. → A preflight that inspects compiled public config against the target environment before upload

## 7. Senior follow-up
**Which configuration is safe to bundle in a mobile app?**

<details><summary>Strong answer</summary>

Public things: API base URL, environment name, public crash-reporting DSN, theme, flag defaults. Never anything that grants privilege: API secrets, signing keys, admin tokens. Anything in the app can be read by anyone.
</details>

## Reference files
- [stayready/services/api/app/reservations.py](../../stayready/services/api/app/reservations.py)
- [scripts/preflight-env.sh](../../scripts/preflight-env.sh)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
