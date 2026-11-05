# Drill 1: iOS provisioning mismatch

**Lab:** RouteReady · **Area:** Signing · **Interview priority**

> Like you're 10: Your concert ticket is for Seat 12, but you're trying to sit in Seat 14. Practicing at home (simulator) never checked your ticket.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, configured the release with an entitlement missing from its provisioning profile. Use test assets or preflight fixtures. Never revoke real certificates.

## 2. Expected symptom
PR CI on the simulator is green. The explicit release run fails during export.

Example (redacted) output, release-ios #212 · fastlane ios package:
```
[13:02:04] gym: ▸ Archive Succeeded
[13:02:11] gym: Exporting archive with export_method app-store
error: exportArchive: Provisioning profile "RouteReady AppStore" doesn't include the com.apple.developer.associated-domains entitlement.
error: exportArchive: Profile doesn't match the entitlements file's value for the application-identifier entitlement.
** EXPORT FAILED **
[13:02:12] Error building the application - see the log above
```

## 3. Diagnose
- Leading hypothesis: The profile doesn't cover the app's bundle ID/entitlements, a distribution-signing mismatch the simulator never exercised
- Next command: xcodebuild -showBuildSettings | grep -E 'PRODUCT_BUNDLE_IDENTIFIER|CODE_SIGN_ENTITLEMENTS|DEVELOPMENT_TEAM' and security cms -D -i the .mobileprovision

## 4. Contain and fix
Stop the release; add the capability to the App ID and regenerate the profile through the authorized provisioning process; CI stays read-only

## 5. Verify
A preflight fixture with the wrong mapping fails fast, and a real archive/export passes with valid assets, recorded in the manifest

## 6. Complication to rehearse
The admin regenerated the profile. CI still fails and the log shows the OLD profile UUID. → A stale profile is cached on the runner or in a restored cache; make match fetch fresh and scope or clear only that cache

## 7. Senior follow-up
**Why does successful simulator testing say nothing about distribution signing?**

<details><summary>Strong answer</summary>

Simulator builds aren't signed with your distribution certificate, don't embed an App Store profile, and never go through export. Bundle ID, team, entitlements and profile are only validated at archive/export, so the simulator can't catch this class of failure.
</details>

## Reference files
- [scripts/signing-preflight-ios.sh](../../scripts/signing-preflight-ios.sh)
- [fastlane/Matchfile](../../fastlane/Matchfile)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
