# Run it locally: the whole picture

You've just been hired onto RouteReady's mobile platform team. Dana, the Mobile Platform Lead, hands you a laptop and says:

> "Before you touch CI, build everything yourself, end to end, on this machine. When you can take a fresh clone to a running app, break it, and fix it, you're ready for the pipeline work."

This kit is that first assignment. Twelve levels take you from an empty laptop to debugging a crashing APK. They get harder as you go, and each one maps to a ticket and a sprint from the Signed & Shipped game.

**Everything installs inside this repo's `.tools/` folder.** Java, the Android SDK, the emulator, Gradle, Node, their caches, and the emulator images all live there. Nothing goes into your system folders, your shell profile, or `~/.gradle`. To remove all of it, run `local/clean.sh`, or delete `.tools/`.

All data is fictional: fake school buses, fake parents and two fake vacation rentals.

---

## What you're building

```
                       your computer
 ┌──────────────────────────────────────────────────────────────┐
 │  local/mock-api/server.py   ← Level 03                        │
 │  (RouteReady + StayReady API on :8080, drill modes)           │
 │        ▲ http://10.0.2.2:8080            ▲ http://localhost   │
 │        │ (emulator's name for your PC)   │ (simulator shares) │
 │  ┌─────┴──────────────┐   ┌──────────────┴─────┐              │
 │  │ Android emulator    │   │ iOS Simulator (Mac)│              │
 │  │  RouteReady (Kotlin)│   │  RouteReady (Swift)│              │
 │  │  StayReady (RN)     │   │  StayReady (RN)    │              │
 │  └─────────────────────┘   └────────────────────┘              │
 │  .tools/  JDK 17 · Android SDK · emulator · Gradle · Node      │
 └──────────────────────────────────────────────────────────────┘
```

| App | Folder | Tech | What it does |
|---|---|---|---|
| RouteReady (Android) | `apps/android` | Kotlin, Gradle, zero third-party libraries | Parent signs in, picks a route, sees where the bus is and **how old that data is**, reads alerts |
| RouteReady (iOS) | `apps/ios` | SwiftUI, XcodeGen spec (`project.yml`) | The same four screens |
| StayReady | `stayready/mobile` | React Native + Expo (TypeScript) | A guest at one of two rentals (tenants) sees their stay and requests towels. Retries are safe because of idempotency keys |
| Mock API | `local/mock-api` | Python 3, standard library only | Both backends, plus drill modes that break things on purpose |

---

## The levels (do them in order)

| Level | What you do | Difficulty | Time* | Sprint | Ticket | Guide |
|---|---|---|---|---|---|---|
| 00 | Check your machine | ★☆☆☆☆ | 5 min | 1 | MOB-101 | [level-00](level-00.md) |
| 01 | Install a project-only JDK 17 | ★☆☆☆☆ | 5–10 min | 1 | MOB-101 | [level-01](level-01.md) |
| 02 | Install the Android SDK + Gradle, create the wrapper | ★★☆☆☆ | 10–20 min | 1 | MOB-101 | [level-02](level-02.md) |
| 03 | Run the API and prove old apps still work | ★☆☆☆☆ | 10 min | 1 | MOB-106 | [level-03](level-03.md) |
| 04 | Build and test the debug APK like PR CI | ★★☆☆☆ | 10–15 min | 1–2 | MOB-103 | [level-04](level-04.md) |
| 05 | Create and boot an emulator | ★★★☆☆ | 15–30 min | 1 | MOB-103 | [level-05](level-05.md) |
| 06 | Install, run and watch the app (vertical slice) | ★★☆☆☆ | 10 min | 1 | MOB-103 | [level-06](level-06.md) |
| 07 | **Debug the APK**: inspect, logcat, crash buffer, jdb | ★★★★☆ | 45–60 min | 6–7 | MOB-114/115 | [level-07](level-07.md) |
| 08 | Sign a release, verify it, write a manifest | ★★★★☆ | 30–45 min | 3 | MOB-107/108/109 | [level-08](level-08.md) |
| 09 | Run the real Fastlane CI lane locally | ★★★☆☆ | 20–30 min | 2–3 | MOB-103 | [level-09](level-09.md) |
| 10 | iOS: generate, test and run on the Simulator (Mac) | ★★★★☆ | 30–60 min | 1–2 | MOB-103 | [level-10](level-10.md) |
| 11 | React Native: run StayReady | ★★★★☆ | 30–45 min | 6–7 | MOB-110 | [level-11](level-11.md) |
| 12 | Break-fix drills (11 of them) | ★★☆☆☆ → ★★★★★ | 15–40 min each | 6–7 | MOB-115/116 | [level-12](level-12.md) |

\* First run, on a decent connection. The big downloads are the JDK (~190 MB), the SDK (~500 MB) and the emulator image (~1.5 GB).

**Shortcut when you just want to see it work:**
```bash
local/00-doctor.sh && local/01-install-jdk.sh && local/02-install-android-sdk.sh
local/03-run-api.sh --bg && local/04-build-android.sh && local/05-emulator.sh && local/06-install-run.sh
```

---

## How the levels map to the Signed & Shipped sprints

| Sprint | Goal in the game | Levels that make it real on your machine |
|---|---|---|
| 1 | Toolchain, contracts, a vertical slice | 00–06 and 10. Exit test: a fresh clone runs the app against the API on both platforms |
| 2 | PR validation | 04 and 09 run the same tasks PR CI runs |
| 3 | Fastlane packaging, signing, manifests | 08 (signed AAB/APK, fingerprint, mapping file, manifest) and 09 |
| 6–7 | Observe, respond, write it up | 07 (debugging), 11 (StayReady) and 12 (drills ending in STAR stories) |

Sprints 4–5 (store uploads, approvals, rollout) need real store accounts. Mark them **BLOCKED** in `docs/progress.md`, as the game teaches. Everything up to "signed artifact + manifest" works locally.

---

## Daily commands

| Command | What it does |
|---|---|
| `source local/env.sh` | Use the project's Java/adb/Gradle/Node in **this** terminal only |
| `local/status.sh` | What's installed, what's running, which levels and drills are done |
| `local/03-run-api.sh --bg` / `--stop` | Start or stop the API in the background |
| `local/05-emulator.sh --stop` | Shut down the emulator |
| `local/drill.sh list` | Break-fix drills |
| `local/clean.sh` | Delete everything the kit installed |

## Where things live

| Path | What | In git? |
|---|---|---|
| `.tools/` | JDK, SDK, emulator + AVD, Gradle, Node, all caches, API log, progress marks | No |
| `.secrets/` | Your local upload keystore + its password (Level 08) | **Never** |
| `evidence/local/` | Release manifests, R8 mapping files, screenshots | Your choice (no secrets in it) |
| `apps/android/gradlew`, `gradle/wrapper/*` | Generated in Level 02 | **Yes**: commit them |
| `apps/ios/RouteReady.xcodeproj` | Generated from `project.yml` in Level 10 | No |
| `stayready/mobile/package-lock.json` | Exact JS dependency versions | Yes |

## Honesty rules (same as the game)

- A level you finished is **VERIFIED** on your machine. Write the date in `docs/progress.md`.
- Something you can't do (for example iOS on Windows, or store uploads) is **BLOCKED**, not skipped silently.
- In interviews, say "in my RouteReady lab", not "at work".

Also read: [Windows and WSL](windows-wsl.md) · [Troubleshooting](troubleshooting.md)
