# routeready-mobile-devops (reference)

Reference repository for the **Signed & Shipped** Mobile DevOps training game and the *Mobile DevOps Portfolio and Interview Playbook*.
It shows what each stage of a mobile release pipeline looks like as real files: GitHub Actions workflows, Fastlane lanes, release scripts, contracts, docs and drill write-ups.

**What this is:** a starting point you clone, read and fill in.
**What this is not:** a finished app or a verified pipeline. App code isn't included, tool versions are `<VERIFY>` placeholders, and action SHAs are `<pin-full-commit-sha>` placeholders. Nothing here has been run against real store accounts. See [docs/progress.md](docs/progress.md).

RouteReady (SwiftUI + Kotlin + Spring Boot) is the main lab. Key StayReady (React Native + FastAPI) snippets live in `stayready/` for the tenant, idempotency and OTA drills.

## Quick start
1. Clone it: `git clone <your-repo-url> routeready-mobile-devops`
2. Fill [docs/toolchain.md](docs/toolchain.md) from official compatibility docs, then replace every `<VERIFY>` and pin every action to a full commit SHA.
3. Create the allocator branch: `git switch --orphan build-numbers && echo '{}' > allocations.json && git add . && git commit -m init && git push -u origin build-numbers`
4. Set up branch protection and environments: [docs/branch-protection.md](docs/branch-protection.md).
5. Add your app projects under `apps/ios` and `apps/android`, then run `bundle exec fastlane ios verify destination:"$(./scripts/pick-simulator.sh)"`.
6. Track every milestone as IMPLEMENTED / VERIFIED / SIMULATED / BLOCKED in [docs/progress.md](docs/progress.md).

## The Journey, file by file (code → customer)
| # | Station | Phase | Reference files |
|---|---|---|---|
| 1 | Pin the toolchain | Build | [docs/toolchain.md](docs/toolchain.md)<br>[scripts/print-toolchain.sh](scripts/print-toolchain.sh)<br>[scripts/pick-simulator.sh](scripts/pick-simulator.sh)<br>[Gemfile](Gemfile) |
| 2 | Branch small, hide unfinished work | Build | [docs/adr/0001-trunk-based-development.md](docs/adr/0001-trunk-based-development.md)<br>[config/feature-flags.json](config/feature-flags.json)<br>[docs/branch-protection.md](docs/branch-protection.md) |
| 3 | Pull request CI (untrusted) | Build | [.github/workflows/pr-ci.yml](.github/workflows/pr-ci.yml)<br>[fastlane/Fastfile](fastlane/Fastfile) |
| 4 | Required check, review, merge | Build | [scripts/gate.sh](scripts/gate.sh)<br>[.github/workflows/pr-ci.yml](.github/workflows/pr-ci.yml)<br>[docs/branch-protection.md](docs/branch-protection.md) |
| 5 | Trusted main build + staging | Integrate | [.github/workflows/main.yml](.github/workflows/main.yml)<br>[scripts/deploy-staging.sh](scripts/deploy-staging.sh)<br>[scripts/smoke.sh](scripts/smoke.sh)<br>[infra/docker-compose.yml](infra/docker-compose.yml) |
| 6 | Backend first, additive only | Integrate | [contracts/openapi.yaml](contracts/openapi.yaml)<br>[contracts/fixtures/v1.3/route-status.json](contracts/fixtures/v1.3/route-status.json)<br>[scripts/contract-check.sh](scripts/contract-check.sh)<br>[services/api/db/migrations/README.md](services/api/db/migrations/README.md) |
| 7 | Release preflight + build number | Package | [scripts/release-preflight.sh](scripts/release-preflight.sh)<br>[scripts/allocate-build-number.sh](scripts/allocate-build-number.sh)<br>[config/apps.json](config/apps.json) |
| 8 | Sign and package | Package | [fastlane/Fastfile](fastlane/Fastfile)<br>[fastlane/Matchfile](fastlane/Matchfile)<br>[scripts/signing-preflight-ios.sh](scripts/signing-preflight-ios.sh)<br>[apps/android/app/signing.gradle.kts](apps/android/app/signing.gradle.kts)<br>[scripts/verify-upload-cert.sh](scripts/verify-upload-cert.sh) |
| 9 | Release manifest + artifacts | Package | [scripts/write-manifest.sh](scripts/write-manifest.sh)<br>[evidence/release-manifest.schema.json](evidence/release-manifest.schema.json)<br>[scripts/verify-manifest.sh](scripts/verify-manifest.sh) |
| 10 | Beta upload | Release | [.github/workflows/release-ios.yml](.github/workflows/release-ios.yml)<br>[.github/workflows/release-android.yml](.github/workflows/release-android.yml)<br>[scripts/record-state.sh](scripts/record-state.sh) |
| 11 | Validate the production candidate | Release | [scripts/preflight-env.sh](scripts/preflight-env.sh)<br>[config/apps.json](config/apps.json) |
| 12 | Approval gate + store review | Release | [.github/workflows/promote.yml](.github/workflows/promote.yml)<br>[docs/release-checklist.md](docs/release-checklist.md) |
| 13 | Phased / staged rollout + feature cohorts | Release | [docs/rollout.md](docs/rollout.md)<br>[config/feature-flags.json](config/feature-flags.json) |
| 14 | Observe with the right symbols | Operate | [docs/observability.md](docs/observability.md)<br>[scripts/upload-symbols.sh](scripts/upload-symbols.sh) |
| 15 | Respond: contain, fix, verify | Operate | [docs/incident-runbook.md](docs/incident-runbook.md)<br>[docs/rollout.md](docs/rollout.md) |
| 16 | Write it up, prevent it | Operate | [drills/_template/incident.md](drills/_template/incident.md)<br>[evidence/README.md](evidence/README.md)<br>[docs/progress.md](docs/progress.md) |

## Drills
| # | Drill | Lab | Priority |
|---|---|---|---|
| 1 | [iOS provisioning mismatch](drills/01-ios-provisioning-mismatch/README.md) | RouteReady | ★ |
| 2 | [Locked CI keychain](drills/02-locked-ci-keychain/README.md) | RouteReady |  |
| 3 | [Wrong Android upload key](drills/03-wrong-android-upload-key/README.md) | Either | ★ |
| 4 | [Duplicate build numbers](drills/04-duplicate-build-numbers/README.md) | Either | ★ |
| 5 | [Runner/toolchain drift](drills/05-runner-toolchain-drift/README.md) | RouteReady |  |
| 6 | [Gradle/JDK incompatibility](drills/06-gradle-jdk-incompatibility/README.md) | Either |  |
| 7 | [Poisoned or stale dependency cache](drills/07-poisoned-or-stale-dependency-cache/README.md) | Either |  |
| 8 | [Flaky UI test](drills/08-flaky-ui-test/README.md) | RouteReady |  |
| 9 | [Required check stuck pending](drills/09-required-check-stuck-pending/README.md) | Either |  |
| 10 | [Secret exposure through a PR](drills/10-secret-exposure-through-a-pr/README.md) | Either | ★ |
| 11 | [API breaks an installed client](drills/11-api-breaks-an-installed-client/README.md) | RouteReady | ★ |
| 12 | [Stale or out-of-order GPS data](drills/12-stale-or-out-of-order-gps-data/README.md) | RouteReady |  |
| 13 | [Backend readiness and bad rollout](drills/13-backend-readiness-and-bad-rollout/README.md) | RouteReady |  |
| 14 | [Destructive database migration](drills/14-destructive-database-migration/README.md) | Either |  |
| 15 | [Store processing or review delay](drills/15-store-processing-or-review-delay/README.md) | Either |  |
| 16 | [Crash increase after rollout](drills/16-crash-increase-after-rollout/README.md) | Either | ★ |
| 17 | [Wrong environment or tenant config](drills/17-wrong-environment-or-tenant-config/README.md) | StayReady |  |
| 18 | [Offline duplicate service request](drills/18-offline-duplicate-service-request/README.md) | StayReady |  |
| 19 | [Crash report lacks usable symbols](drills/19-crash-report-lacks-usable-symbols/README.md) | StayReady |  |
| 20 | [Incompatible OTA update / unsafe AI change](drills/20-incompatible-ota-update-unsafe-ai-change/README.md) | StayReady |  |

## Secrets and settings (names only)
| Name | Where | Used by |
|---|---|---|
| `MATCH_GIT_URL`, `MATCH_PASSWORD`, `MATCH_GIT_BASIC_AUTHORIZATION` | env `release-ios` | package lane (readonly match) |
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_BASE64` | env `release-ios`, `production` | beta + promote |
| `UPLOAD_KEYSTORE_BASE64`, `UPLOAD_STORE_PASSWORD`, `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD` | env `release-android` | package lane |
| `EXPECTED_UPLOAD_CERT_SHA256` (variable) | env `release-android` | upload-key preflight |
| `PLAY_JSON_KEY` | env `release-android`, `production` | beta + promote |

PR workflows never see any of these.

## Using Claude here
API key or workload identity federation? See [docs/claude-api-auth.md](docs/claude-api-auth.md).
