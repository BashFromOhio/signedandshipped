#!/usr/bin/env bash
# Print the toolchain actually in use so every CI log is evidence (drills 5, 6).
set -euo pipefail
case "${1:-all}" in
  ios)
    sw_vers; xcodebuild -version; xcode-select -p
    xcrun simctl list runtimes available
    ruby -v; bundle -v; bundle exec fastlane --version | tail -n 1 ;;
  android)
    java -version 2>&1; ./apps/android/gradlew -p apps/android --version
    ruby -v; bundle -v ;;
  *) "$0" ios || true; "$0" android || true ;;
esac
