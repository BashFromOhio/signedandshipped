#!/usr/bin/env bash
# Block the wrong upload key BEFORE Play does (drill 3, Bug Hunt b4).
# Compares the AAB's signing certificate with the registered UPLOAD certificate (not the app signing cert).
set -euo pipefail
aab=$1
actual=$(keytool -printcert -jarfile "$aab" | awk '/SHA256:/{print $2; exit}')
expected=${EXPECTED_UPLOAD_CERT_SHA256:?set EXPECTED_UPLOAD_CERT_SHA256 from Play Console > App integrity > upload key}
if [[ "${actual^^}" != "${expected^^}" ]]; then
  echo "AAB is signed with SHA256 $actual but the registered upload certificate is $expected" >&2
  exit 1
fi
echo "upload certificate ok"
