# Toolchain record

Fill every `<VERIFY>` from official compatibility docs AND what the runner image actually has.
Record the date. Upgrade only through a reviewed PR that updates this file and the workflows together.

Verified on: `<YYYY-MM-DD>` by `<you>`

| Tool | Version | Source checked |
|---|---|---|
| macOS runner image | `macos-15` (confirm in runner-images) | actions/runner-images |
| Xcode | `<VERIFY>` | runner image README |
| iOS simulator runtime | `<VERIFY>` | `xcrun simctl list runtimes available` |
| Swift | `<VERIFY>` | `swift --version` |
| Android Gradle Plugin | `<VERIFY>` | AGP release notes (minimum JDK + Gradle) |
| Gradle wrapper | `<VERIFY>` + checksum | `gradle-wrapper.properties` |
| JDK | `<VERIFY>` (Temurin) | AGP requirement |
| Kotlin | `<VERIFY>` | AGP/Kotlin compatibility table |
| Android SDK / build tools | `<VERIFY>` | `sdkmanager --list_installed` |
| Ruby / Bundler / Fastlane | `<VERIFY>` | `Gemfile.lock` |
| Node / React Native (StayReady) | `<VERIFY>` | RN compatibility docs |
| Python (StayReady API) | `<VERIFY>` | |
| Java (RouteReady API) | `<VERIFY>` | |
| Third-party actions | full commit SHAs | each action's release page |

Commands to capture as evidence: `./scripts/print-toolchain.sh`, `xcodebuild -showdestinations -scheme RouteReady`, `xcrun simctl list devices available`.
