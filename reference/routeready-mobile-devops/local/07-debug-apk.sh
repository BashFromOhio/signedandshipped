#!/usr/bin/env bash
# Level 07 · Debug the APK like an on-call engineer (MOB-114/115, Sprint 6-7).
#   local/07-debug-apk.sh inspect   what's inside the APK: manifest, permissions, signer, dex
#   local/07-debug-apk.sh logs      live logs for the app only
#   local/07-debug-apk.sh crash     the last crash (stack trace) from the crash buffer
#   local/07-debug-apk.sh state     version installed on the device, current screen
#   local/07-debug-apk.sh shot      save a screenshot to evidence/local/
#   local/07-debug-apk.sh jdb       pause the app at launch and attach the Java debugger
#   local/07-debug-apk.sh net       show how the emulator reaches your computer (10.0.2.2 vs adb reverse)
. "$(dirname "$0")/lib.sh"
banner "Level 07" "Debug the APK" "MOB-115" "Sprint 6-7" "★★★★☆"
PKG=org.routeready.parent
APK="${APK:-$RR_ROOT/apps/android/app/build/outputs/apk/debug/app-debug.apk}"
has_device() { [ "$(adb devices | awk 'NR>1 && $2=="device"' | wc -l | tr -d ' ')" -ge 1 ] || die "No device: local/05-emulator.sh"; }

case "${1:-help}" in
  inspect)
    [ -f "$APK" ] || die "No APK at $APK (build: local/04-build-android.sh)"
    step "Package, versions, SDK levels"; aapt2 dump badging "$APK" | grep -E "^package:|sdkVersion|targetSdk|uses-permission|launchable"
    step "Merged manifest (what Android actually reads)"; apkanalyzer manifest print "$APK" | head -40
    step "Who signed it (debug builds use a debug key: never upload that)"; apksigner verify --print-certs "$APK" | grep -E "Signer|DN|SHA-256"
    step "Code inside (dex packages from our app)"; apkanalyzer dex packages "$APK" 2>/dev/null | grep -E "org\.routeready" | head -15 || true
    step "Biggest files"; apkanalyzer files list "$APK" | head -20
    say "sha256: $(sha_of 256 "$APK")";;
  logs)
    has_device; pid="$(adb shell pidof "$PKG" | tr -d '\r')"; [ -n "$pid" ] || die "App not running. Open it, or: local/06-install-run.sh --no-logs"
    adb logcat -v time --pid="$pid" RouteReady:V AndroidRuntime:E System.err:W '*:S';;
  crash)
    has_device; step "Last crash on the device (newest at the bottom)"
    adb logcat -b crash -d | tail -60
    say ""; say "Read it bottom-up to the first 'at org.routeready.parent...' line: that's YOUR code and the line number.";;
  state)
    has_device; step "Installed version"; adb shell dumpsys package "$PKG" | grep -E "versionCode|versionName|firstInstallTime|lastUpdateTime" | head -4
    step "Signing certificate on device"; adb shell dumpsys package "$PKG" | grep -A1 -i "signatures" | head -4 || true
    step "Screen in front"; adb shell dumpsys activity activities | grep -E "topResumedActivity|mResumedActivity" | head -2;;
  shot)
    has_device; mkdir -p "$RR_ROOT/evidence/local"; f="$RR_ROOT/evidence/local/screen-$(date +%Y%m%d-%H%M%S).png"
    adb exec-out screencap -p > "$f"; ok "saved ${f#$RR_ROOT/}";;
  jdb)
    has_device; [ -f "$APK" ] || die "Build first"
    step "Tell Android to wait for a debugger when the app starts"
    adb shell am set-debug-app -w "$PKG"
    adb shell am start -n "$PKG/.MainActivity" >/dev/null
    sleep 2; pid="$(adb shell pidof "$PKG" | tr -d '\r')"; [ -n "$pid" ] || die "App didn't start"
    adb forward tcp:8700 "jdwp:$pid" >/dev/null
    say "Attached on localhost:8700 (app pid $pid). Useful jdb commands:"
    say "  stop in org.routeready.parent.RouteStatus\$Companion.parse   then: cont, where, locals, next, cont"
    say "  catch java.lang.Exception                                     (break when anything throws)"
    say "  quit   (then run: adb shell am clear-debug-app)"
    jdb -attach localhost:8700 || true
    adb shell am clear-debug-app; adb forward --remove tcp:8700 2>/dev/null || true;;
  net)
    say "The emulator is its own computer. 'localhost' inside it means the EMULATOR, not your machine."
    say "  Option A (default here): use 10.0.2.2 — the emulator's alias for your computer."
    say "  Option B: adb reverse tcp:8080 tcp:8080 — then the app can use http://localhost:8080"
    say "Debug builds allow plain HTTP only to those hosts (apps/android/app/src/debug/res/xml/network_security_config.xml)."
    has_device; step "Current reverse rules"; adb reverse --list || true;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
esac
[ "${1:-}" = inspect ] || [ "${1:-}" = crash ] && done_level "level-07" || true
