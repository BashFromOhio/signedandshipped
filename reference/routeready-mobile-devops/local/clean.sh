#!/usr/bin/env bash
# Remove everything the labs installed. Your system was never touched, so this is all there is.
#   local/clean.sh          stop API + emulator, delete .tools (asks first)
#   local/clean.sh --all    also delete .secrets (your local upload key) and evidence/local
. "$(dirname "$0")/lib.sh"
say "This deletes $(du -sh "$RR_TOOLS" 2>/dev/null | awk '{print $1}') in .tools (JDK, Android SDK, emulator, Gradle/npm caches, Node)."
[ "${1:-}" = "--all" ] && say "--all: also deletes .secrets/ (local upload keystore) and evidence/local/."
printf 'Type "delete" to continue: '; read -r a; [ "$a" = delete ] || { say "Nothing deleted."; exit 0; }
"$RR_ROOT/local/03-run-api.sh" --stop >/dev/null 2>&1 || true
command -v adb >/dev/null 2>&1 && { adb emu kill >/dev/null 2>&1 || true; adb kill-server >/dev/null 2>&1 || true; }
rm -rf "$RR_TOOLS" "$RR_ROOT/.drills" "$RR_ROOT/stayready/mobile/node_modules" "$RR_ROOT/vendor/bundle" "$RR_ROOT/apps/android/.gradle" "$RR_ROOT/apps/android/app/build" "$RR_ROOT/apps/ios/RouteReady.xcodeproj"
[ "${1:-}" = "--all" ] && rm -rf "$RR_SECRETS" "$RR_ROOT/evidence/local"
ok "Clean. (adb may have left ~/.android/adbkey: delete it if you want zero trace.)"
