# Level 09 · Run the CI lane locally with Fastlane

**Difficulty** ★★★☆☆ · **Time** 20–30 min · **Sprint** 2–3 · **Ticket** MOB-103

## The story
Dana: *"If CI fails and you can't reproduce it locally, you're guessing. Our workflows call Fastlane lanes. Run the same lane on your machine."*

## Like I'm 10
Fastlane is a recipe card the robot chef (CI) follows. If you follow the same card at home, you get the same cake, and if it burns you can see exactly which step burned it.

## Before you start
Fastlane is a Ruby program. The kit installs the **gems** inside the repo (`vendor/bundle`), but Ruby itself must exist:
- **macOS:** `brew install ruby`, or use rbenv. Avoid the old system Ruby.
- **Ubuntu/WSL:** `sudo apt-get install -y ruby-full build-essential`

This is the one level that needs something installed outside `.tools/`. The guide says so plainly so you can mark it accurately.

## Run it
```bash
local/09-fastlane.sh
```

## What happens, step by step
1. `bundle config set --local path vendor/bundle` keeps gems inside the project.
2. `bundle install` installs fastlane and writes **`Gemfile.lock`**. **Commit it**, so CI installs the exact same versions (MOB-101).
3. `bundle exec fastlane android verify` runs the lane in `fastlane/Fastfile`: `gradle(project_dir: "apps/android", tasks: ["lint", "testDebugUnitTest", "assembleDebug"])`.
4. On a Mac with the Xcode project generated (Level 10), it also runs `fastlane ios verify` on a simulator picked by `scripts/pick-simulator.sh`. That needs `jq`: `brew install jq`.

## Done when
`fastlane android verify` ends with `fastlane.tools finished successfully 🎉`.

## When it breaks
| You see | Why | Fix |
|---|---|---|
| `Could not find gem 'fastlane'` | Ran `fastlane` directly | Always use `bundle exec fastlane …` |
| Native extension build failed | Missing compilers | Ubuntu: `build-essential`; macOS: `xcode-select --install` |
| Lane passes locally, fails in CI | Different toolchain or environment | Compare `scripts/print-toolchain.sh` output from both |

## Interview angle
**Q: "Why Fastlane if GitHub Actions can run Gradle directly?"**
Lanes give one command that works the same locally and in CI. Workflow YAML stays thin, and you can reproduce any CI step on your laptop. The YAML decides *when* and with *which secrets*. The lane decides *how*.

**Next:** [Level 10](level-10.md) (Mac) or [Level 11](level-11.md)
