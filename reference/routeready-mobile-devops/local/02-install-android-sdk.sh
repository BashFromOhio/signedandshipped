#!/usr/bin/env bash
# Level 02 · Install the Android SDK + Gradle into .tools (MOB-101, Sprint 1).
# Installs: command-line tools, platform-tools (adb), Android 16 platform (API 36), build-tools,
# and Gradle (then generates the Gradle wrapper for apps/android). Accepts Android SDK licenses.
. "$(dirname "$0")/lib.sh"
banner "Level 02" "Install a project-only Android SDK and Gradle" "MOB-101" "Sprint 1" "★★☆☆☆"
need curl; need unzip; need python3
[ -x "${JAVA_HOME:-/nonexistent}/bin/java" ] || die "Run local/01-install-jdk.sh first (sdkmanager needs Java)."

OS="$(rr_os)"; case "$OS" in mac) G_OS=macosx;; *) G_OS=linux;; esac
DL="$RR_TOOLS/downloads"; mkdir -p "$DL"

if [ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  step "Find the latest Android command-line tools in Google's official repository index"
  curl -fsSL https://dl.google.com/android/repository/repository2-3.xml -o "$DL/repository2-3.xml" || die "Couldn't reach dl.google.com"
  read -r zip sha1 <<<"$(python3 "$RR_ROOT/local/tools/sdk_latest.py" "$DL/repository2-3.xml" "$G_OS")"
  say "latest: $zip"
  download "https://dl.google.com/android/repository/$zip" "$DL/$zip"
  verify_sha 1 "$DL/$zip" "$sha1"
  step "Unpack to .tools/android-sdk/cmdline-tools/latest"
  rm -rf "$DL/cmdline-unzip"; mkdir -p "$DL/cmdline-unzip" "$ANDROID_HOME/cmdline-tools"
  unzip -q "$DL/$zip" -d "$DL/cmdline-unzip"
  rm -rf "$ANDROID_HOME/cmdline-tools/latest"; mv "$DL/cmdline-unzip/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
else
  ok "command-line tools already installed"
fi
. "$RR_ROOT/local/env.sh" >/dev/null

step "Accept Android SDK licenses (read them at https://developer.android.com/studio/terms)"
yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses >/dev/null || true
ok "licenses accepted"

step "Install platform-tools (adb), platform $RR_ANDROID_PLATFORM, build-tools $RR_BUILD_TOOLS"
sdkmanager --sdk_root="$ANDROID_HOME" "platform-tools" "platforms;$RR_ANDROID_PLATFORM" "build-tools;$RR_BUILD_TOOLS"

if [ ! -x "$RR_TOOLS/gradle/bin/gradle" ]; then
  step "Install Gradle $RR_GRADLE_VERSION (checksum from services.gradle.org)"
  gz="gradle-$RR_GRADLE_VERSION-bin.zip"
  download "https://services.gradle.org/distributions/$gz" "$DL/$gz"
  gsum="$(curl -fsSL "https://services.gradle.org/distributions/$gz.sha256")"
  verify_sha 256 "$DL/$gz" "$gsum"
  rm -rf "$RR_TOOLS/gradle" "$DL/gradle-unzip"; mkdir -p "$DL/gradle-unzip"
  unzip -q "$DL/$gz" -d "$DL/gradle-unzip"; mv "$DL/gradle-unzip/gradle-$RR_GRADLE_VERSION" "$RR_TOOLS/gradle"
fi
. "$RR_ROOT/local/env.sh" >/dev/null

if [ ! -f "$RR_ROOT/apps/android/gradlew" ]; then
  step "Generate the Gradle wrapper for apps/android (commit gradlew + gradle/wrapper/* afterwards)"
  gsum="$(curl -fsSL "https://services.gradle.org/distributions/gradle-$RR_GRADLE_VERSION-bin.zip.sha256")"
  tmp="$(mktemp -d)"; ( cd "$tmp" && : > settings.gradle.kts && gradle -q wrapper --gradle-version "$RR_GRADLE_VERSION" --distribution-type bin --gradle-distribution-sha256-sum "$gsum" )
  mkdir -p "$RR_ROOT/apps/android/gradle/wrapper"
  cp "$tmp/gradlew" "$tmp/gradlew.bat" "$RR_ROOT/apps/android/"; cp "$tmp/gradle/wrapper/"* "$RR_ROOT/apps/android/gradle/wrapper/"
  rm -rf "$tmp"; ok "wrapper created with distributionSha256Sum pinned"
fi

step "Record the toolchain (paste into docs/toolchain.md)"
{
  echo "Recorded: $(date -u +%Y-%m-%dT%H:%M:%SZ) on $OS/$(rr_arch)"
  "$JAVA_HOME/bin/java" -version 2>&1 | head -1
  gradle --version 2>/dev/null | grep -E '^Gradle|^Kotlin|^JVM' || true
  sdkmanager --sdk_root="$ANDROID_HOME" --list_installed 2>/dev/null | grep -E 'platform|build-tools|cmdline' || true
  echo "AGP: $(grep -o 'com.android.application") version "[^"]*' "$RR_ROOT/apps/android/build.gradle.kts" | awk -F'"' '{print $3}')"
} | tee "$RR_TOOLS/toolchain.txt"
done_level "level-02"
