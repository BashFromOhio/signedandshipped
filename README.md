# Signed & Shipped

A browser game for learning Mobile DevOps release engineering in the order it really happens, from a line of code to an app on someone's phone. Built to prepare for a Senior Mobile DevOps Engineer interview.

**Play it:** open `index.html`, or enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

## What's inside

| Path | What it is |
|---|---|
| `index.html`, `app.js`, `data.js` | The game: 7-step plan, 16-station journey, 28 quiz questions, 20 incident drills with STAR stories, 12 bug hunts, pipeline/rollback labs, diagrams, interview room |
| `repo.js` | The reference repo bundled for the in-game file browser (generated) |
| [`reference/routeready-mobile-devops/`](reference/routeready-mobile-devops/) | Reference release pipeline: GitHub Actions workflows, Fastlane lanes, release scripts, API contract, docs, and a README for each drill |

## Honest status

This is a **portfolio learning lab** with fictional organizations and synthetic data.
- The reference pipeline is a template: tool versions are `<VERIFY>` placeholders, actions need pinning to commit SHAs, and app code isn't included. Its workflows sit under `reference/`, so they don't run in this repo.
- Nothing here has been run against real App Store Connect or Google Play accounts.
- AI buttons in the game work when it's opened as a Claude artifact. On GitHub Pages they show as unavailable; everything else works.

Track real progress in [`reference/routeready-mobile-devops/docs/progress.md`](reference/routeready-mobile-devops/docs/progress.md) using IMPLEMENTED / VERIFIED / SIMULATED / BLOCKED.
