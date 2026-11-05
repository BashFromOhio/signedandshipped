# Observability

- Structured logs: `request_id`, `app_version`, `build`, `environment`, redacted `route_id`/`tenant`.
- Crash reporting (optional Sentry): upload the exact dSYMs / `mapping.txt` / source maps from the shipped build (`scripts/upload-symbols.sh`). Release = `marketing_version`, dist = build number.
- Dashboards segment by release, OS, device and feature cohort. Show sample size.
- Targets are **lab targets** (e.g. stale indicator after 60 s), not achieved results. Record hardware, workload and sample count with any measurement.
