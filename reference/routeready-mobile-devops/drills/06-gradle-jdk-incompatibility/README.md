# Drill 6: Gradle/JDK incompatibility

**Lab:** Either · **Area:** CI

> Like you're 10: The game cartridge needs a newer console than the one plugged in.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, changed the JDK without changing the pinned Android build tools.

## 2. Expected symptom
'Unsupported class file major version' or the Android Gradle Plugin refuses to apply.

Example (redacted) output, pr-ci #1051 · android-verify:
```
FAILURE: Build failed with an exception.
* What went wrong:
An exception occurred applying plugin request [id: 'com.android.application']
> Failed to apply plugin 'com.android.internal.application'.
   > Android Gradle plugin requires Java 17 to run. You are currently using Java 11.
```

## 3. Diagnose
- Leading hypothesis: The JDK on the runner changed outside the pinned set that AGP requires
- Next command: java -version; ./gradlew --version; check gradle-wrapper.properties and the AGP version

## 4. Contain and fix
Pin the JDK distribution/version from toolchain.md in setup-java and include it in the cache key

## 5. Verify
A clean build and a warm cache-hit build both pass

## 6. Complication to rehearse
After the fix, warm builds still fail now and then with 'Unsupported class file major version'. → The cache key lacks the JDK version, so caches compiled with a different JDK are restored

## 7. Senior follow-up
**Why is deleting every cache not a durable root-cause fix?**

<details><summary>Strong answer</summary>

It hides the cause, costs build minutes every run, and the problem returns when caching comes back. The real fix is a key that encodes every input that changes the output: OS, architecture, toolchain and lockfiles.
</details>

## Reference files
- [.github/workflows/pr-ci.yml](../../.github/workflows/pr-ci.yml)
- [docs/toolchain.md](../../docs/toolchain.md)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
