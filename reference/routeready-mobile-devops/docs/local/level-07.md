# Level 07 · Debug the APK

**Difficulty** ★★★★☆ · **Time** 45–60 min · **Sprint** 6–7 · **Tickets** MOB-114 (observe), MOB-115 (incident)

## The story
**PAGE, 07:40:** *"Crash rate on 1.5 jumped after the backend started sending `eta_confidence: null` for new routes. You're on call."* Dana: *"Contain it for people who already installed it, then fix it. Show me the evidence."*

## Like I'm 10
The toy broke. You don't shake it and hope. You look at what it says when it breaks (the crash log), open it up and look inside (inspect), and watch it step by step in slow motion (the debugger).

## Your toolbox
```bash
local/07-debug-apk.sh inspect   # what's inside the APK
local/07-debug-apk.sh logs      # this app's live logs
local/07-debug-apk.sh crash     # the last crash's stack trace
local/07-debug-apk.sh state     # what's installed on the device (version, signer, screen)
local/07-debug-apk.sh shot      # screenshot → evidence/local/
local/07-debug-apk.sh jdb       # pause at launch and attach the Java debugger
local/07-debug-apk.sh net       # how the emulator reaches your computer
```

## Part A · Inspect the APK (no device needed)
```bash
local/07-debug-apk.sh inspect
```
| Tool | Shows | Why you care |
|---|---|---|
| `aapt2 dump badging` | package, versionCode/Name, SDK levels, permissions | "Is this the build I think it is?" |
| `apkanalyzer manifest print` | the **merged** manifest | Libraries can add permissions you never wrote |
| `apksigner verify --print-certs` | the signing certificate (debug key here) | A debug-signed APK must never reach a store |
| `apkanalyzer dex packages` | the code inside | Did R8 strip something it shouldn't have? |
| `sha256` | fingerprint of the exact file | Ties the file to a release manifest (Level 08) |

## Part B · Make it crash, then read the crash
1. Turn the incident on:
   ```bash
   local/drill.sh start 3       # API sends eta_confidence: null; flag forced on
   ```
2. In the app, open **Route 1**. The app closes.
3. Read the crash:
   ```bash
   local/07-debug-apk.sh crash
   ```
   ```
   E AndroidRuntime: FATAL EXCEPTION: Thread-3
   E AndroidRuntime: Process: org.routeready.parent, PID: 8123
   E AndroidRuntime: org.json.JSONException: Value null at eta_confidence of type org.json.JSONObject$1 cannot be converted to double
   E AndroidRuntime:   at org.json.JSON.typeMismatch(JSON.java:…)
   E AndroidRuntime:   at org.json.JSONObject.getDouble(JSONObject.java:…)
   E AndroidRuntime:   at org.routeready.parent.RouteStatus$Companion.parse(Models.kt:44)
   E AndroidRuntime:   at org.routeready.parent.MainActivity.showStatus$refresh$lambda$…(MainActivity.kt:…)
   ```
   **How to read it:** the top line is *what* went wrong. Scan down to the **first line in your package** (`org.routeready.parent…`). That's the file and line to open: `Models.kt:44`.
4. Find the backend request that triggered it. The line just before the crash in `local/07-debug-apk.sh logs` has a `request_id`. Find the same id in `.tools/api.log`, which shows `mode=null-eta`.

## Part C · Contain first (what you'd do in production)
Users who already installed 1.5 can't wait for a new release. The ETA-confidence UI sits behind a flag:
```bash
local/drill.sh flag eta off
```
Re-open Route 1. Does it still crash? **It does**, because parsing happens before the flag check. That's a real lesson: a flag only contains a crash if it gates the **code that crashes**. Write that in your incident note. The server-side containment is to stop sending null (`local/drill.sh api-mode normal`), because the app can't be fixed remotely.

## Part D · Step through it with a debugger (jdb)
```bash
local/drill.sh api-mode null-eta
local/07-debug-apk.sh jdb
```
At the `>` prompt:
```
stop in org.routeready.parent.RouteStatus$Companion.parse
cont
```
In the app, sign in and open Route 1. jdb stops at a breakpoint.
```
where          # the call stack
next           # step one line
locals         # variables (o = the JSON object)
print o.isNull("eta_confidence")
cont
quit
```
Prefer clicking? In Android Studio, open `apps/android`, then **Run → Attach Debugger to Android Process**. It uses the same mechanism (JDWP over adb).

## Part E · Fix it, prove it, prevent it
1. In `Models.kt`, change the eta line to:
   ```kotlin
   etaConfidence = if (o.isNull("eta_confidence")) null else o.getDouble("eta_confidence"),
   ```
   `isNull` is true when the key is missing **or** the value is JSON null.
2. In `RouteStatusTest.kt`, delete the `@Ignore(...)` line above `a null eta_confidence does not crash`.
3. Prove it:
   ```bash
   local/04-build-android.sh && local/06-install-run.sh --no-logs
   local/drill.sh check 3
   ```
4. Put things back: `local/drill.sh flag eta default && local/drill.sh api-mode normal`.

## Done when
`local/drill.sh check 3` passes, and you can explain the stack trace line by line.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `crash` shows nothing | The crash buffer is empty, or the device was rebooted | Reproduce again, then run `crash` immediately |
| jdb `Unable to attach` | App not waiting for the debugger, or a stale forward | `adb shell am clear-debug-app`, then run `jdb` again |
| A release-build crash shows `a.b.c(Unknown Source)` | R8 obfuscation | Retrace with the mapping file from Level 08 (game drill 19) |

## Interview angle (STAR)
- **S:** In my RouteReady lab, a backend change started sending `eta_confidence: null`, and the Android app crashed when it opened a route.
- **T:** Stop the crash for installed users, find the cause, and fix it with a test so it can't come back.
- **A:** I pulled the crash buffer with `adb logcat -b crash` and followed the stack to `RouteStatus.parse`. I matched the request_id to the API log, and found that `has()` returns true for JSON null before `getDouble()` throws. I contained it on the server side, since the flag didn't gate parsing. I switched to `isNull()` and enabled the regression test.
- **R:** Unit tests pass, including the null case. The app shows the route without ETA confidence, and I documented that flags must gate the code that can fail.

**Next:** [Level 08](level-08.md)
