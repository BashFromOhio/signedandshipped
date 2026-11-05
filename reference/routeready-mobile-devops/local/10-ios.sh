#!/usr/bin/env bash
# Level 10 · Build, test and run the SwiftUI app on the iOS Simulator (Mac only, Sprint 1-2).
# No Apple Developer account needed: simulator builds aren't signed for distribution.
. "$(dirname "$0")/lib.sh"
banner "Level 10" "iOS: generate, test and run on the Simulator" "MOB-103" "Sprint 1-2" "★★★★☆"
[ "$(rr_os)" = mac ] || die "iOS builds need macOS + Xcode. On Linux/Windows: mark this BLOCKED in docs/progress.md, or let a GitHub macOS runner do it (Level 09 / pr-ci.yml)."
xcodebuild -version >/dev/null 2>&1 || die "Xcode not installed or not selected. Install from the App Store, then: sudo xcode-select -s /Applications/Xcode.app"

if [ ! -x "$RR_TOOLS/xcodegen/bin/xcodegen" ]; then
  step "Install XcodeGen into .tools/xcodegen (turns apps/ios/project.yml into an .xcodeproj)"
  mkdir -p "$RR_TOOLS/downloads"
  download "https://github.com/yonaskolb/XcodeGen/releases/latest/download/xcodegen.zip" "$RR_TOOLS/downloads/xcodegen.zip"
  rm -rf "$RR_TOOLS/xcodegen"; unzip -q "$RR_TOOLS/downloads/xcodegen.zip" -d "$RR_TOOLS"
fi
. "$RR_ROOT/local/env.sh" >/dev/null

step "Generate RouteReady.xcodeproj"
( cd "$RR_ROOT/apps/ios" && xcodegen generate --spec project.yml )

step "Pick an available iPhone simulator"
UDID="$(xcrun simctl list devices available | grep -E '^\s+iPhone' | head -1 | grep -oE '[0-9A-F-]{36}')"
[ -n "$UDID" ] || die "No iPhone simulator. Xcode → Settings → Components → install an iOS runtime."
say "simulator: $(xcrun simctl list devices available | grep "$UDID" | sed 's/^ *//')"
DD="$RR_TOOLS/DerivedData"

step "Unit tests (same as fastlane ios verify)"
xcodebuild test -project "$RR_ROOT/apps/ios/RouteReady.xcodeproj" -scheme RouteReady \
  -destination "id=$UDID" -derivedDataPath "$DD" CODE_SIGNING_ALLOWED=NO | tail -25

step "Build, install and launch on the simulator"
xcodebuild build -project "$RR_ROOT/apps/ios/RouteReady.xcodeproj" -scheme RouteReady -configuration Debug \
  -destination "id=$UDID" -derivedDataPath "$DD" CODE_SIGNING_ALLOWED=NO | tail -3
APP="$DD/Build/Products/Debug-iphonesimulator/RouteReady.app"
curl -fsS http://localhost:8080/health >/dev/null 2>&1 || "$RR_ROOT/local/03-run-api.sh" --bg >/dev/null
xcrun simctl boot "$UDID" 2>/dev/null || true
open -a Simulator
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" org.routeready.parent
ok "Running. Sign in → Route 1. The simulator shares your Mac's localhost, so no 10.0.2.2 here."
say "Live logs:  xcrun simctl spawn $UDID log stream --predicate 'subsystem == \"org.routeready.parent\"'"
done_level "level-10"
