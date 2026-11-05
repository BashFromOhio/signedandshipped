# ADR 0001: Trunk-based development with feature flags

**Status:** accepted · **Context:** small team, mobile + backend in one repo.

**Decision:** short-lived branches into protected `main`; unfinished behavior behind flags defaulting OFF; no permanent `develop` branch.

**Consequences:** `main` is always releasable but never automatically released to stores. Releases are explicit workflow runs.
