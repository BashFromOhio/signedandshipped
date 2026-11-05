# Branch protection for `main`

- Require pull request with 1 approving review.
- Require status check **ci-gate** only (the aggregate job). Don't add individual path-filtered jobs as required.
- Require branches to be up to date, or use a merge queue (the workflow listens to `merge_group`).
- Disallow force pushes and deletions.
- Environments: `release-ios`, `release-android` (deployment branch: main only), `production` (required reviewers).
