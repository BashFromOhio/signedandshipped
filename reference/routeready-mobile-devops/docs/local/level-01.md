# Level 01 · Install a project-only JDK

**Difficulty** ★☆☆☆☆ · **Time** 5–10 min · **Sprint** 1 · **Ticket** MOB-101

## The story
Dana: *"Half the team has Java 11, the other half Java 21, and Gradle behaves differently for each. Make the project bring its own Java."*

## Like I'm 10
Instead of borrowing whatever pencil is lying around, the class gets the same pencil, kept in the class box. Everyone's drawing comes out the same.

## Run it
```bash
local/01-install-jdk.sh          # --force to reinstall
source local/env.sh              # optional: use this Java in your own terminal
java -version
```

## What happens, step by step
1. It asks the official Eclipse Temurin (Adoptium) API for the latest **JDK 17** build for your OS and CPU. The Android Gradle Plugin 8.x needs JDK 17 or newer, and we pin 17 to match CI.
2. It downloads the archive and **verifies its SHA-256 checksum** against the one the API published. A corrupted or tampered file is deleted.
3. It unpacks into `.tools/jdk` (on a Mac, the real home is `.tools/jdk/Contents/Home`).
4. It runs `java -version` and fails unless it says 17.

`JAVA_HOME` is only set **inside the scripts** and in terminals where you ran `source local/env.sh`. Your system Java and your shell profile aren't touched.

## Expected output
```
release: jdk-17.0.x+y
✓ checksum verified (sha256) OpenJDK17U-jdk_x64_linux_hotspot_17.0.x_y.tar.gz
openjdk version "17.0.x" ...
✓ JAVA_HOME=/…/routeready-mobile-devops/.tools/jdk
```

## Done when
`.tools/jdk/bin/java -version` (Mac: `.tools/jdk/Contents/Home/bin/java -version`) says 17.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `Couldn't reach api.adoptium.net` | Proxy or firewall | Try another network, or set `HTTPS_PROXY` |
| `Checksum mismatch` | Interrupted download | Run it again (the bad file was deleted) |
| `java -version` in your terminal still shows another version | You didn't source the env | `source local/env.sh` (per terminal) |

## Interview angle
**Q: "Gradle fails with 'Unsupported class file major version 65'. What happened?"**
A newer JDK (21 is major version 65) compiled something an older tool can't read, or Gradle is running on a JDK it doesn't support. Check `./gradlew --version`, which shows the JVM Gradle is actually using, pin the JDK in CI with `actions/setup-java` and `distribution: temurin`, and record it in `docs/toolchain.md`. See drill 6 in the game.

**Next:** [Level 02](level-02.md)
