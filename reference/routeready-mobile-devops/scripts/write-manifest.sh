#!/usr/bin/env bash
# Write evidence/release-manifest.json (schema: evidence/release-manifest.schema.json).
# Never write tokens, passwords, keys or personal data here (Bug Hunt b12).
set -euo pipefail
platform=$1 artifact=$2 number=$3
root=$(git rev-parse --show-toplevel)
mkdir -p "$root/evidence"
sha256=$(shasum -a 256 "$artifact" | awk '{print $1}')
jq -n \
  --arg app "$(jq -r --arg p "$platform" '.[$p].application_id' "$root/config/apps.json")" \
  --arg platform "$platform" \
  --arg version "$(jq -r '.marketing_version' "$root/config/apps.json")" \
  --argjson build "$number" \
  --arg sha "$(git rev-parse HEAD)" \
  --arg run "${GITHUB_RUN_ID:-local}" \
  --arg artifact "$(basename "$artifact")" \
  --arg artifact_sha256 "$sha256" \
  --arg contract "$(git log -1 --format=%h -- contracts/openapi.yaml)" \
  --arg image "${BACKEND_IMAGE_DIGEST:-unknown}" \
  --slurpfile flags "$root/config/feature-flags.json" \
  '{application_id:$app, platform:$platform, marketing_version:$version, build_number:$build,
    git_sha:$sha, workflow_run_id:$run, artifact:$artifact, artifact_sha256:$artifact_sha256,
    backend_image_digest:$image, api_contract_revision:$contract,
    feature_flag_defaults:$flags[0].defaults, tested_client_versions:[],
    approvals:[], store_state:"not_uploaded", distribution_status:"packaged"}' \
  > "$root/evidence/release-manifest.json"
echo "manifest written: $platform #$number sha256=$sha256"
