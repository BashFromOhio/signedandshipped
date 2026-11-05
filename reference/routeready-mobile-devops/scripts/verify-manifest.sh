#!/usr/bin/env bash
# Upload/promotion guard: the artifact must be exactly the one in the manifest.
set -euo pipefail
artifact=$1 manifest=$2
want=$(jq -r '.artifact_sha256' "$manifest")
have=$(shasum -a 256 "$artifact" | awk '{print $1}')
[[ "$want" == "$have" ]] || { echo "checksum mismatch: manifest $want, artifact $have" >&2; exit 1; }
echo "artifact matches manifest ($have)"
