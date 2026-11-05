# local/ · run everything on your machine

Numbered scripts that take a fresh clone to a running, debuggable app. Everything installs into `../.tools/` (delete it to undo).

**Start here → [docs/local/README.md](../docs/local/README.md)** (the whole picture, levels table and guides)

```
00-doctor.sh              check the machine (installs nothing)
01-install-jdk.sh         JDK 17 → .tools/jdk
02-install-android-sdk.sh Android SDK + Gradle → .tools, Gradle wrapper → apps/android
03-run-api.sh             mock API on :8080 (--bg, --stop, --check)
04-build-android.sh       lint + unit tests + debug APK
05-emulator.sh            create + boot an emulator (--headless, --stop)
06-install-run.sh         install, launch, stream logs
07-debug-apk.sh           inspect | logs | crash | state | shot | jdb | net
08-sign-release.sh        build number + signed AAB/APK + verify + manifest
09-fastlane.sh            the CI lane, locally
10-ios.sh                 SwiftUI app on the iOS Simulator (Mac)
11-react-native.sh        StayReady (Expo) on emulator/simulator
drill.sh                  Level 12: 11 break-fix drills
status.sh · clean.sh · env.sh (source it) · lib.sh (shared helpers)
mock-api/                 server.py (stdlib only) + check_contract.py
```
