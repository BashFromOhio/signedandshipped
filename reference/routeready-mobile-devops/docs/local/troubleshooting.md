# Troubleshooting

Start every investigation with:
```bash
local/status.sh                 # what's installed / running / done
cat .tools/toolchain.txt        # versions in use
tail -50 .tools/api.log         # what the API saw
local/07-debug-apk.sh crash     # what the app last crashed on
```

| Symptom | Likely cause | Fix |
|---|---|---|
| `command not found: adb` (or java/gradle) in your terminal | The project toolchain isn't loaded in this terminal | `source local/env.sh` (each new terminal). The scripts load it themselves |
| A script says `Run local/0X-… first` | Levels skipped | Do them in order |
| Downloads fail behind a corporate proxy | Proxy blocks dl.google.com / services.gradle.org / adoptium / nodejs.org | Try another network; or set `HTTPS_PROXY`, plus `systemProp.https.proxyHost`/`proxyPort` in `apps/android/gradle.properties` for Gradle |
| `Checksum mismatch` | Interrupted or tampered download | Re-run (the bad file was deleted) |
| Gradle: `Could not resolve …` | No access to Google Maven / Maven Central | Network; delete `.tools/gradle-home/caches` if a partial download is cached (game drill 7) |
| Gradle is very slow | First run downloads everything; low RAM | Later runs use the cache in `.tools/gradle-home`; raise `-Xmx` in `gradle.properties` |
| `adb: no devices/emulators found` | Emulator not booted, or phone not authorized | `local/05-emulator.sh`; accept the USB prompt on the phone |
| Two devices connected, adb confused | Phone + emulator | `adb -s emulator-5554 …` or unplug one |
| App: "Can't reach RouteReady" | API down, wrong host, or cleartext blocked | `local/03-run-api.sh --check`; drills 1 and 2 cover the other two |
| `INSTALL_FAILED_*` | Signing or version mismatch | Drills 5 and 6 |
| Emulator black screen / stuck | Snapshot corruption | `emulator -avd routeready_api36 -wipe-data` (lab only) |
| Disk full | Emulator images + caches | `local/clean.sh`, or delete `.tools/android-user-home/avd` |
| Something's just weird | Leftover drill | `local/drill.sh reset` |
| Start completely fresh | — | `local/clean.sh --all`, then Level 00 |
