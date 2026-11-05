#!/usr/bin/env bash
# Bounded polling: report the real state, never loop forever, never claim 'released' early.
# Usage: poll-store-state.sh <timeout-seconds> <command that prints the current state>
set -euo pipefail
timeout=$1; shift
deadline=$(( $(date +%s) + timeout ))
while :; do
  state=$("$@" || echo "unknown")
  echo "$(date -u +%H:%M:%SZ) state=$state"
  case "$state" in testers_available|approved|released) exit 0 ;; rejected|invalid) exit 1 ;; esac
  (( $(date +%s) < deadline )) || { echo "still $state after ${timeout}s; reporting pending, not failed" ; exit 0; }
  sleep 60
done
