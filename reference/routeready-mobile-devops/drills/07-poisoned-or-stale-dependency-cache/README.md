# Drill 7: Poisoned or stale dependency cache

**Lab:** Either · **Area:** CI

> Like you're 10: Someone ate last week's sandwich because the lunchbox wasn't labeled with the day.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, removed the lockfile hash from the cache key.

## 2. Expected symptom
Clean builds pass, warm builds fail or quietly use old dependencies.

Example (redacted) output, pr-ci #1077 · android-verify (warm):
```
Cache restored from key: gradle-Linux
> Task :app:dependencies
releaseRuntimeClasspath
+--- com.squareup.okhttp3:okhttp:4.11.0
# gradle.lockfile pins okhttp 4.12.0
e: Unresolved reference: newBuilderWithTimeout
```

## 3. Diagnose
- Leading hypothesis: The cache key lacks lockfile/toolchain inputs, so a stale dependency cache is restored
- Next command: Compare resolved dependency graphs on clean vs warm runs and read the cache restore key in the logs

## 4. Contain and fix
Key on OS, arch, toolchain and hashFiles of lockfiles and wrapper; untrusted runs don't write caches release jobs read

## 5. Verify
Deliberately change a dependency and confirm the new key misses and resolves correctly

## 6. Complication to rehearse
You learn a fork-triggered run wrote a cache that a release job later restored. → Trust boundary: release jobs must not consume caches untrusted runs can write

## 7. Senior follow-up
**Which build outputs should never be shared across trust boundaries?**

<details><summary>Strong answer</summary>

Compiled binaries, Gradle build caches, node_modules (postinstall scripts run code), signed artifacts and anything a release job will sign or ship. Untrusted jobs can read safe caches but must not write ones trusted jobs consume.
</details>

## Reference files
- [.github/workflows/pr-ci.yml](../../.github/workflows/pr-ci.yml)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
