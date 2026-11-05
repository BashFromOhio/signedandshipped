#!/usr/bin/env bash
# Where am I? Shows installed tools, what's running, and which levels/drills are done.
. "$(dirname "$0")/lib.sh"
step "Levels"
for l in 00 01 02 03 04 05 06 07 08 09 10 11; do
  f="$RR_PROGRESS/level-$l"; printf '  %s level %s  %s\n' "$( [ -f "$f" ] && echo "✓" || echo "·")" "$l" "$( [ -f "$f" ] && cat "$f" || echo "")"
done
n=0; for f in "$RR_PROGRESS"/drill-*; do [ -e "$f" ] && n=$((n+1)); done; printf '  drills fixed: %s/11\n' "$n"
step "Toolchain (.tools)"
[ -x "${JAVA_HOME:-/x}/bin/java" ] && say "  java     $("$JAVA_HOME/bin/java" -version 2>&1 | head -1)" || say "  java     not installed"
command -v sdkmanager >/dev/null && say "  sdk      $ANDROID_HOME" || say "  sdk      not installed"
command -v gradle >/dev/null && say "  gradle   $(gradle --version 2>/dev/null | grep '^Gradle')" || say "  gradle   not installed"
[ -x "$RR_TOOLS/node/bin/node" ] && say "  node     $("$RR_TOOLS/node/bin/node" -v)" || say "  node     not installed (Level 11)"
say "  disk     $(du -sh "$RR_TOOLS" 2>/dev/null | awk '{print $1}') in .tools"
step "Running"
curl -fsS http://localhost:8080/health >/dev/null 2>&1 && say "  API      up on :8080 (mode $(cat "$RR_TOOLS/api-mode" 2>/dev/null || echo normal))" || say "  API      down (local/03-run-api.sh --bg)"
command -v adb >/dev/null && say "  devices  $(adb devices | awk 'NR>1 && NF' | tr '\n' ' ')" || true
[ -f "$RR_ROOT/.drills/active" ] && say "  drills in progress: $(sort -u "$RR_ROOT/.drills/active" | tr '\n' ' ')(local/drill.sh reset to undo)"
