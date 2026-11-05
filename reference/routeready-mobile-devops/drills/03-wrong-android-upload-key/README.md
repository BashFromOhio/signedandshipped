# Drill 3: Wrong Android upload key

**Lab:** Either · **Area:** Signing · **Interview priority**

> Like you're 10: You signed the permission slip with your friend's name. The office knows your signature and says no.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, pointed the package lane at a different test keystore. Use test assets or preflight fixtures. Never revoke real certificates.

## 2. Expected symptom
The Gradle build succeeds, but Play rejects the upload.

Example (redacted) output, release-android #88 · fastlane android beta:
```
> Task :app:bundleRelease
BUILD SUCCESSFUL in 3m 12s
[upload_to_play_store] Uploading app-release.aab to track 'internal'…
Google Api Error: Invalid request - The Android App Bundle was signed with the wrong key.
  Found: SHA1: 3B:●●:●●:…:91
  Expected: SHA1: A7:●●:●●:…:0C
```

## 3. Diagnose
- Leading hypothesis: The AAB was signed with a key that isn't the registered upload key
- Next command: keytool -printcert -jarfile app-release.aab, and compare to the upload certificate in Play Console (not the app signing cert)

## 4. Contain and fix
Point the lane back at the intended upload keystore from the protected secret; if truly lost, use Play's upload key reset

## 5. Verify
A fingerprint preflight blocks the wrong key before upload; a fixture test with the wrong test keystore fails

## 6. Complication to rehearse
A teammate suggests committing the keystore to the repo 'so this never happens again'. → No. Keep it in a secret manager/protected environment, decode to a temp file per job, delete it in an always step; the preflight catches mismatches

## 7. Senior follow-up
**Why shouldn't an upload-key incident trigger app signing key replacement?**

<details><summary>Strong answer</summary>

The app signing key is held by Google and is what installed apps verify updates against. The upload key only authenticates your uploads to Play. An upload key reset doesn't affect users at all, while an app signing key upgrade is heavyweight and unnecessary here.
</details>

## Reference files
- [scripts/verify-upload-cert.sh](../../scripts/verify-upload-cert.sh)
- [apps/android/app/signing.gradle.kts](../../apps/android/app/signing.gradle.kts)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
