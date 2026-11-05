#!/usr/bin/env bash
# Compare what the target asks for with what the provisioning profile grants (drill 1).
set -euo pipefail
settings=$(xcodebuild -showBuildSettings -project apps/ios/RouteReady.xcodeproj -scheme RouteReady -configuration Release 2>/dev/null)
bundle=$(echo "$settings" | awk -F' = ' '/ PRODUCT_BUNDLE_IDENTIFIER /{print $2; exit}')
ents=$(echo "$settings" | awk -F' = ' '/ CODE_SIGN_ENTITLEMENTS /{print $2; exit}')
profile=$(ls ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision | head -n 1)
decoded=$(security cms -D -i "$profile")
app_id=$(echo "$decoded" | plutil -extract Entitlements.application-identifier raw -o - -)
[[ "$app_id" == *".$bundle" ]] || { echo "profile app ID $app_id does not match bundle $bundle" >&2; exit 1; }
if [[ -n "$ents" && -f "apps/ios/$ents" ]]; then
  for k in $(plutil -convert json -o - "apps/ios/$ents" | jq -r 'keys[]'); do
    echo "$decoded" | plutil -extract "Entitlements.$k" raw -o - - >/dev/null 2>&1 \
      || { echo "entitlement $k is not in the provisioning profile" >&2; exit 1; }
  done
fi
echo "signing preflight ok: $bundle"
