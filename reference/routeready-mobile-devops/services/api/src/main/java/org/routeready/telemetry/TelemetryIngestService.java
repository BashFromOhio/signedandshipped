package org.routeready.telemetry;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * Reference: ordering, idempotency and freshness for synthetic bus telemetry (drill 12).
 * - Duplicate event_id: accepted, no effect (idempotent).
 * - Older (boot_epoch, sequence) than the current position: stored for audit, NOT applied.
 * - observed_at outside the clock-skew allowance: rejected.
 * - Readers get is_stale = true after STALE_AFTER without a fresh observation.
 */
public final class TelemetryIngestService {
  static final Duration CLOCK_SKEW_ALLOWANCE = Duration.ofSeconds(30);
  static final Duration STALE_AFTER = Duration.ofSeconds(60);

  private final TelemetryRepository repo;
  private final Clock clock;   // injected so tests use a fake clock

  public TelemetryIngestService(TelemetryRepository repo, Clock clock) {
    this.repo = repo;
    this.clock = clock;
  }

  public Result ingest(TelemetryEvent e) {
    Instant now = clock.instant();
    if (e.observedAt().isAfter(now.plus(CLOCK_SKEW_ALLOWANCE))) return Result.REJECTED_FUTURE;

    // Unique constraint on event_id makes this insert the idempotency check (no check-then-insert race).
    if (!repo.insertIfAbsent(e, now)) return Result.DUPLICATE;

    // Conditional update: only applies when (boot_epoch, sequence) is newer than the stored position.
    boolean applied = repo.advancePositionIfNewer(e.busId(), e.bootEpoch(), e.sequence(), e);
    return applied ? Result.APPLIED : Result.STORED_NOT_APPLIED;
  }

  public boolean isStale(Instant lastObservedAt) {
    return lastObservedAt.plus(STALE_AFTER).isBefore(clock.instant());
  }

  public enum Result { APPLIED, DUPLICATE, STORED_NOT_APPLIED, REJECTED_FUTURE }
}
