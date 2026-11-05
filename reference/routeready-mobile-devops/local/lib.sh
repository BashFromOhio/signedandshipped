#!/usr/bin/env bash
# Shared helpers for local/*.sh. Works on macOS's old bash 3.2 and on Linux/WSL.
# Everything installs under the repo's .tools/ folder. Delete that folder and it's all gone.
set -euo pipefail

RR_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RR_TOOLS="$RR_ROOT/.tools"
RR_SECRETS="$RR_ROOT/.secrets"
RR_PROGRESS="$RR_TOOLS/progress"
mkdir -p "$RR_TOOLS" "$RR_PROGRESS"

# Pinned versions (record them in docs/toolchain.md - MOB-101)
RR_JDK_MAJOR=17
RR_GRADLE_VERSION=8.14.3
RR_ANDROID_PLATFORM="android-36"
RR_BUILD_TOOLS="36.0.0"
RR_NODE_LINE="latest-v24.x"
RR_AVD_NAME="routeready_api36"

if [ -t 1 ]; then B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; D=$'\033[2m'; N=$'\033[0m'; else B=""; G=""; Y=""; R=""; D=""; N=""; fi
say()  { printf '%s\n' "$*"; }
step() { printf '\n%s▶ %s%s\n' "$B" "$*" "$N"; }
ok()   { printf '%s✓ %s%s\n' "$G" "$*" "$N"; }
warn() { printf '%s! %s%s\n' "$Y" "$*" "$N" >&2; }
die()  { printf '%s✗ %s%s\n' "$R" "$*" "$N" >&2; exit 1; }
dim()  { printf '%s%s%s\n' "$D" "$*" "$N"; }

banner() { # banner "Level 04" "Build and test the debug APK" "MOB-103" "Sprint 1-2" "★★☆☆☆"
  printf '\n%s%s · %s%s\n%sTicket %s · %s · difficulty %s%s\n' "$B" "$1" "$2" "$N" "$D" "$3" "$4" "$5" "$N"
  printf '%sGuide: docs/local/%s.md%s\n' "$D" "$(echo "$1" | tr 'A-Z ' 'a-z-')" "$N"
}
done_level() { date > "$RR_PROGRESS/$1"; ok "$1 complete. Next: see docs/local/README.md"; }

rr_os() {
  case "$(uname -s)" in
    Darwin) echo mac ;;
    Linux) if grep -qi microsoft /proc/version 2>/dev/null; then echo wsl; else echo linux; fi ;;
    *) echo unknown ;;
  esac
}
rr_arch() { case "$(uname -m)" in x86_64|amd64) echo x64 ;; arm64|aarch64) echo aarch64 ;; *) uname -m ;; esac; }

need() { command -v "$1" >/dev/null 2>&1 || die "Missing '$1'. Run local/00-doctor.sh to see how to install it."; }

download() { # download URL OUTFILE
  local url="$1" out="$2"
  [ -s "$out" ] && { dim "already downloaded: $(basename "$out")"; return 0; }
  say "downloading $(basename "$out")"
  dim "  from $url"
  curl -fL --retry 3 --progress-bar -o "$out.part" "$url" || die "Download failed: $url (check your internet, proxy or firewall)"
  mv "$out.part" "$out"
}

sha_of() { # sha_of 256|1 FILE
  if command -v shasum >/dev/null 2>&1; then shasum -a "$1" "$2" | awk '{print $1}'
  else "sha$1sum" "$2" | awk '{print $1}'; fi
}
verify_sha() { # verify_sha 256|1 FILE EXPECTED
  local got; got="$(sha_of "$1" "$2")"
  if [ "$got" != "$3" ]; then rm -f "$2"; die "Checksum mismatch for $(basename "$2"): expected $3, got $got. Deleted it; run again."; fi
  ok "checksum verified (sha$1) $(basename "$2")"
}

# Load the isolated environment (JAVA_HOME, ANDROID_HOME, PATH...) for this script.
# shellcheck source=env.sh
. "$RR_ROOT/local/env.sh" >/dev/null
