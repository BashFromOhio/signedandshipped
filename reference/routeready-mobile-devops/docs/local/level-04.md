# Level 04 · Build and test the debug APK like PR CI

**Difficulty** ★★☆☆☆ · **Time** 10–15 min (first build downloads plugins) · **Sprint** 1–2 · **Tickets** MOB-102, MOB-103

## The story
Dana: *"Every pull request must build and test the app, and none of those runs may see our signing keys. Run exactly what PR CI runs, on your machine."*

## Like I'm 10
Before handing in homework, you check your spelling (lint), redo the math problems (tests), and staple it together (build). A debug build is your rough draft. It isn't the one you hand to the teacher yet.

## Run it
```bash
local/04-build-android.sh
```
Under the hood it runs:
```bash
cd apps/android && ./gradlew lintDebug testDebugUnitTest assembleDebug
```
These are the same tasks as `fastlane android verify` and the PR workflow.

## What happens, step by step
1. **Configuration.** Gradle reads `settings.gradle.kts`, `build.gradle.kts` and `app/build.gradle.kts`, and downloads AGP + Kotlin into `.tools/gradle-home` the first time.
2. **`lintDebug`** runs Android's static checks (API levels, manifest mistakes, security smells). The report is at `app/build/reports/lint-results-debug.html`.
3. **`testDebugUnitTest`** runs JVM unit tests in `app/src/test`. They parse the **real contract fixtures** (`contracts/fixtures/v1.3` and `v1.5`), so an app change that breaks old-API parsing fails here.
4. **`assembleDebug`** compiles Kotlin and packages resources into an APK, then signs it with the **debug key**. Android refuses to install unsigned APKs, even debug ones.
5. The script then prints the APK size, SHA-256 and `aapt2 dump badging` (package name, version, SDK levels).

## Look inside the code (10 minutes well spent)
| File | What to notice |
|---|---|
| `app/build.gradle.kts` | `API_BASE_URL` differs for debug and release; `versionCode` comes from a property; release signing reads environment variables |
| `app/src/main/java/.../Models.kt` | `isStale()` doesn't trust the server; the **KNOWN BUG** comment (Level 07) |
| `app/src/test/.../RouteStatusTest.kt` | The `@Ignore`d test you'll switch on in Level 07 |
| `app/src/debug/res/xml/network_security_config.xml` | Debug-only permission for plain HTTP to `10.0.2.2` |

## Expected output (end)
```
BUILD SUCCESSFUL in 1m 12s
✓ build finished in 74s
APK:     apps/android/app/build/outputs/apk/debug/app-debug.apk
package: name='org.routeready.parent' versionCode='1' versionName='1.5.0' …
sdkVersion:'26'  targetSdkVersion:'36'
```

## Done when
`BUILD SUCCESSFUL`, 4 tests pass (1 is skipped on purpose), and `app-debug.apk` exists.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `SDK location not found` | `ANDROID_HOME` missing | Run through the script (it loads `env.sh`), or `source local/env.sh` |
| `Could not resolve com.android.tools.build:gradle` | No access to `google()` Maven | Network or proxy; corporate networks may need a Gradle proxy in `gradle.properties` |
| `Java home supplied is invalid` | A machine-specific path in `gradle.properties` | That's drill 8: remove `org.gradle.java.home` |
| Lint fails | A real issue, or a new lint rule after an upgrade | Read the HTML report; fix it, don't just disable the check |

## Interview angle
**Q: "What's the difference between `assembleDebug` and `bundleRelease`?"**
`assembleDebug` makes an APK signed with the debug key, for development only. `bundleRelease` makes an Android App Bundle (AAB) for the Play Store. It's minified by R8, signed with the **upload key**, and Google re-signs it with the app signing key. PR CI runs debug tasks only, so it never needs release secrets.

**Next:** [Level 05](level-05.md)
