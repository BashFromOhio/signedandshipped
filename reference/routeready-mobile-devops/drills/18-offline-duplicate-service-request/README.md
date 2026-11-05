# Drill 18: Offline duplicate service request

**Lab:** StayReady · **Area:** API

> Like you're 10: You mailed a letter, never heard back, mailed it again. Now the plumber shows up twice.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, committed a request, then dropped the response so the client retried.

## 2. Expected symptom
Two maintenance tickets for one tap.

Example (redacted) output, stayready · service_requests:
```
client: POST /service-requests key=7c1e… → timeout (server committed)
client: reconnect, retry POST key=7c1e…
db: #881 tenant=cedar-cove 'Leaking faucet' 18:02:11
db: #882 tenant=cedar-cove 'Leaking faucet' 18:02:13
```

## 3. Diagnose
- Leading hypothesis: The retry after commit isn't deduplicated atomically by idempotency key
- Next command: Trace the key in request logs and the DB; check for a unique constraint and transaction boundaries

## 4. Contain and fix
Unique (tenant_id, idempotency_key); store the original response in the same transaction; on conflict return it; client reuses the key

## 5. Verify
Real network-response loss (proxy drops the reply after commit) plus concurrent retries create exactly one row

## 6. Complication to rehearse
A client bug sends the same key with a different description. → Reject with a clear error (409/422); don't return the old result or overwrite

## 7. Senior follow-up
**How should the server handle the same key with a different payload?**

<details><summary>Strong answer</summary>

Store a hash of the original payload with the key. On replay, compare hashes: same returns the stored response, different returns a conflict error so the client bug surfaces.
</details>

## Reference files
- [stayready/services/api/app/service_requests.py](../../stayready/services/api/app/service_requests.py)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
