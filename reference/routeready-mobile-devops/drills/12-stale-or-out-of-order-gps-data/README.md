# Drill 12: Stale or out-of-order GPS data

**Lab:** RouteReady · **Area:** Data

> Like you're 10: An old postcard arrives late and you think your friend went back home. And when postcards stop, you assume they're still where the last one said.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, sent sequence 102, then 99, then stopped the producer.

## 2. Expected symptom
The bus appears to move backward, or stays 'current' after updates stop.

Example (redacted) output, telemetry · bus_id=bus-12:
```
event_id=e-71a seq=102 observed_at=14:03:10Z received_at=14:03:11Z  ACCEPTED
event_id=e-6f0 seq=99  observed_at=14:02:40Z received_at=14:03:12Z  ACCEPTED (replaced current)
-- no events after 14:03:12Z --
client 14:06:30: "Bus 12 — 2 min away" (no freshness shown)
```

## 3. Diagnose
- Leading hypothesis: The server orders by received time, and the client has no freshness indicator
- Next command: Query telemetry for the bus comparing observed_at, received_at, sequence and event_id

## 4. Contain and fix
Keep the latest position by sequence/observed_at, ignore older events (stored idempotently by event_id), show 'stale' after 60s without fresh data

## 5. Verify
Fake-clock and out-of-order tests: 102 then 99 keeps 102; no events for 60s shows stale

## 6. Complication to rehearse
The producer reboots and its sequence restarts at 1. → Add a producer boot/epoch ID and order by (epoch, sequence), with observed_at and a documented clock-skew allowance as a check

## 7. Senior follow-up
**How do you handle producer reboot, sequence reset and clock skew?**

<details><summary>Strong answer</summary>

Scope sequence numbers with a boot epoch, accept a documented skew window on observed_at, record received_at for diagnosis, and flag events far outside the window rather than silently trusting or dropping them.
</details>

## Reference files
- [services/api/src/main/java/org/routeready/telemetry/TelemetryIngestService.java](../../services/api/src/main/java/org/routeready/telemetry/TelemetryIngestService.java)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
