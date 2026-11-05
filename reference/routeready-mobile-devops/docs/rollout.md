# Rollout levers

| Lever | Controls | Reaches installed apps? |
|---|---|---|
| Apple phased release | Automatic updates on Apple's fixed 7-day schedule; pausable; manual updates still allowed | No |
| Google Play staged rollout | % of users offered the update; you choose, raise, or halt | No |
| Feature flag / cohort | Who sees new behavior | **Yes** (if flags load before the code path) |
| Backend fix or revert to a compatible digest | Server behavior for every client | **Yes** |
| Replacement binary (higher build number) | The fix itself | After users update |

"Rollback" must name which lever. You can't uninstall a binary from a phone.
