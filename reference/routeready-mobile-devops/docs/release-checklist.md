# Release checklist

- [ ] Backend additive change deployed by digest; previous + current client contract tests green
- [ ] New behavior behind a flag, default OFF
- [ ] `release preflight` passed (trusted commit, app ID, build number, environment, settings)
- [ ] Build number allocated (no reuse), signed artifact checksummed into the manifest
- [ ] Symbols retained (dSYM / mapping / source maps) with retention > support window
- [ ] Uploaded → processing → testers available (each recorded separately)
- [ ] Production candidate's compiled config points at production
- [ ] Approval recorded on the `production` environment
- [ ] Rollout plan: phased (iOS) / staged % (Android), flag cohort, dashboards ready
- [ ] Runbook owner on call
