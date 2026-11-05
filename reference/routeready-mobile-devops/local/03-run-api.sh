#!/usr/bin/env bash
# Level 03 · Run the backend locally: the RouteReady + StayReady mock API (MOB-105/106, Sprint 1).
#   local/03-run-api.sh          run in this terminal (Ctrl+C stops it) - best for watching requests
#   local/03-run-api.sh --bg     run in the background (log: .tools/api.log)
#   local/03-run-api.sh --stop   stop the background server
#   local/03-run-api.sh --check  smoke test + old-client contract check against the running server
. "$(dirname "$0")/lib.sh"
banner "Level 03" "Run the API and prove old apps still work" "MOB-106" "Sprint 1" "★☆☆☆☆"
need python3; need curl
PORT="${PORT:-8080}"; PIDF="$RR_TOOLS/api.pid"
running() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

case "${1:-}" in
  --stop)
    if running; then kill "$(cat "$PIDF")"; rm -f "$PIDF"; ok "API stopped"; else say "API isn't running"; fi; exit 0;;
  --bg)
    if running; then ok "API already running (pid $(cat "$PIDF"))"; else
      nohup python3 "$RR_ROOT/local/mock-api/server.py" --port "$PORT" >> "$RR_TOOLS/api.log" 2>&1 &
      echo $! > "$PIDF"; sleep 1; running || die "API failed to start. See .tools/api.log (is port $PORT busy? try PORT=8081)"
      ok "API running in background (pid $(cat "$PIDF")) → http://localhost:$PORT"; fi
    set -- --check;;
esac

if [ "${1:-}" = "--check" ]; then
  step "Smoke test"
  curl -fsS "http://localhost:$PORT/health" >/dev/null || die "Nothing answering on http://localhost:$PORT. Start it: local/03-run-api.sh --bg"
  ok "/health"
  curl -fsS -H "Authorization: Bearer demo-parent" "http://localhost:$PORT/api/v1/routes/r-1/status"; echo
  step "Old-client contract check (would this break installed apps?)"
  API="http://localhost:$PORT" python3 "$RR_ROOT/local/mock-api/check_contract.py"
  done_level "level-03"; exit 0
fi

step "Starting in this terminal. Open a SECOND terminal for the next levels."
say "Try:  curl -H 'Authorization: Bearer demo-parent' http://localhost:$PORT/api/v1/routes/r-1/status"
exec python3 "$RR_ROOT/local/mock-api/server.py" --port "$PORT"
