#!/usr/bin/env bash
# Block breaking API changes and replay previous-client fixtures (drill 11, Bug Hunt b9).
# Usage: contract-check.sh <base-ref>
set -euo pipefail
base=${1:-origin/main}
mkdir -p evidence
git show "$base:contracts/openapi.yaml" > /tmp/openapi-base.yaml
# oasdiff flags removed fields, type changes and new enum values in responses as breaking.
oasdiff breaking /tmp/openapi-base.yaml contracts/openapi.yaml --fail-on ERR | tee evidence/contract-check.txt
# Old-client fixtures are replayed by the API test suite against the candidate:
./services/api/gradlew -p services/api contractTest -PclientFixtures=contracts/fixtures | tee -a evidence/contract-check.txt
