# Level 12 · Break-fix drills

**Difficulty** ★★☆☆☆ → ★★★★★ · **Time** 15–40 min each · **Sprint** 6–7 · **Tickets** MOB-115 (respond), MOB-116 (write it up)

## The story
Dana: *"Anyone can follow a happy path. I hire people who've seen things break. Break each one on purpose, fix it with evidence, and write the one-paragraph story."*

## How every drill works
```bash
local/drill.sh list           # what's available, ✓ = fixed
local/drill.sh start 3        # break it (files are backed up first)
#   …reproduce, collect evidence, fix…
local/drill.sh hint 3         # a nudge, not the answer
local/drill.sh check 3        # verifies your fix
local/drill.sh solution 3     # the answer + a STAR outline
local/drill.sh reset          # undo all drills, API back to normal
```
For each one, write a short note using `drills/_template/incident.md`: symptom, first evidence, root cause, fix, verification, prevention.

## The drills (easiest first within each group)

### Android build and install
| # | Drill | ★ | Break | Evidence to collect | Skills |
|---|---|---|---|---|---|
| 8 | Gradle points at a missing JDK | ★★ | `org.gradle.java.home` added to `gradle.properties` | the Gradle error text | Toolchain hygiene, no machine paths in git |
| 6 | Version downgrade | ★★ | Install a lower `versionCode` over a higher one | `INSTALL_FAILED_VERSION_DOWNGRADE` | Build-number allocation (MOB-107) |
| 1 | Emulator can't reach the API | ★★ | Debug URL becomes `localhost` | the start screen's API line, the logcat network error | Emulator networking, `adb reverse` |
| 5 | Signature mismatch | ★★★ | Release (upload key) over debug (debug key) | `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, `07-debug-apk.sh state` | Signing identity, Play App Signing |
| 2 | Cleartext blocked | ★★★ | Remove `10.0.2.2` from the debug network config | `CLEARTEXT communication … not permitted` in logcat | Network security config, debug vs release |

### Runtime incidents
| # | Drill | ★ | Break | Evidence | Skills |
|---|---|---|---|---|---|
| 3 | Crash on null ETA confidence | ★★★ | API sends `"eta_confidence": null` | `adb logcat -b crash`, the request_id in `api.log` | Stack traces, containment, regression tests ([Level 07](level-07.md)) |
| 11 | Flaky 503s | ★★★ | Every other API call fails | App screen + both logs, matched by request_id | Graceful degradation, correlation IDs |
| 4 | Old data shown as LIVE | ★★★★ | Stale threshold off by 1000×, and the server lies (`is_stale: false`) | The age label vs the badge; the failing unit test | Don't trust one side; tests catch units bugs |
| 7 | API rename breaks installed apps | ★★★★ | Backend renames `status`/`delay_minutes` | `local/03-run-api.sh --check` output, the app's error | Additive contracts, backend-first rollout (MOB-106) |

### StayReady (React Native)
| # | Drill | ★ | Break | Evidence | Skills |
|---|---|---|---|---|---|
| 9 | Duplicate service requests | ★★★★ | Server ignores `Idempotency-Key` | Count requests before and after one tap with retries | Idempotency (drill 18 in the game) |
| 10 | Tenant data leak | ★★★★★ | Server trusts `X-Tenant` header | `curl` as Cedar Cove sees Harbor House | Authorization from verified identity (drill 17) |

## Reproduce drill 9 without the app
```bash
local/drill.sh start 9
for i in 1 2 3; do
  curl -s -X POST localhost:8080/stayready/v1/service-requests \
    -H 'Authorization: Bearer cedar-cove-guest' -H 'Idempotency-Key: tap-42' \
    -d '{"reservation_id":"cc-101","kind":"towels"}' >/dev/null
done
curl -s -H 'Authorization: Bearer cedar-cove-guest' localhost:8080/stayready/v1/service-requests | grep -c '"id"'
# drill mode: 3 requests. After `local/drill.sh api-mode normal`: retries with the same key create no new ones.
```

## Done when
All 11 show ✓ in `local/drill.sh list`, and you have a note for at least drills 1, 3 and 7. Those are the interview favourites.

## Interview angle
Pick your best three drills and practice them as 90-second STAR stories in the game's Interview Room. Say "in my RouteReady lab". Name the exact command that gave you the first real evidence; that's the detail that sounds senior.
