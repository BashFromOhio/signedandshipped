#!/usr/bin/env bash
# Append a distribution state change. States are separate on purpose (drill 15):
# packaged -> uploaded -> processing -> testers_available -> in_review -> approved
#          -> phased_release | staged_rollout -> released     (+ paused / halted)
set -euo pipefail
platform=$1 state=$2
allowed="packaged uploaded processing testers_available in_review approved phased_release staged_rollout paused halted released"
[[ " $allowed " == *" $state "* ]] || { echo "unknown state: $state" >&2; exit 1; }
root=$(git rev-parse --show-toplevel)
jq -nc --arg p "$platform" --arg s "$state" --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg run "${GITHUB_RUN_ID:-local}" \
  '{platform:$p, state:$s, at:$t, run:$run}' >> "$root/evidence/states.jsonl"
echo "state recorded: $platform $state"
