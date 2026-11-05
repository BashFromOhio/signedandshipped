# Drill 13: Backend readiness and bad rollout

**Lab:** RouteReady · **Area:** Backend

> Like you're 10: A student says 'I'm ready!' before finding their pencil. The teacher calls on them anyway.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, made the container report healthy before its database pool was ready.

## 2. Expected symptom
The deployment passes, but mobile requests fail intermittently for minutes.

Example (redacted) output, routeready-api · rollout:
```
pod api-7d9f ready=true after 3s
HikariPool-1 - Connection is not available, request timed out after 30000ms.
GET /api/v1/routes/r-2/status 503 (x214 in 4m)
readinessProbe: GET /actuator/health/liveness
```

## 3. Diagnose
- Leading hypothesis: Readiness reports ready before the DB pool is usable (it's pointed at the liveness endpoint)
- Next command: Compare liveness vs readiness endpoint behavior and pod events with kubectl describe

## 4. Contain and fix
Readiness includes required dependencies, liveness doesn't; bounded startup; revert to the previous compatible digest if needed

## 5. Verify
During a controlled DB outage, pods go unready and receive no traffic, but aren't restarted

## 6. Complication to rehearse
Someone adds the database check to the liveness probe 'to be safe'. → Every pod fails liveness and restarts, turning a short blip into a full outage

## 7. Senior follow-up
**When would a liveness restart make an outage worse?**

<details><summary>Strong answer</summary>

When the cause is external, like a slow database. Restarting all pods at once drops in-flight work, causes cold starts and a thundering herd on reconnect, and adds downtime without fixing anything.
</details>

## Reference files
- [infra/docker-compose.yml](../../infra/docker-compose.yml)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
