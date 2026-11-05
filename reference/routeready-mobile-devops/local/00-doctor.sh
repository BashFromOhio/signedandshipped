#!/usr/bin/env bash
# Level 00 · Check your machine before installing anything (MOB-101, Sprint 1).
# Read-only: this script installs nothing. It tells you what's missing and how to get it.
. "$(dirname "$0")/lib.sh"
banner "Level 00" "Doctor: is this machine ready?" "MOB-101" "Sprint 1" "★☆☆☆☆"

OS="$(rr_os)"; ARCH="$(rr_arch)"; problems=0; report="$RR_TOOLS/doctor.txt"
: > "$report"
log() { printf '%s\n' "$*" >> "$report"; }
check() { # check NAME HOW-TO-INSTALL
  if command -v "$1" >/dev/null 2>&1; then ok "$1  ($(command -v "$1"))"; log "ok $1"
  else warn "$1 missing → $2"; log "missing $1"; problems=$((problems+1)); fi
}

step "System"
say "OS: $OS   CPU: $ARCH   bash: ${BASH_VERSION}"
log "os=$OS arch=$ARCH"
[ "$OS" = unknown ] && die "Unsupported OS. On Windows, install WSL (Ubuntu) and run this inside it. See docs/local/windows-wsl.md"

step "Basic tools (needed by every level)"
case "$OS" in
  mac) hint_pkg="xcode-select --install   (Apple's command line tools)";;
  *)   hint_pkg="sudo apt-get update && sudo apt-get install -y curl unzip git python3";;
esac
for t in curl unzip git python3 tar; do check "$t" "$hint_pkg"; done

step "Disk space (needs ~15 GB for the Android SDK + emulator image)"
free_kb="$(df -Pk "$RR_ROOT" | awk 'NR==2{print $4}')"
free_gb=$((free_kb / 1024 / 1024))
if [ "$free_gb" -ge 15 ]; then ok "${free_gb} GB free"; else warn "only ${free_gb} GB free in $RR_ROOT (15+ recommended)"; problems=$((problems+1)); fi
log "free_gb=$free_gb"

step "Emulator acceleration"
case "$OS" in
  mac) ok "macOS uses Apple's Hypervisor.framework automatically";;
  linux)
    if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then ok "/dev/kvm is usable (fast emulator)"
    elif [ -e /dev/kvm ]; then warn "/dev/kvm exists but you can't use it → sudo usermod -aG kvm \$USER, then log out and back in"; problems=$((problems+1))
    else warn "no /dev/kvm → enable virtualization (VT-x/AMD-V) in BIOS. Without it the emulator is unusably slow; use a real phone instead (docs/local/level-05.md)"; fi;;
  wsl) warn "WSL: the Android emulator usually can't run inside WSL. Build in WSL, run the emulator on Windows (docs/local/windows-wsl.md)";;
esac

step "Optional, per level"
[ "$OS" = mac ] && { if xcode-select -p >/dev/null 2>&1 && command -v xcodebuild >/dev/null 2>&1 && xcodebuild -version >/dev/null 2>&1; then ok "Xcode: $(xcodebuild -version | head -1) (Level 10)"; else warn "Xcode not installed (only needed for Level 10, iOS). Install from the Mac App Store."; fi; }
command -v ruby >/dev/null 2>&1 && ok "ruby $(ruby -e 'print RUBY_VERSION') (Level 09 fastlane)" || dim "ruby not found (only needed for Level 09)"
command -v java >/dev/null 2>&1 && dim "note: a system Java exists ($(command -v java)). The labs ignore it and use .tools/jdk on purpose."

step "Result"
if [ "$problems" -eq 0 ]; then ok "Ready. Report saved to .tools/doctor.txt"; done_level "level-00"
else warn "$problems thing(s) to fix above. Fix them, then run this again."; exit 1; fi
