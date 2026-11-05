#!/usr/bin/env bash
# Durable, concurrency-safe build-number allocator (drill 4, Bug Hunt b5).
# Store: allocations.json on a dedicated branch; git push is the compare-and-swap.
# Usage: allocate-build-number.sh <ios|android> <application_id> <git_sha>
# Optional: STORE_LATEST = highest number the store already has (latest_testflight_build_number,
#           google_play_track_version_codes). The allocator never goes below it.
set -euo pipefail
platform=$1 app=$2 sha=$3
branch=${ALLOCATOR_BRANCH:-build-numbers}
key="$app/$platform"
run="${GITHUB_RUN_ID:-local}"          # a re-run of the same workflow run reuses its number
remote=$(git config --get remote.origin.url)
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT

for attempt in 1 2 3 4 5; do
  rm -rf "$work/s"
  if ! git clone --quiet --depth 1 --branch "$branch" "$remote" "$work/s" 2>/dev/null; then
    echo "allocator branch '$branch' not found; create it with allocations.json containing {}" >&2; exit 2
  fi
  f="$work/s/allocations.json"
  existing=$(jq -r --arg k "$key" --arg r "$sha@$run" '.[$k].byRun[$r] // empty' "$f")
  if [[ -n "$existing" ]]; then echo "$existing"; exit 0; fi
  last=$(jq -r --arg k "$key" '.[$k].last // 0' "$f")
  floor=${STORE_LATEST:-0}
  next=$(( (last > floor ? last : floor) + 1 ))
  jq --arg k "$key" --arg r "$sha@$run" --argjson n "$next" \
     '.[$k].last = $n | .[$k].byRun[$r] = $n' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  if (cd "$work/s" && git add allocations.json \
      && git -c user.name=allocator -c user.email=allocator@users.noreply.github.com commit -qm "allocate $key=$next for $sha" \
      && git push --quiet origin "$branch"); then
    echo "$next"; exit 0
  fi
  echo "allocation race, retrying ($attempt)" >&2
  sleep $(( attempt * 2 ))
done
echo "could not allocate a build number after 5 attempts" >&2
exit 1
