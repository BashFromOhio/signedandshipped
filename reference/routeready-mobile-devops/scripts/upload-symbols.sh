#!/usr/bin/env bash
# Upload the EXACT symbols from the shipped build (drill 19). Never rebuild to get symbols.
# Upload token comes from a protected secret; the public DSN in the app is not a secret.
set -euo pipefail
platform=$1 release=$2 dist=$3
case "$platform" in
  ios) sentry-cli debug-files upload --include-sources build/ios/RouteReady.app.dSYM.zip ;;
  android) sentry-cli debug-files upload apps/android/app/build/outputs/mapping/release/mapping.txt ;;
  react-native) sentry-cli sourcemaps upload --release "$release" --dist "$dist" build/js ;;
esac
