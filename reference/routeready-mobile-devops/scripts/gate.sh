#!/usr/bin/env bash
# Aggregate required check (drill 9, Bug Hunt b10).
# "skipped" is fine (job didn't apply). "failure" or "cancelled" fails the gate.
set -euo pipefail
echo "$NEEDS_JSON" | jq -r 'to_entries[] | "\(.key)=\(.value.result)"'
if [[ "$(echo "$NEEDS_JSON" | jq -r '.changes.result')" != "success" ]]; then
  echo "change detection did not succeed" >&2; exit 1
fi
bad=$(echo "$NEEDS_JSON" | jq -r 'to_entries[] | select(.value.result=="failure" or .value.result=="cancelled") | .key')
if [[ -n "$bad" ]]; then echo "failed or cancelled: $bad" >&2; exit 1; fi
echo "ci-gate: all applicable jobs passed"
