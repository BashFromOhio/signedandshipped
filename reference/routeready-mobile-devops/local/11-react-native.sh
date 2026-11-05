#!/usr/bin/env bash
# Level 11 · Run StayReady (React Native + Expo) on the emulator/simulator (MOB-110/113 lab app, Sprint 6-7).
# Installs a private Node.js LTS into .tools/node (checksum-verified). npm's cache also stays in .tools.
#   local/11-react-native.sh             Expo dev server + open on Android emulator (installs Expo Go)
#   local/11-react-native.sh ios         same on the iOS Simulator (Mac)
#   local/11-react-native.sh dev-build   compile a real native debug build with Gradle (harder, slower)
. "$(dirname "$0")/lib.sh"
banner "Level 11" "React Native: run StayReady" "MOB-110" "Sprint 6-7" "★★★★☆"
OS="$(rr_os)"; ARCH="$(rr_arch)"
case "$OS" in mac) N_OS=darwin;; *) N_OS=linux;; esac
case "$ARCH" in x64) N_ARCH=x64;; aarch64) N_ARCH=arm64;; *) die "unsupported CPU $ARCH";; esac

if [ ! -x "$RR_TOOLS/node/bin/node" ]; then
  step "Install Node.js ($RR_NODE_LINE) into .tools/node"
  base="https://nodejs.org/dist/$RR_NODE_LINE"; mkdir -p "$RR_TOOLS/downloads"
  curl -fsSL "$base/SHASUMS256.txt" -o "$RR_TOOLS/downloads/node-SHASUMS256.txt" || die "Couldn't reach nodejs.org"
  line="$(grep -E "node-v[0-9.]+-$N_OS-$N_ARCH\.tar\.gz$" "$RR_TOOLS/downloads/node-SHASUMS256.txt" | head -1)"
  sum="${line%% *}"; file="${line##* }"; [ -n "$file" ] || die "No Node build for $N_OS-$N_ARCH"
  download "$base/$file" "$RR_TOOLS/downloads/$file"
  verify_sha 256 "$RR_TOOLS/downloads/$file" "$sum"
  rm -rf "$RR_TOOLS/node"; mkdir -p "$RR_TOOLS/node"; tar -xzf "$RR_TOOLS/downloads/$file" -C "$RR_TOOLS/node" --strip-components 1
fi
. "$RR_ROOT/local/env.sh" >/dev/null
say "node $(node -v)  npm $(npm -v)"

cd "$RR_ROOT/stayready/mobile"
step "Install exact dependency versions from package-lock.json"
npm ci --no-audit --no-fund
step "Type-check + unit test"
npm run -s typecheck && npm test --silent && ok "types and tests pass"
curl -fsS http://localhost:8080/health >/dev/null 2>&1 || "$RR_ROOT/local/03-run-api.sh" --bg >/dev/null

case "${1:-android}" in
  android)
    [ "$(adb devices 2>/dev/null | awk 'NR>1 && $2=="device"' | wc -l | tr -d ' ')" -ge 1 ] || die "Start the emulator first: local/05-emulator.sh"
    done_level "level-11"
    step "Expo dev server. Press 'a' to (re)open on Android, 'r' to reload, Ctrl+C to stop."
    exec npx expo start --android;;
  ios)
    [ "$OS" = mac ] || die "iOS needs a Mac"
    done_level "level-11"; exec npx expo start --ios;;
  dev-build)
    step "Generate native android/ project and build a debug APK with Gradle (uses .tools JDK + SDK)"
    done_level "level-11"; exec npx expo run:android;;
  *) die "usage: local/11-react-native.sh [android|ios|dev-build]";;
esac
