#!/usr/bin/env bash
# Level 05 · Create and boot an Android emulator inside .tools (Sprint 1 vertical slice).
#   local/05-emulator.sh            create (first time) and start with a window
#   local/05-emulator.sh --headless start without a window (CI style)
#   local/05-emulator.sh --stop     shut it down
. "$(dirname "$0")/lib.sh"
banner "Level 05" "Create and boot an emulator" "MOB-103" "Sprint 1" "★★★☆☆"
command -v sdkmanager >/dev/null || die "Run local/02-install-android-sdk.sh first."
OS="$(rr_os)"; ARCH="$(rr_arch)"

if [ "${1:-}" = "--stop" ]; then adb emu kill 2>/dev/null && ok "emulator stopping" || say "no emulator running"; exit 0; fi
if [ "$OS" = wsl ] && [ "${1:-}" != "--force" ]; then
  warn "The emulator normally can't run inside WSL. Use the Windows-side emulator or a real phone: docs/local/windows-wsl.md"
  exit 1
fi
if [ "$OS" = linux ] && [ ! -w /dev/kvm ]; then warn "/dev/kvm not usable: the emulator will be extremely slow or refuse to start (see Level 00)."; fi

case "$ARCH" in aarch64) ABI=arm64-v8a;; *) ABI=x86_64;; esac
IMG="system-images;$RR_ANDROID_PLATFORM;google_apis;$ABI"

step "Install emulator + system image ($IMG, ~1.5 GB the first time)"
sdkmanager --sdk_root="$ANDROID_HOME" "emulator" "$IMG"
. "$RR_ROOT/local/env.sh" >/dev/null

if ! avdmanager list avd -c 2>/dev/null | grep -qx "$RR_AVD_NAME"; then
  step "Create virtual device '$RR_AVD_NAME' (stored in .tools/android-user-home/avd)"
  echo no | avdmanager create avd -n "$RR_AVD_NAME" -k "$IMG" -d pixel_7 --force
fi

step "Boot it"
flags="-no-snapshot-save -netdelay none -netspeed full"
[ "${1:-}" = "--headless" ] && flags="$flags -no-window -no-audio -no-boot-anim"
# shellcheck disable=SC2086
nohup emulator -avd "$RR_AVD_NAME" $flags > "$RR_TOOLS/emulator.log" 2>&1 &
say "emulator pid $! (log: .tools/emulator.log). Waiting for Android to finish booting…"
adb wait-for-device
for i in $(seq 1 120); do
  [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break
  sleep 3; [ "$i" -eq 120 ] && die "Emulator didn't finish booting in 6 minutes. See .tools/emulator.log"
done
adb shell input keyevent 82 >/dev/null 2>&1 || true   # unlock screen
ok "booted: $(adb devices | awk 'NR>1 && $2=="device"{print $1}' | head -1)  Android $(adb shell getprop ro.build.version.release | tr -d '\r')"
done_level "level-05"
