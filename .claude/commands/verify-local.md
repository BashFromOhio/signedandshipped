---
description: Run and verify every "Run it locally" level on this machine, fix what breaks, write a report, and open a PR
---

You are verifying the RouteReady "Run it locally" kit on a real machine. The kit was written in a cloud
workspace where Google, Gradle, JDK and Node downloads were blocked, so the Android and iOS builds have
never actually run. Your job is to run every level here, fix what breaks, and hand back proof.

Extra instructions from the user (may be empty): $ARGUMENTS

## Where things are
- Game repo root: this folder (`index.html`, `app.js`, `data.js`, `repo.js`).
- Kit: `reference/routeready-mobile-devops/` and do ALL lab work from inside that folder.
- Level scripts: `local/00-doctor.sh` … `local/11-react-native.sh`, `local/drill.sh`, `local/status.sh`.
- Guides: `docs/local/README.md` and `docs/local/level-NN.md` (read the guide for a level before running it).

## Ground rules
1. Everything must install inside `reference/routeready-mobile-devops/.tools/`. Never run `sudo`, `brew install`,
   `apt-get install` or change shell profiles yourself. If a level needs something system-wide
   (Ruby for Level 09, Xcode for Level 10, a missing basic tool from Level 00), STOP and tell the user the exact
   command to run, then continue after they confirm.
2. Never commit or print secrets: `.tools/`, `.secrets/` (upload keystore + password), `.drills/` are git-ignored; keep it that way.
3. The bug in `apps/android/app/src/main/java/org/routeready/parent/Models.kt` marked `KNOWN BUG (Level 07 + drill 3)`
   and the `@Ignore` on `a null eta_confidence does not crash` are INTENTIONAL teaching material. You may fix them
   temporarily to verify Level 07, but you MUST restore both before committing. Same for every drill: run
   `local/drill.sh reset` before committing.
4. Fix real defects in scripts, build files, app code or guides with the smallest change that works. When a fix
   changes a command, a version, a file path or an expected output, update the matching `docs/local/level-NN.md`
   (and `docs/local/README.md` / `docs/local/troubleshooting.md` if relevant) in the same commit.
5. If a pinned version (AGP 8.13.0, Gradle 8.14.3, Kotlin 2.2.20, compileSdk/targetSdk 36, build-tools 36.0.0,
   Expo SDK 58) genuinely doesn't work, pick the nearest working version, verify it, and update
   `apps/android/build.gradle.kts`, `local/lib.sh` and the version table in `docs/local/level-02.md` together.
6. Long downloads are expected (JDK ~190 MB, SDK ~500 MB, emulator image ~1.5 GB). Run long steps with generous timeouts.

## Steps
1. `cd reference/routeready-mobile-devops`, `git status` (must be clean), then read `docs/local/README.md`.
2. Run levels in order and record PASS / FIXED / BLOCKED (with reason) for each:
   - 00 `local/00-doctor.sh`
   - 01 `local/01-install-jdk.sh`
   - 02 `local/02-install-android-sdk.sh`, which generates `apps/android/gradlew` + `gradle/wrapper/*` (these SHOULD be committed)
   - 03 `local/03-run-api.sh --bg` (it also runs the contract check)
   - 04 `local/04-build-android.sh` → expect lint + 4 passing tests (1 skipped on purpose) + `app-debug.apk`
   - 05 `local/05-emulator.sh --headless` (if no hardware acceleration, or on WSL: mark BLOCKED with the reason, and skip 06/07-device parts)
   - 06 `local/06-install-run.sh --no-logs`, then confirm the app's process is running and that `.tools/api.log` shows
     `GET /api/v1/routes` requests from the app after you drive it with
     `adb shell input tap` / `adb shell uiautomator dump` (sign in → Route 1). Save a screenshot with `local/07-debug-apk.sh shot`.
   - 07 `local/07-debug-apk.sh inspect`; then `local/drill.sh start 3`, open Route 1, capture `local/07-debug-apk.sh crash`
     and confirm the stack points at `RouteStatus$Companion.parse (Models.kt)`. Apply the fix from `docs/local/level-07.md`
     Part E, run `local/drill.sh check 3`, then RESTORE the bug and the `@Ignore` (rule 3) and `local/drill.sh reset`.
   - 08 `local/08-sign-release.sh` → confirm signatures verify and `evidence/local/manifest-android-N.json` exists.
   - 09 `local/09-fastlane.sh` only if Ruby exists (else BLOCKED: needs Ruby). If it runs, commit the new `Gemfile.lock`.
   - 10 `local/10-ios.sh` only on macOS with Xcode (else BLOCKED: needs a Mac/Xcode).
   - 11 `local/11-react-native.sh`, but don't leave the Expo dev server running; verify `npm ci`, typecheck and tests,
     and if an emulator is up, confirm the app opens (`npx expo start --android`, then stop it).
   - 12 run `start` → `check` → `reset` for drills 1, 2, 7, 8, 9 and 10 (the ones that can be checked automatically).
3. Clean up running things: `local/03-run-api.sh --stop`, `local/05-emulator.sh --stop`, `local/drill.sh reset`.
4. Write `docs/local/VERIFICATION.md` with:
   - date, OS + version, CPU, and the contents of `.tools/toolchain.txt`
   - a table: Level | Result (PASS/FIXED/BLOCKED) | Notes (what failed, the exact error line, the fix, the file changed)
   - the drill results, and any guide text you corrected
   - NO secrets, NO absolute home paths (replace with `~`), and NO keystore fingerprints you weren't asked to share
5. Update `docs/progress.md`: set "Toolchain recorded", "Local vertical slice", "Android signed AAB" (local key) and
   "iOS simulator verify" to VERIFIED, BLOCKED or NOT STARTED as appropriate, with today's date and
   `docs/local/VERIFICATION.md` as evidence. Fill the matching rows of `docs/toolchain.md` from `.tools/toolchain.txt`.
6. From the game repo root, refresh the in-game repo browser: `node tools/bundle-repo.js reference/routeready-mobile-devops repo.js`.
7. Commit and open a PR:
   - `git switch -c verify/local-run-$(date +%Y%m%d)`
   - stage only intended files and check `git status`: no `.tools/`, `.secrets/`, `.drills/`, `node_modules/`, `build/`, `*.keystore`, `*.jks`
   - commit with a message summarising PASS/FIXED/BLOCKED counts
   - `git push -u origin HEAD`, then `gh pr create --base main --title "Verify Run it locally on <OS>" --body-file reference/routeready-mobile-devops/docs/local/VERIFICATION.md`
   - if `gh` isn't installed or authenticated, print the compare URL instead:
     `https://github.com/BashFromOhio/signedandshipped/compare/main...<branch>?expand=1`
8. Finish with a short summary for the user: the PR link, the results table, and anything they must do by hand.
