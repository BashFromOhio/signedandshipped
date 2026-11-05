#!/usr/bin/env bash
# Level 01 · Install a private Java 17 (Temurin) into .tools/jdk (MOB-101, Sprint 1).
# Gradle and the Android build need a JDK. AGP 8.x requires JDK 17+. We pin 17 so every machine matches CI.
. "$(dirname "$0")/lib.sh"
banner "Level 01" "Install a project-only JDK" "MOB-101" "Sprint 1" "★☆☆☆☆"
need curl; need tar; need python3

OS="$(rr_os)"; ARCH="$(rr_arch)"
case "$OS" in mac) A_OS=mac;; linux|wsl) A_OS=linux;; *) die "unsupported OS";; esac

if [ -x "${JAVA_HOME:-/nonexistent}/bin/java" ] && [ "${1:-}" != "--force" ]; then
  ok "JDK already installed: $("$JAVA_HOME/bin/java" -version 2>&1 | head -1)"
  dim "Reinstall with: local/01-install-jdk.sh --force"
  done_level "level-01"; exit 0
fi

step "Ask Adoptium (Eclipse Temurin) for the latest JDK $RR_JDK_MAJOR build for $A_OS/$ARCH"
api="https://api.adoptium.net/v3/assets/latest/$RR_JDK_MAJOR/hotspot?architecture=$ARCH&image_type=jdk&os=$A_OS&vendor=eclipse"
meta="$RR_TOOLS/downloads/jdk.json"; mkdir -p "$RR_TOOLS/downloads"
curl -fsSL "$api" -o "$meta" || die "Couldn't reach api.adoptium.net"
read -r url sum name <<<"$(python3 -c 'import json,sys; a=json.load(open(sys.argv[1]))[0]; p=a["binary"]["package"]; print(p["link"], p["checksum"], a["release_name"])' "$meta")"
say "release: $name"

step "Download + verify checksum"
file="$RR_TOOLS/downloads/$(basename "$url")"
download "$url" "$file"
verify_sha 256 "$file" "$sum"

step "Unpack into .tools/jdk"
rm -rf "$RR_TOOLS/jdk" "$RR_TOOLS/jdk.tmp"; mkdir -p "$RR_TOOLS/jdk.tmp"
tar -xzf "$file" -C "$RR_TOOLS/jdk.tmp"
mv "$RR_TOOLS/jdk.tmp/"*/ "$RR_TOOLS/jdk"; rm -rf "$RR_TOOLS/jdk.tmp"

. "$RR_ROOT/local/env.sh" >/dev/null
step "Check it"
"$JAVA_HOME/bin/java" -version
"$JAVA_HOME/bin/java" -version 2>&1 | grep -q "\"$RR_JDK_MAJOR\." || die "Expected Java $RR_JDK_MAJOR"
ok "JAVA_HOME=$JAVA_HOME"
dim "Your system Java (if any) is untouched. Run 'source local/env.sh' to use this one in your terminal."
done_level "level-01"
