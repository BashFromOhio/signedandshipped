#!/usr/bin/env bash
# Level 04 · Build + test the debug APK exactly like PR CI does (MOB-102/103, Sprint 1-2).
#   ./gradlew lintDebug testDebugUnitTest assembleDebug   (same tasks as `fastlane android verify`)
. "$(dirname "$0")/lib.sh"
banner "Level 04" "Build and test the debug APK" "MOB-103" "Sprint 1-2" "★★☆☆☆"
[ -x "$RR_ROOT/apps/android/gradlew" ] || die "No Gradle wrapper yet. Run local/02-install-android-sdk.sh"
cd "$RR_ROOT/apps/android"

step "Gradle and Java in use (evidence for your PR / CI log)"
./gradlew --version | grep -E '^Gradle|^JVM|^Kotlin' || true

step "Lint, unit tests, debug build"
start=$(date +%s)
./gradlew lintDebug testDebugUnitTest assembleDebug
ok "build finished in $(( $(date +%s) - start ))s"

APK="app/build/outputs/apk/debug/app-debug.apk"
[ -f "$APK" ] || die "APK not found at $APK"
step "What you built"
say "APK:     apps/android/$APK"
say "size:    $(du -h "$APK" | awk '{print $1}')"
say "sha256:  $(sha_of 256 "$APK")"
aapt2 dump badging "$APK" 2>/dev/null | grep -E "^package:|sdkVersion|targetSdkVersion|application-label:" || warn "aapt2 not on PATH (build-tools $RR_BUILD_TOOLS)"
say "reports: apps/android/app/build/reports/lint-results-debug.html  ·  app/build/reports/tests/testDebugUnitTest/index.html"
done_level "level-04"
