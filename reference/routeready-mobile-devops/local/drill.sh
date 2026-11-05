#!/usr/bin/env bash
# Level 12 · Break it on purpose, then fix it (Sprint 6-7, MOB-115/116). Real failures, real tools.
#   local/drill.sh list                 all drills
#   local/drill.sh start N              break something (backs up any file it changes)
#   local/drill.sh hint N               a nudge, not the answer
#   local/drill.sh check N              did you fix it?
#   local/drill.sh solution N           the answer + the interview story
#   local/drill.sh reset                undo every drill, API back to normal
#   local/drill.sh api-mode MODE        set the mock API mode directly (normal, stale, null-eta, breaking-v2, slow, flaky-503, tenant-header-bug, no-idempotency)
#   local/drill.sh flag eta on|off|default   override the ETA-confidence feature flag
. "$(dirname "$0")/lib.sh"
D="$RR_ROOT/.drills"; mkdir -p "$D/backup"
GP="$RR_ROOT/apps/android/gradle.properties"
NSC="$RR_ROOT/apps/android/app/src/debug/res/xml/network_security_config.xml"
MODELS="$RR_ROOT/apps/android/app/src/main/java/org/routeready/parent/Models.kt"
TEST="$RR_ROOT/apps/android/app/src/test/java/org/routeready/parent/RouteStatusTest.kt"

backup() { local rel="${1#$RR_ROOT/}"; [ -f "$D/backup/$rel" ] || { mkdir -p "$(dirname "$D/backup/$rel")"; cp "$1" "$D/backup/$rel"; }; }
api_mode() { echo "$1" > "$RR_TOOLS/api-mode"; ok "API mode → $1 (takes effect on the next request)"; }
cur_mode() { cat "$RR_TOOLS/api-mode" 2>/dev/null || echo normal; }
pass() { ok "PASS · drill $1 fixed"; date > "$RR_PROGRESS/drill-$1"; }
fail() { warn "Not yet: $*"; exit 1; }
manual() { printf '%s [y/N] ' "$1"; read -r a; case "$a" in y|Y) pass "$2";; *) fail "keep going: local/drill.sh hint $2";; esac; }

title() { case "$1" in
  1) echo "Emulator can't reach the API (localhost vs 10.0.2.2) · MOB-103 · ★★☆☆☆";;
  2) echo "Cleartext HTTP blocked by network security config · MOB-111 · ★★★☆☆";;
  3) echo "App crashes when ETA confidence is null · MOB-115 · ★★★☆☆";;
  4) echo "10-minute-old bus position shown as LIVE · drill 12 · ★★★★☆";;
  5) echo "INSTALL_FAILED_UPDATE_INCOMPATIBLE (debug vs upload key) · MOB-108 · ★★★☆☆";;
  6) echo "INSTALL_FAILED_VERSION_DOWNGRADE (build numbers) · MOB-107 · ★★☆☆☆";;
  7) echo "API rename breaks installed apps · MOB-106 · ★★★★☆";;
  8) echo "Gradle points at a JDK that isn't there · MOB-101 · ★★☆☆☆";;
  9) echo "StayReady: duplicate service requests on retry · drill 18 · ★★★★☆";;
  10) echo "StayReady: one tenant sees another tenant's data · drill 17 · ★★★★★";;
  11) echo "Flaky 503s from the API: does the app degrade gracefully? · MOB-114 · ★★★☆☆";;
  *) return 1;;
esac; }

start() { case "$1" in
  1) backup "$GP"; perl -pi -e 's#^routereadyApiBaseUrl=.*#routereadyApiBaseUrl=http://localhost:8080#' "$GP"
     say "Dana: \"Parents on the test build see 'Can't reach RouteReady'. The API is up. What changed?\""
     say "Rebuild + reinstall: local/04-build-android.sh && local/06-install-run.sh";;
  2) backup "$NSC"; perl -0pi -e 's#\s*<domain includeSubdomains="false">10\.0\.2\.2</domain>##' "$NSC"
     say "Dana: \"After a 'security cleanup' PR the debug app shows an error on every screen.\""
     say "Rebuild + reinstall, then: local/07-debug-apk.sh logs";;
  3) api_mode null-eta; printf '{"eta_confidence_enabled": true}\n' > "$RR_TOOLS/flag-overrides.json"
     say "PAGE: \"Crash rate jumped after the backend started sending eta_confidence: null for new routes.\""
     say "Open Route 1 in the app. Then: local/07-debug-apk.sh crash";;
  4) backup "$MODELS"; perl -pi -e 's/const val STALE_AFTER_SECONDS = 120L/const val STALE_AFTER_SECONDS = 120_000L/' "$MODELS"; api_mode stale
     say "Parent complaint: \"The app said LIVE but the bus was nowhere near.\" The server also has a bug (is_stale=false)."
     say "Rebuild + reinstall, open Route 1, compare 'updated … ago' with the badge.";;
  5) say "Needs Level 08 done. Steps:"
     say "  1) local/04-build-android.sh && adb install -r apps/android/app/build/outputs/apk/debug/app-debug.apk"
     say "  2) adb install -r apps/android/app/build/outputs/apk/release/app-release.apk"
     say "Read the exact error. Why does Android refuse? What would this mean for a real user?";;
  6) say "Needs Level 08. Steps:"
     say "  1) local/08-sign-release.sh  (note the versionCode, e.g. 102) and adb install the release APK"
     say "  2) Build an OLDER number: cd apps/android && ./gradlew assembleRelease -ProutereadyVersionCode=50 (with .secrets/upload.env loaded)"
     say "  3) adb install -r app/build/outputs/apk/release/app-release.apk  → read the error";;
  7) api_mode breaking-v2
     say "Backend PR: \"Renamed status → state and delay_minutes → delay_mins for consistency.\" It's deployed to staging."
     say "Open the app (it's the 'installed 1.5' client). Then run: local/03-run-api.sh --check";;
  8) backup "$GP"; printf '\norg.gradle.java.home=/opt/jdk-11-left-over-from-old-laptop\n' >> "$GP"
     say "CI and your laptop now fail before compiling anything. Run: local/04-build-android.sh";;
  9) api_mode no-idempotency
     say "Guests on hotel Wi-Fi tap 'Towels' once and housekeeping gets three tickets."
     say "Run StayReady (local/11-react-native.sh), then: local/drill.sh api-mode slow  and tap Towels (the app retries)."
     say "Or simulate the retry with curl (see docs/local/drills.md).";;
  10) api_mode tenant-header-bug
     say "Security report: \"Sending X-Tenant: harbor-house as a Cedar Cove guest shows Harbor House reservations.\""
     say "Reproduce: curl -H 'Authorization: Bearer cedar-cove-guest' -H 'X-Tenant: harbor-house' http://localhost:8080/stayready/v1/reservations";;
  11) api_mode flaky-503
     say "Every other API call fails with 503. Open the app, watch the screen and the logs (local/07-debug-apk.sh logs + .tools/api.log)."
     say "Questions: does it crash? does it tell the parent the truth? can you match an app log line to an API log line by request_id?";;
  *) die "no drill $1 (local/drill.sh list)";;
esac; echo "$1" >> "$D/active"; }

hint() { case "$1" in
  1) say "Inside the emulator, 'localhost' is the emulator itself. Look at apps/android/gradle.properties and what the start screen says under 'API:'.";;
  2) say "logcat says 'CLEARTEXT communication … not permitted'. Which XML file decides that for DEBUG builds?";;
  3) say "The stack trace ends in RouteStatus\$Companion.parse. What does JSONObject.has() return for a key whose value is null?";;
  4) say "Run the unit tests: ./gradlew -p apps/android testDebugUnitTest. One fails. Compare the constant's unit with its name.";;
  5) say "Android only lets an update install if it's signed by the SAME certificate as the installed app. Debug builds use ~/.android/debug.keystore (here: .tools/android-user-home).";;
  6) say "Android refuses to install a LOWER versionCode over a higher one. Where must build numbers come from?";;
  7) say "check_contract.py lists which installed versions break. Which side should change: the app, or the API?";;
  8) say "The error says the Java home is invalid. Gradle reads org.gradle.java.home from gradle.properties.";;
  9) say "Watch the POSTs in .tools/api.log. Does every retry send the same Idempotency-Key? Is the server honouring it?";;
  10) say "Where should the tenant come from: something the server verified (the token), or something the client says (a header)?";;
  11) say "Look for request_id in both logs. What does the parent see during a 503: an error, stale data, or a crash?";;
esac; }

check() { case "$1" in
  1) if grep -q '^routereadyApiBaseUrl=http://10.0.2.2:8080' "$GP" || adb reverse --list 2>/dev/null | grep -q 'tcp:8080'; then pass 1; else fail "the debug build still points at localhost and there's no 'adb reverse tcp:8080 tcp:8080'"; fi;;
  2) grep -q '10.0.2.2' "$NSC" && pass 2 || fail "debug network_security_config.xml doesn't allow 10.0.2.2";;
  3) grep -q 'isNull("eta_confidence")' "$MODELS" || fail "RouteStatus.parse still calls getDouble on a null"
     grep -B1 'a null eta_confidence does not crash' "$TEST" | grep -q '@Ignore' && fail "remove the @Ignore so the regression test runs"
     ( cd "$RR_ROOT/apps/android" && ./gradlew -q testDebugUnitTest ) && pass 3 || fail "unit tests fail";;
  4) grep -q 'STALE_AFTER_SECONDS = 120L' "$MODELS" || fail "the stale threshold is still wrong"
     ( cd "$RR_ROOT/apps/android" && ./gradlew -q testDebugUnitTest ) && pass 4 || fail "unit tests fail";;
  5) manual "Did you see INSTALL_FAILED_UPDATE_INCOMPATIBLE and can you explain why uninstalling isn't an option for real users?" 5;;
  6) manual "Did you see INSTALL_FAILED_VERSION_DOWNGRADE and can you explain why build numbers come from one allocator?" 6;;
  7) [ "$(cur_mode)" = normal ] || fail "the API is still in breaking-v2 mode (roll the backend back: local/drill.sh api-mode normal)"
     API=http://localhost:8080 python3 "$RR_ROOT/local/mock-api/check_contract.py" && pass 7 || fail "contract check fails";;
  8) grep -q 'org.gradle.java.home' "$GP" && fail "gradle.properties still sets org.gradle.java.home" || pass 8;;
  9) [ "$(cur_mode)" = normal ] && pass 9 || fail "server still ignores Idempotency-Key (mode $(cur_mode))";;
  10) [ "$(cur_mode)" = normal ] && pass 10 || fail "server still trusts X-Tenant (mode $(cur_mode))";;
  11) manual "Did the app stay up, show an honest message, and could you match request_ids across both logs?" 11;;
  *) die "no drill $1";;
esac; }

solution() { case "$1" in
  1) say "Fix: routereadyApiBaseUrl=http://10.0.2.2:8080 (or adb reverse tcp:8080 tcp:8080 and keep localhost). Prevent: the start screen prints the API URL; add a debug-only health check.";;
  2) say "Fix: restore the 10.0.2.2 <domain> in src/debug/res/xml/network_security_config.xml. Release stays HTTPS-only. Prevent: a UI test that loads one screen on the emulator in PR CI.";;
  3) say "Fix: etaConfidence = if (o.isNull(\"eta_confidence\")) null else o.getDouble(\"eta_confidence\")  (isNull is true for missing AND null). Remove @Ignore. Contain in prod: flag eta_confidence OFF (local/drill.sh flag eta off), then ship the fix; old installs stay crash-free because the flag gates the screen."
     say "STAR: S: crash spike after backend began sending null. T: stop crashes for installed users, then fix. A: logcat -b crash → parse() → JSON null; turned the flag off; fixed parsing; regression test. R: tests pass, crash gone in the lab, null case now covered.";;
  4) say "Fix: STALE_AFTER_SECONDS = 120L. The server bug (is_stale=false for old data) is why the client checks age itself. Prevent: the unit test that failed; never trust one side.";;
  5) say "Android verifies the signing certificate on update. Debug and upload keys differ, so the update is refused. Real users can't 'just uninstall' (data loss). Keep one key per app forever; Play App Signing protects the app signing key; a lost UPLOAD key is reset through Play Console.";;
  6) say "versionCode must only go up. Two jobs reusing or lowering numbers break uploads and installs. One concurrency-safe allocator per app (scripts/allocate-build-number.sh).";;
  7) say "Roll the backend back (api-mode normal), then ship the change additively: ADD state/delay_mins, KEEP status/delay_minutes until no supported client reads them. Run check_contract.py in PR CI.";;
  8) say "Delete org.gradle.java.home from gradle.properties. Machine-specific paths never go in committed files; CI and env.sh set JAVA_HOME.";;
  9) say "Server must store Idempotency-Key per tenant and return the first result on replay (mode normal). Client must reuse ONE key for all retries of one tap (src/api.ts withRetry + newIdempotencyKey).";;
  10) say "Tenant identity comes only from the verified token (server side). Never from a client header. Add a test: a Cedar Cove token with X-Tenant: harbor-house must still get Cedar Cove data.";;
  11) say "A 503 is a network-class failure: the app shows OFFLINE/'Can't reach RouteReady' and keeps the last known data marked STALE. Match logs by X-Request-Id. Contain server-side; clients retry with backoff.";;
esac; }

case "${1:-list}" in
  list) step "Drills (start with 1, 3, 7 - the interview favourites)"; for i in 1 2 3 4 5 6 7 8 9 10 11; do printf '  %2s  %s %s\n' "$i" "$( [ -f "$RR_PROGRESS/drill-$i" ] && echo "✓" || echo " ")" "$(title $i)"; done
        say ""; say "API mode now: $(cur_mode)";;
  start) [ -n "${2:-}" ] || die "usage: drill.sh start N"; step "Drill $2 · $(title "$2")"; start "$2"; dim "Stuck? local/drill.sh hint $2   Done? local/drill.sh check $2";;
  hint) hint "${2:?N}";;
  check) check "${2:?N}";;
  solution) step "Drill $2 · $(title "$2")"; solution "${2:?N}";;
  reset) step "Reset all drills"
         if [ -d "$D/backup" ]; then (cd "$D/backup" && find . -type f) | while read -r f; do cp "$D/backup/$f" "$RR_ROOT/${f#./}"; say "restored ${f#./}"; done; fi
         rm -rf "$D"; rm -f "$RR_TOOLS/flag-overrides.json"; api_mode normal; ok "Everything back to normal. Rebuild the app if you changed Android files.";;
  api-mode) [ -n "${2:-}" ] || die "modes: normal stale null-eta breaking-v2 slow flaky-503 tenant-header-bug no-idempotency"; api_mode "$2";;
  flag) case "${3:-}" in on) printf '{"eta_confidence_enabled": true}\n' > "$RR_TOOLS/flag-overrides.json";; off) printf '{"eta_confidence_enabled": false}\n' > "$RR_TOOLS/flag-overrides.json";; default) rm -f "$RR_TOOLS/flag-overrides.json";; *) die "usage: drill.sh flag eta on|off|default";; esac; ok "eta_confidence flag: ${3}";;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//';;
esac
