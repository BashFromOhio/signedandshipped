# Drill 2: Locked CI keychain

**Lab:** RouteReady · **Area:** Signing

> Like you're 10: The seal stamp is in a locked drawer and nobody's there to type the code, so the job just stands there waiting.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, skipped CI keychain setup on a disposable runner. Use test assets or preflight fixtures. Never revoke real certificates.

## 2. Expected symptom
codesign hangs until the job times out, or fails with 'errSecInternalComponent'.

Example (redacted) output, release-ios #219 · fastlane ios package:
```
[09:14:02] gym: /usr/bin/codesign --force --sign ●●●●●●●● --entitlements …
[09:14:02] … no output …
[09:44:02] Error: The operation was canceled. (timeout-minutes: 30)
--- retry on a different runner ---
Warning: unable to build chain to self-signed root for signer
RouteReady.app: errSecInternalComponent
```

## 3. Diagnose
- Leading hypothesis: codesign can't access the private key non-interactively: the keychain is locked or the key partition list isn't set
- Next command: security find-identity -v -p codesigning and security list-keychains -d user, to separate 'identity missing' from 'access denied'

## 4. Contain and fix
Restore setup_ci (temporary unlocked keychain set as default), match readonly into it, and delete_keychain in a cleanup that always runs

## 5. Verify
Two fresh runners package without prompts, and a post-job check shows no temp keychain or .p12 left behind

## 6. Complication to rehearse
On a self-hosted Mac, a job crashed mid-way. The next job on that runner finds a leftover keychain with the signing identity. → Cleanup runs in an always()/ensure block, keychain names are unique per run, and a sweep step removes stragglers

## 7. Senior follow-up
**Why not leave a shared runner's keychain permanently unlocked?**

<details><summary>Strong answer</summary>

Any job that lands on that runner, including other projects or untrusted code, could sign arbitrary binaries with your identity. Keys sit on disk indefinitely, isolation and audit break, and you'd never know who used them.
</details>

## Reference files
- [.github/workflows/release-ios.yml](../../.github/workflows/release-ios.yml)
- [fastlane/Fastfile](../../fastlane/Fastfile)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
