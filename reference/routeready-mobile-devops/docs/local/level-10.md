# Level 10 · iOS: generate, test and run on the Simulator

**Difficulty** ★★★★☆ · **Time** 30–60 min (Xcode is a large download) · **Sprint** 1–2 · **Ticket** MOB-103 · **Mac only**

## The story
Dana: *"The iOS app needs the same vertical slice. No Apple Developer account is needed for the simulator, so there's no excuse."*

## Like I'm 10
Same toy, different playroom. Apple's playroom only exists on Macs.

## Before you start
- **Xcode** from the Mac App Store, opened once to accept the license, plus an **iOS Simulator runtime** (Xcode → Settings → Components). Xcode can't be installed into a project folder; that's Apple's rule.
- No Mac? Mark this level **BLOCKED** in `docs/progress.md`, and let a GitHub-hosted macOS runner do it (`pr-ci.yml`). That's a legitimate answer in an interview.

## Run it
```bash
local/10-ios.sh
```

## What happens, step by step
1. Downloads **XcodeGen** into `.tools/xcodegen`.
2. `xcodegen generate --spec apps/ios/project.yml` creates `RouteReady.xcodeproj`. The `.xcodeproj` is **generated, not committed**: it's huge and merges badly, while the short YAML is easy to review.
   - Debug builds use `RR_API_BASE_URL = http://localhost:8080`. The simulator shares your Mac's network, so there's no `10.0.2.2` here.
   - `NSAllowsLocalNetworking` allows plain HTTP only to local addresses. Everything else must be HTTPS (App Transport Security).
3. Finds an **available** iPhone simulator instead of a hard-coded name that a newer Xcode may drop (game drill 5).
4. `xcodebuild test` runs `RouteReadyTests`, including the null `eta_confidence` case that Swift's `Optional` decoding already handles.
5. Builds the Debug app, boots the simulator, then `simctl install` and `simctl launch org.routeready.parent`.

## Expected output (abridged)
```
⚙️  Generating project...  Created project at …/apps/ios/RouteReady.xcodeproj
simulator: iPhone 17 (…UDID…) (Shutdown)
Test Suite 'All tests' passed … Executed 3 tests, with 0 failures
✓ Running. Sign in → Route 1.
```

## Watch the logs
```bash
xcrun simctl spawn booted log stream --predicate 'subsystem == "org.routeready.parent"'
```
You'll see the same `GET … -> 200 request_id=…` lines as on Android.

## Done when
Tests pass and the app shows LIVE data in the simulator. Mark "iOS simulator verify" VERIFIED. iOS signing for TestFlight stays **BLOCKED** until you have an Apple Developer account.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `xcode-select: error: tool 'xcodebuild' requires Xcode` | Only the command line tools are selected | `sudo xcode-select -s /Applications/Xcode.app` |
| `No iPhone simulator` | No runtime installed | Xcode → Settings → Components |
| `Unable to boot device in current state: Booted` | Already running | Harmless, the script continues |
| App shows "Can't reach RouteReady" | API down | `local/03-run-api.sh --bg` |

## Interview angle
**Q: "Why does iOS CI need a Mac, and how do you keep it affordable?"**
Xcode only runs on macOS. macOS runner minutes cost more, so run iOS jobs only when iOS or shared files change (path filters), cache SwiftPM dependencies, and run the big device matrix nightly rather than on every PR.

**Next:** [Level 11](level-11.md)
