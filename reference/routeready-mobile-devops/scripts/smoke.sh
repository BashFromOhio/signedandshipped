#!/usr/bin/env bash
# Staging smoke tests against the deployed digest.
set -euo pipefail
api=${1:?usage: smoke.sh <api-base-url>}
curl -fsS "$api/api/v1/capabilities" | jq -e '.contract == "v1"' >/dev/null
curl -fsS -H "Authorization: Bearer ${SMOKE_PARENT_TOKEN:?}" "$api/api/v1/routes" | jq -e 'length >= 1' >/dev/null
# Negative test: a parent cannot read a route they are not assigned to.
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $SMOKE_PARENT_TOKEN" "$api/api/v1/routes/r-unassigned/status")
[[ "$code" == 403 || "$code" == 404 ]] || { echo "cross-route read returned $code" >&2; exit 1; }
echo "smoke ok"
