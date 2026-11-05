# Drill 20: Incompatible OTA update / unsafe AI change

**Lab:** StayReady · **Area:** AI + RN

> Like you're 10: You can download new game levels to your console, but you can't download a new controller over Wi-Fi.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, had an AI-generated PR add a native dependency and propose a JS-only update.

## 2. Expected symptom
Old installed clients crash: the native module doesn't exist.

Example (redacted) output, PR #96 'Add camera check-in' (AI-generated, 1,812 lines):
```
package.json: + "react-native-vision-camera"
ios/Podfile.lock: + VisionCamera
release plan: eas update --channel production (runtimeVersion unchanged)
installed 2.1: Invariant Violation: requireNativeComponent: "CameraView" was not found in the UIManager.
```

## 3. Diagnose
- Leading hypothesis: Native code was shipped through a JS-only update to binaries that lack the module, with the runtime version unchanged
- Next command: Review the native diff (Podfile.lock, android/, native modules), runtime version policy and channel

## 4. Contain and fix
Block publication or republish the last compatible update; build a new binary with a new runtime version; split the PR; add a preflight

## 5. Verify
A CI test proves a native change can't take the OTA-only path

## 6. Complication to rehearse
The AI PR is green and 1,812 lines long. Your reviewer says 'CI passed, approve it'. → Split it, explain every generated command, check native diffs, secrets and tests; green CI isn't judgment

## 7. Senior follow-up
**Why does approving a green PR still require engineering judgment?**

<details><summary>Strong answer</summary>

CI only checks what tests cover. It won't notice an unsafe release path, a secret in a script, an over-broad permission or a command nobody understands. I review the native diff, run the risky paths, and can explain every line before approving.
</details>

## Reference files
- [stayready/mobile/app.config.snippet.json](../../stayready/mobile/app.config.snippet.json)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
