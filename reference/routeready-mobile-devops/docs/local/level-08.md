# Level 08 · Sign a release and prove what you built

**Difficulty** ★★★★☆ · **Time** 30–45 min · **Sprint** 3 · **Tickets** MOB-107 (build numbers), MOB-108 (signing), MOB-109 (manifest)

## The story
Dana: *"Two jobs both used build number 57 and the store rejected one. Signing used to happen on the old engineer's laptop. And an auditor wants proof that what we shipped is exactly what we tested. Fix all three, locally first."*

## Like I'm 10
Signing is your wax seal on a letter: it proves the letter came from you and nobody changed it. The build number is the page number: it only goes up, and two letters never share one. The manifest is the receipt stapled to the letter.

## Run it
```bash
local/08-sign-release.sh
```

## What happens, step by step
1. **Creates a local upload key** (first run only) in `.secrets/upload.keystore`: PKCS12, RSA 4096, valid 25 years. A random password goes in `.secrets/upload.env` with `chmod 600`. Both are git-ignored. **Never commit them.**
   - Why "upload" key? With Play App Signing, *you* sign with the upload key and Google re-signs with the **app signing key** it keeps. If you lose the upload key, Google can reset it. If you lose an app signing key you kept yourself, you can never update the app again.
2. **Allocates the next build number** (`.tools/build-number`, starting at 101). It's a local stand-in for `scripts/allocate-build-number.sh`, the concurrency-safe allocator CI uses. A number is used up even if the build later fails, and that's correct.
3. **Builds** with `-ProutereadyVersionCode=N`:
   - `bundleRelease` makes `app-release.aab`, what you upload to Play.
   - `assembleRelease` makes `app-release.apk`, for sideloading and tests.
   - Release builds run **R8** (shrink + obfuscate) and point at the "production" URL (`https://api.routeready.example`, fake on purpose).
4. **Verifies**: `apksigner verify --print-certs` on the APK and `keytool -printcert -jarfile` on the AAB. It prints the **upload key SHA-256 fingerprint**, which CI's `scripts/verify-upload-cert.sh` compares against so the wrong key fails *before* upload (game drill 3).
5. **Saves the R8 `mapping.txt`** to `evidence/local/mapping-N/`. Without it, release crash stacks read `a.b.c(Unknown Source)` (game drill 19).
6. **Writes `evidence/local/manifest-android-N.json`** with the app id, version, build number, git sha, SHA-256 of both artifacts, the upload cert fingerprint and the mapping path. **No secrets.**

## Expected output (abridged)
```
versionCode = 101   (never reuse one: stores reject duplicates - drill 4)
BUILD SUCCESSFUL
Signer #1 certificate DN: CN=RouteReady Lab Upload, O=Fictional Lab, C=US
Signer #1 certificate SHA-256 digest: 3a7f…
upload key fingerprint: 3A:7F:…
✓ evidence/local/mapping-101/mapping.txt
✓ evidence/local/manifest-android-101.json
```

## Try it: the release can't reach your local API
Install the release APK and open it:
```bash
adb install -r apps/android/app/build/outputs/apk/release/app-release.apk
```
You'll probably hit `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. That's drill 5, and on purpose. Read [Level 12](level-12.md) before uninstalling. Once installed, the app says it can't reach `api.routeready.example`. **Good.** That's MOB-111: the prod build points at prod, and release builds allow HTTPS only.

## Done when
The AAB and APK verify with your upload cert, and the manifest plus mapping are in `evidence/local/`. In `docs/progress.md`, mark "Android signed AAB" as **VERIFIED (local key)** and "Beta upload" as **BLOCKED: needs Play Console**.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `Keystore was tampered with, or password was incorrect` | `.secrets/upload.env` doesn't match the keystore | Delete `.secrets/` (lab only) and re-run |
| `Release build is not signed` | Env vars not loaded | Run through the script, which loads `.secrets/upload.env` |
| R8 errors (`Missing class`) | A library uses reflection | Add a keep rule in `proguard-rules.pro` (this app has none) |

## Interview angle
**Q: "Walk me through how an Android release gets signed in CI."**
A trusted release job (never a PR job) gets the upload keystore and passwords from a protected environment, decodes the keystore to a temp file, and runs `bundleRelease` with a build number from a single allocator. It verifies the certificate fingerprint before upload, uploads the AAB, and Play re-signs with the app signing key. The job stores the mapping file and a manifest with the artifact's SHA-256, then deletes the keystore. Retries upload the *same* file. They never rebuild.

**Next:** [Level 09](level-09.md)
