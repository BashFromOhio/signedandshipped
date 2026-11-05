#!/usr/bin/env bash
# Level 08 · Allocate a build number, sign a release AAB + APK with a LOCAL upload key, verify, write a manifest
# (MOB-107/108/109, Sprint 3). The keystore lives in .secrets/ (git-ignored). Never commit it.
. "$(dirname "$0")/lib.sh"
banner "Level 08" "Sign a release and prove what you built" "MOB-108" "Sprint 3" "★★★★☆"
[ -x "$RR_ROOT/apps/android/gradlew" ] || die "Run local/02-install-android-sdk.sh first."
mkdir -p "$RR_SECRETS" "$RR_ROOT/evidence/local"; chmod 700 "$RR_SECRETS"
KS="$RR_SECRETS/upload.keystore"; ENVF="$RR_SECRETS/upload.env"

if [ ! -f "$KS" ]; then
  step "Create a local UPLOAD key (Play would re-sign with its own app signing key)"
  pass="$(python3 -c 'import secrets; print(secrets.token_urlsafe(24))')"
  keytool -genkeypair -v -keystore "$KS" -storetype PKCS12 -alias upload -keyalg RSA -keysize 4096 -validity 9125 \
    -storepass "$pass" -keypass "$pass" -dname "CN=RouteReady Lab Upload, O=Fictional Lab, C=US" >/dev/null 2>&1
  printf 'ROUTEREADY_UPLOAD_KEYSTORE=%s\nROUTEREADY_UPLOAD_STORE_PASSWORD=%s\nROUTEREADY_UPLOAD_KEY_ALIAS=upload\nROUTEREADY_UPLOAD_KEY_PASSWORD=%s\n' "$KS" "$pass" "$pass" > "$ENVF"
  chmod 600 "$KS" "$ENVF"; ok "created .secrets/upload.keystore (password in .secrets/upload.env, chmod 600)"
fi
set -a; . "$ENVF"; set +a

step "Allocate the next build number (local stand-in for scripts/allocate-build-number.sh)"
NF="$RR_TOOLS/build-number"; n=$(( $(cat "$NF" 2>/dev/null || echo 100) + 1 )); echo "$n" > "$NF"
say "versionCode = $n   (never reuse one: stores reject duplicates - drill 4)"

step "Build signed release AAB (for the store) and APK (for sideloading)"
cd "$RR_ROOT/apps/android"
./gradlew bundleRelease assembleRelease -ProutereadyVersionCode="$n"
AAB=app/build/outputs/bundle/release/app-release.aab; APK=app/build/outputs/apk/release/app-release.apk
MAP=app/build/outputs/mapping/release/mapping.txt

step "Verify signatures"
apksigner verify --print-certs "$APK" | grep -E "Signer #1 certificate (DN|SHA-256)"
keytool -printcert -jarfile "$AAB" | grep -E "Owner|SHA256" | head -2
upload_fp="$(keytool -list -v -keystore "$KS" -storepass "$ROUTEREADY_UPLOAD_STORE_PASSWORD" -alias upload | grep -E 'SHA256:' | awk '{print $2}')"
say "upload key fingerprint: $upload_fp  (CI's scripts/verify-upload-cert.sh compares against this)"

step "Keep the R8 mapping file (without it, release crash reports are unreadable - MOB-114)"
mkdir -p "$RR_ROOT/evidence/local/mapping-$n"; cp "$MAP" "$RR_ROOT/evidence/local/mapping-$n/" && ok "evidence/local/mapping-$n/mapping.txt"

step "Write a release manifest (proof that what ships is what you tested - MOB-109)"
M="$RR_ROOT/evidence/local/manifest-android-$n.json"
python3 - "$M" "$n" "$(sha_of 256 "$AAB")" "$(sha_of 256 "$APK")" "$upload_fp" "$(git -C "$RR_ROOT" rev-parse --short HEAD 2>/dev/null || echo uncommitted)" <<'PY'
import json, sys, datetime
out, n, aab, apk, fp, sha = sys.argv[1:7]
json.dump({"application_id": "org.routeready.parent", "platform": "android", "marketing_version": "1.5.0",
           "build_number": int(n), "git_sha": sha, "workflow_run_id": "local",
           "artifacts": {"app-release.aab": aab, "app-release.apk": apk}, "upload_cert_sha256": fp,
           "mapping": f"evidence/local/mapping-{n}/mapping.txt", "store_state": "not_uploaded",
           "distribution_status": "packaged", "created_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")},
          open(out, "w"), indent=2)
PY
ok "${M#$RR_ROOT/}"
say ""
say "Try drill 5 now: local/drill.sh start 5  (install this release over the debug build)"
done_level "level-08"
