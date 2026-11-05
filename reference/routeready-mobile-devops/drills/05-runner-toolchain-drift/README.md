# Drill 5: Runner/toolchain drift

**Lab:** RouteReady · **Area:** CI

> Like you're 10: Your recipe says 'bake in Oven #3', but the school replaced the ovens over the weekend.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, changed the runner image so the expected simulator disappeared.

## 2. Expected symptom
xcodebuild says 'Unable to find a destination' or reports an SDK incompatibility.

Example (redacted) output, pr-ci #1042 · ios-verify:
```
$ xcodebuild test -scheme RouteReady -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'
xcodebuild: error: Unable to find a destination matching the provided destination specifier:
    { platform:iOS Simulator, OS:17.0, name:iPhone 15 }
  Available destinations for the "RouteReady" scheme:
    { platform:iOS Simulator, arch:arm64, id:●●●●, OS:26.0, name:iPhone 17 }
```

## 3. Diagnose
- Leading hypothesis: The runner image/Xcode changed and the hardcoded destination no longer exists
- Next command: xcodebuild -version; xcode-select -p; xcodebuild -showdestinations; xcrun simctl list devices available, and compare to docs/toolchain.md

## 4. Contain and fix
Pin the runner image and Xcode, pick a destination from the detected list, upgrade through a reviewed toolchain PR

## 5. Verify
A fresh-runner matrix passes for the declared images and the job prints its toolchain into evidence

## 6. Complication to rehearse
The image you pinned is announced for retirement in six weeks. → Open a toolchain PR now that runs the new image in a non-blocking matrix job, compare results, then switch the required check

## 7. Senior follow-up
**How do you upgrade before a hosted image is retired?**

<details><summary>Strong answer</summary>

Watch the runner-images announcements, add the candidate image to the nightly matrix, update toolchain.md with verified versions, measure build time and failures, then flip the required job through a reviewed PR.
</details>

## Reference files
- [scripts/pick-simulator.sh](../../scripts/pick-simulator.sh)
- [docs/toolchain.md](../../docs/toolchain.md)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
