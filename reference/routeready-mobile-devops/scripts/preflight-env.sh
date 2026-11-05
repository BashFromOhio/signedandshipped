#!/usr/bin/env bash
# Check the CANDIDATE's compiled public config matches the target environment (drill 17).
# Usage: preflight-env.sh <ios|android> <artifact> <production|staging>
set -euo pipefail
platform=$1 artifact=$2 target=$3
want=$(jq -r --arg t "$target" '.environments[$t].api_base_url' config/apps.json)
case "$platform" in
  ios) got=$(unzip -p "$artifact" 'Payload/*.app/Info.plist' | plutil -extract API_BASE_URL raw -o - -) ;;
  android) got=$(unzip -p "$artifact" base/assets/env.json | jq -r '.api_base_url') ;;
esac
[[ "$got" == "$want" ]] || { echo "candidate points at $got, $target expects $want" >&2; exit 1; }
echo "environment ok: $got"
