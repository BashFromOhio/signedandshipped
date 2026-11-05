#!/usr/bin/env bash
# Level 06 · Install the debug APK, open the app, watch its logs (Sprint 1 exit test: the vertical slice).
. "$(dirname "$0")/lib.sh"
banner "Level 06" "Install, run and watch the app" "MOB-103" "Sprint 1" "★★☆☆☆"
PKG=org.routeready.parent
APK="$RR_ROOT/apps/android/app/build/outputs/apk/debug/app-debug.apk"
[ -f "$APK" ] || die "Build first: local/04-build-android.sh"
[ "$(adb devices | awk 'NR>1 && $2=="device"' | wc -l | tr -d ' ')" -ge 1 ] || die "No device. Start one: local/05-emulator.sh (or plug in a phone with USB debugging)"
curl -fsS http://localhost:8080/health >/dev/null 2>&1 || { warn "API not running; starting it in the background"; "$RR_ROOT/local/03-run-api.sh" --bg >/dev/null; }

step "Install"
adb install -r "$APK"
step "Launch"
adb shell am start -n "$PKG/.MainActivity"
sleep 2
pid="$(adb shell pidof "$PKG" | tr -d '\r')"
[ -n "$pid" ] || die "App didn't start. Look at: adb logcat -b crash -d"
ok "running as pid $pid. In the app: Sign in → Route 1. You should see LIVE and 'updated N s ago'."
done_level "level-06"
[ "${1:-}" = "--no-logs" ] && exit 0
step "App logs (Ctrl+C to stop). Each line has a request_id you can find in .tools/api.log"
adb logcat -v time --pid="$pid" RouteReady:V AndroidRuntime:E '*:S'
