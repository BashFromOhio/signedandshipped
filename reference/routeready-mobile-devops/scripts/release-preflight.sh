#!/usr/bin/env bash
# Release preflight (lane contract). Fails fast before anything is signed or uploaded.
# Usage: release-preflight.sh <package|promote> <ios|android> <build_number>
set -euo pipefail
stage=$1 platform=$2 number=$3
root=$(git rev-parse --show-toplevel)
fail() { echo "PREFLIGHT FAIL: $*" >&2; exit 1; }

# 1. Trusted commit: on main, and the SHA is on origin/main
[[ "${GITHUB_REF:-refs/heads/main}" == "refs/heads/main" ]] || fail "releases only run from main (got $GITHUB_REF)"
git fetch --quiet origin main
git merge-base --is-ancestor HEAD origin/main || fail "HEAD is not on origin/main"

# 2. Exact application identity from config/apps.json
expected=$(jq -r --arg p "$platform" '.[$p].application_id' "$root/config/apps.json")
[[ -n "$expected" && "$expected" != "null" ]] || fail "no application_id for $platform in config/apps.json"

# 3. Build number shape
[[ "$number" =~ ^[0-9]+$ ]] || fail "build number must be an integer"
if [[ "$platform" == android && "$number" -gt 2100000000 ]]; then fail "versionCode above Play's limit"; fi

# 4. Required configuration present (names only — never print values)
case "$platform/$stage" in
  ios/package)     req=(MATCH_GIT_URL MATCH_PASSWORD) ;;
  android/package) req=(ROUTEREADY_UPLOAD_KEYSTORE ROUTEREADY_UPLOAD_STORE_PASSWORD ROUTEREADY_UPLOAD_KEY_ALIAS EXPECTED_UPLOAD_CERT_SHA256) ;;
  ios/promote)     req=(ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_P8_BASE64) ;;
  android/promote) req=(PLAY_JSON_KEY) ;;
esac
for v in "${req[@]}"; do [[ -n "${!v:-}" ]] || fail "missing required setting: $v"; done

# 5. Promotion needs compatibility evidence for the candidate
if [[ "$stage" == promote ]]; then
  [[ -f "$root/evidence/contract-check.txt" ]] || fail "no contract compatibility evidence (scripts/contract-check.sh)"
fi
echo "preflight ok: $stage $platform $expected #$number"
