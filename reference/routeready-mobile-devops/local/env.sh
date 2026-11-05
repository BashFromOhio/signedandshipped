#!/usr/bin/env bash
# Source this to use the project-local toolchain in YOUR terminal (bash or zsh):
#     source local/env.sh
# It only changes this terminal session. Nothing is written to ~/.bashrc, ~/.zshrc or your system.
if [ -n "${BASH_SOURCE:-}" ]; then _rr_here="${BASH_SOURCE[0]}"; else _rr_here="$0"; fi   # zsh sets $0 to the sourced file
RR_ROOT="$(cd "$(dirname "$_rr_here")/.." && pwd)"
_rr_t="$RR_ROOT/.tools"

unset JAVA_HOME
if [ -d "$_rr_t/jdk/Contents/Home" ]; then export JAVA_HOME="$_rr_t/jdk/Contents/Home"
elif [ -d "$_rr_t/jdk/bin" ]; then export JAVA_HOME="$_rr_t/jdk"; fi
export ANDROID_HOME="$_rr_t/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export ANDROID_USER_HOME="$_rr_t/android-user-home"   # AVDs + emulator settings live here, not in ~/.android
export ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"
export GRADLE_USER_HOME="$_rr_t/gradle-home"          # Gradle caches live here, not in ~/.gradle
export npm_config_cache="$_rr_t/npm-cache"            # npm cache lives here, not in ~/.npm
export RR_ROOT

for _rr_d in "${JAVA_HOME:-/nonexistent}/bin" "$ANDROID_HOME/cmdline-tools/latest/bin" "$ANDROID_HOME/platform-tools" \
             "$ANDROID_HOME/emulator" "$ANDROID_HOME/build-tools/36.0.0" "$_rr_t/gradle/bin" "$_rr_t/node/bin" "$_rr_t/xcodegen/bin"; do
  if [ -d "$_rr_d" ]; then
    case ":$PATH:" in *":$_rr_d:"*) ;; *) PATH="$_rr_d:$PATH" ;; esac
  fi
done
export PATH
unset _rr_d _rr_here _rr_t

echo "RouteReady local toolchain loaded (only in this terminal)"
echo "  java: $(command -v java 2>/dev/null || echo 'not installed yet -> local/01-install-jdk.sh')"
echo "  adb:  $(command -v adb 2>/dev/null || echo 'not installed yet -> local/02-install-android-sdk.sh')"
