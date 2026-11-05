# ADR 0002: GitHub Actions for orchestration, Fastlane for mobile logic

**Decision:** workflows stay thin (triggers, permissions, environments); build/sign/upload logic lives in Fastlane lanes and `scripts/` so it runs the same locally and could be ported to Jenkins.

**Rejected:** App Center (Build/Test/Distribute retired), running every tool at once (Jenkins + GitLab + Xcode Cloud + EAS) while learning.
