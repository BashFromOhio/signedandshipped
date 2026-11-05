#!/usr/bin/env bash
# Deploy an image BY DIGEST to staging. Replace the body with your platform (ECS, Cloud Run, k8s).
set -euo pipefail
image=${1:?usage: deploy-staging.sh <registry/name@sha256:...>}
[[ "$image" == *@sha256:* ]] || { echo "refusing to deploy a tag; pass a digest" >&2; exit 1; }
echo "deploying $image to staging"
# e.g. kubectl -n staging set image deploy/routeready-api api="$image" && kubectl -n staging rollout status deploy/routeready-api
