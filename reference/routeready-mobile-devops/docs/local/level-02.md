# Level 02 · Install the Android SDK and Gradle

**Difficulty** ★★☆☆☆ · **Time** 10–20 min · **Sprint** 1 · **Ticket** MOB-101

## The story
Dana: *"Android Studio is fine for writing code, but CI has no Studio. Install the SDK the way a build server does: command-line tools, exact packages, licenses accepted, and the Gradle wrapper committed."*

## Like I'm 10
Android Studio is a fancy kitchen. A build server only needs the stove, the pans and the recipe. You're setting up just those.

## Run it
```bash
local/02-install-android-sdk.sh
```

## What happens, step by step
1. **Find the newest command-line tools** by reading Google's official SDK index (`repository2-3.xml`). It takes the stable-channel `cmdline-tools;latest` for your OS, plus its **SHA-1 checksum**.
2. **Download and verify**, then unpack to `.tools/android-sdk/cmdline-tools/latest/`. `sdkmanager` refuses to work from any other folder layout.
3. **Accept the SDK licenses.** Read them at developer.android.com/studio/terms. CI does this with `yes | sdkmanager --licenses`.
4. **Install exact packages:**
   - `platform-tools`: `adb`, which talks to devices.
   - `platforms;android-36`: the Android 16 API that `compileSdk = 36` builds against.
   - `build-tools;36.0.0`: `aapt2`, `apksigner` and `zipalign`, used in Levels 04, 07 and 08.
5. **Install Gradle 8.14.3**, with its checksum checked against `services.gradle.org`.
6. **Generate the Gradle wrapper** (`gradlew` and `gradle/wrapper/*`) in `apps/android`, with `distributionSha256Sum` pinned. From now on everyone runs `./gradlew`, which downloads exactly that Gradle and refuses a tampered copy.
7. **Write `.tools/toolchain.txt`.** Copy the versions into `docs/toolchain.md`.

## The versions and why
| Thing | Version | Why this one |
|---|---|---|
| Android Gradle Plugin | 8.13.0 (`apps/android/build.gradle.kts`) | Stable 8.x line; needs Gradle 8.13+ and JDK 17+ |
| Gradle | 8.14.3 | Satisfies AGP 8.13 |
| Kotlin | 2.2.20 | Supported with AGP 8.13 |
| compileSdk / targetSdk | 36 | Current Android API level |
| minSdk | 26 | `java.time` works without extra libraries |

AGP 9 exists and changes the DSL. Upgrading is a great **toolchain PR** exercise once everything works: update this table, `docs/toolchain.md` and the build files in one reviewed change.

## Expected output (end)
```
✓ wrapper created with distributionSha256Sum pinned
Recorded: 2026-…Z on mac/aarch64
openjdk version "17.0.x"
Gradle 8.14.3
  build-tools;36.0.0 | 36.0.0 | …
  platforms;android-36 | …
AGP: 8.13.0
```

## Done when
`apps/android/gradlew` exists and `.tools/toolchain.txt` lists the versions. **Commit** `gradlew`, `gradlew.bat` and `gradle/wrapper/`.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `Couldn't reach dl.google.com` | Network policy | Use another network. Some corporate proxies block Google downloads |
| `sdkmanager: JAVA_HOME is not set` | Skipped Level 01 | `local/01-install-jdk.sh` |
| `Warning: Failed to find package` | Package name typo, or Google renamed it | `sdkmanager --list` shows the exact names |
| Wrapper generation fails | Gradle download blocked | Re-run; check `services.gradle.org` is reachable |

## Interview angle
**Q: "Why commit the Gradle wrapper and its checksum?"**
The wrapper pins the exact Gradle version for every developer and CI run, and `distributionSha256Sum` makes it refuse a tampered or corrupted download. Without it, people build with whatever Gradle they happen to have, and supply-chain risk goes up.

**Next:** [Level 03](level-03.md)
