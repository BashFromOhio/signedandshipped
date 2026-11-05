# Level 03 · Run the API and prove old apps still work

**Difficulty** ★☆☆☆☆ · **Time** 10 min · **Sprint** 1 · **Tickets** MOB-105, MOB-106

## The story
Dana: *"12% of parents still run app 1.3. When the backend changes, their app must keep working. Run the API locally and prove it with a contract check."*

## Like I'm 10
Old remote controls must still work with the new TV. Before you sell the new TV, you test it with the old remote.

## Run it
```bash
local/03-run-api.sh            # foreground: watch every request scroll by (Ctrl+C stops)
# or
local/03-run-api.sh --bg       # background + smoke test + contract check
local/03-run-api.sh --check    # re-run the checks any time
local/03-run-api.sh --stop
```

## What happens, step by step
1. `local/mock-api/server.py` starts on port **8080** on all interfaces, so the emulator can reach it at `10.0.2.2` and a phone on your Wi-Fi at your computer's IP. It uses only the Python standard library, so there's nothing to install.
2. A fake bus drives a loop, and every status reply says **when** the position was observed (`observed_at`).
3. Every response carries an **`X-Request-Id`**, and every request is logged to `.tools/api.log`. In Level 07 you'll match app log lines to these.
4. `--check` calls `/health`, fetches a route status, then runs **`check_contract.py`**. That script compares the live response with the recorded shapes in `contracts/fixtures/v1.3/` and `v1.5/`. If a field an installed app reads is missing or changed type, it fails.

## Try these yourself
```bash
curl -s localhost:8080/health
curl -s -H 'Authorization: Bearer demo-parent' localhost:8080/api/v1/routes
curl -s -H 'Authorization: Bearer demo-parent' localhost:8080/api/v1/routes/r-1/status
curl -s localhost:8080/api/v1/routes          # 401: no token
curl -s -H 'Authorization: Bearer cedar-cove-guest' localhost:8080/stayready/v1/reservations
```

## Drill modes (used in Level 12)
`local/drill.sh api-mode stale|null-eta|breaking-v2|slow|flaky-503|tenant-header-bug|no-idempotency|normal`. The server re-reads the mode on every request, so there's no restart.

## Expected output (`--check`)
```
✓ /health
{ "route_id": "r-1", "status": "ON_TIME", ... }
PASS  app v1.3: every field it reads is still there
PASS  app v1.5: every field it reads is still there
```

## Done when
Both versions PASS.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `Address already in use` | Something else is on 8080 | `PORT=8081 local/03-run-api.sh`, then set `routereadyApiBaseUrl=http://10.0.2.2:8081` |
| `Nothing answering` | Server not running | `local/03-run-api.sh --bg` |
| Contract FAIL | A drill left the API in a breaking mode | `local/drill.sh reset` |

## Interview angle
**Q: "You need to rename a field in the API. How?"**
Additively. Add the new field, keep the old one, ship the backend first, and check the old clients' recorded shapes in CI with a contract check. Remove the old field only after no supported app version reads it. Mobile apps can't be force-updated the way a website can.

**Next:** [Level 04](level-04.md)
