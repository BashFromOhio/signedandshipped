#!/usr/bin/env bash
# Pick an AVAILABLE simulator instead of hardcoding a name that a runner image may drop (drill 5).
# Prefers IOS_RUNTIME (e.g. "iOS-18") and DEVICE_PREFIX (default "iPhone") from docs/toolchain.md.
set -euo pipefail
runtime="${IOS_RUNTIME:-}"
prefix="${DEVICE_PREFIX:-iPhone}"
json=$(xcrun simctl list devices available --json)
udid=$(echo "$json" | jq -r --arg rt "$runtime" --arg p "$prefix" '
  .devices | to_entries
  | map(select(.key | test("SimRuntime.iOS")))
  | map(select($rt == "" or (.key | contains($rt))))
  | sort_by(.key) | reverse
  | map(.value[] | select(.name | startswith($p))) | .[0].udid // empty')
if [[ -z "$udid" ]]; then
  echo "No available simulator for runtime='$runtime' prefix='$prefix'. Available:" >&2
  xcrun simctl list devices available >&2
  exit 1
fi
echo "platform=iOS Simulator,id=$udid"
