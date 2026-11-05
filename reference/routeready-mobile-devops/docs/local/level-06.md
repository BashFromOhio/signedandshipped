# Level 06 · Install, run and watch the app

**Difficulty** ★★☆☆☆ · **Time** 10 min · **Sprint** 1 (exit test) · **Ticket** MOB-103

## The story
Dana: *"Sprint 1 is done when one fake bus position goes from the API to the app on a device, and you can show me the log line for it."*

## Like I'm 10
You built the toy (Level 04) and set up the playroom (Level 05). Now you put the toy in the room, turn it on, and listen to what it says.

## Run it
```bash
local/03-run-api.sh --bg        # if it isn't running already
local/06-install-run.sh         # installs, launches, then streams the app's logs
local/06-install-run.sh --no-logs
```

## What happens, step by step
1. `adb install -r app-debug.apk`. `-r` replaces the installed version and keeps its data.
2. `adb shell am start -n org.routeready.parent/.MainActivity` launches the app's main screen.
3. `adb shell pidof org.routeready.parent` finds the app's process ID.
4. `adb logcat --pid=<pid> RouteReady:V AndroidRuntime:E '*:S'` shows **only this app's** logs: everything tagged `RouteReady`, plus crashes. Everything else is silenced.

## In the app
1. **Sign in as demo parent.** The start screen prints the API URL and version, the first thing to check when something's wrong.
2. Tap **Route 1**. You should see a green **LIVE** badge, "On time" or "Running N min late", and **"updated N s ago"**.
3. ETA confidence shows only if the feature flag is on. The demo parent is in the `beta-district-1` cohort from `config/feature-flags.json`, so it is.
4. Go back and open **Service alerts**.

## Expected logs
```
11-05 09:12:01.233 I/RouteReady( 8123): start version=1.5.0 (1) api=http://10.0.2.2:8080 debug=true
11-05 09:12:04.410 I/RouteReady( 8123): GET /api/v1/routes -> 200 request_id=3f9a1c2b7d10
11-05 09:12:06.022 I/RouteReady( 8123): GET /api/v1/routes/r-1/status -> 200 request_id=a81c0e55b2f4
```
Now find `a81c0e55b2f4` in `.tools/api.log`. That's how you'll link a crash to the backend request in Level 07.

## Done when
You've seen LIVE data in the app **and** matched one request_id across both logs. Mark "Local vertical slice" as VERIFIED (Android) in `docs/progress.md`.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| "Can't reach RouteReady … failed to connect to /10.0.2.2:8080" | API not running | `local/03-run-api.sh --bg` |
| "… localhost/127.0.0.1:8080" | The build points at localhost | Drill 1 |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | A release build with another key is installed | Drill 5: `adb uninstall org.routeready.parent` (lab only) |
| App closes instantly | A crash | `local/07-debug-apk.sh crash` |

## Interview angle
**Q: "A parent says the app shows nothing. What do you check first?"**
Which build and environment they're on (the start screen shows the version and API URL), whether the API is reachable, then the app's logs filtered to its process, matching request IDs to server logs. Evidence first, guesses second.

**Next:** [Level 07](level-07.md), the main event.
