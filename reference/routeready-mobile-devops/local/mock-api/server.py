#!/usr/bin/env python3
"""RouteReady + StayReady mock API for local labs. Python 3 standard library only.

All data is synthetic. A fake bus drives a loop; observed_at is "a few seconds ago".

Drill modes (read on EVERY request, so `local/drill.sh` can change them while the server runs):
  normal            correct behaviour
  stale             observed_at is 10 minutes old, is_stale stays false (server bug the client must catch)
  null-eta          eta_confidence is null (installed client must not crash)
  breaking-v2       renames status -> state and delay_minutes -> delay_mins (breaks old clients)
  slow              every response waits 6 seconds
  flaky-503         every other request returns 503
  tenant-header-bug StayReady trusts the X-Tenant header instead of the token (data leak)
  no-idempotency    StayReady ignores Idempotency-Key (duplicate service requests)

Mode file: .tools/api-mode   Flag overrides: .tools/flag-overrides.json
"""
import argparse
import json
import math
import os
import sys
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TOOLS = os.path.join(ROOT, ".tools")
MODE_FILE = os.path.join(TOOLS, "api-mode")
FLAG_OVERRIDES = os.path.join(TOOLS, "flag-overrides.json")
FLAGS_FILE = os.path.join(ROOT, "config", "feature-flags.json")
MODES = ["normal", "stale", "null-eta", "breaking-v2", "slow", "flaky-503", "tenant-header-bug", "no-idempotency"]

ROUTEREADY_TOKENS = {"demo-parent": {"parent": "Sam Rivera", "routes": ["r-1", "r-2"], "cohort": "beta-district-1"}}
ROUTES = {
    "r-1": {"id": "r-1", "name": "Route 1 · Maple Elementary", "stop": "Oak St & 5th Ave", "school": "Maple Elementary"},
    "r-2": {"id": "r-2", "name": "Route 7 · Cedar Middle", "stop": "Birch Rd & Pine Ct", "school": "Cedar Middle"},
}
ALERTS = [
    {"id": "a-1", "severity": "info", "title": "Early release Friday", "body": "Buses leave school at 1:15 pm this Friday."},
    {"id": "a-2", "severity": "warning", "title": "Road work on 5th Ave", "body": "Route 1 may run up to 5 minutes late this week."},
]

STAYREADY_TOKENS = {"cedar-cove-guest": "cedar-cove", "harbor-house-guest": "harbor-house"}
RESERVATIONS = {
    "cedar-cove": [{"id": "cc-101", "guest": "Alex Kim", "unit": "Cabin 3", "check_in": "2026-11-20", "check_out": "2026-11-23"}],
    "harbor-house": [{"id": "hh-204", "guest": "Jordan Lee", "unit": "Suite B", "check_in": "2026-12-02", "check_out": "2026-12-05"}],
}
service_requests = {"cedar-cove": [], "harbor-house": []}
idempotency = {}
lock = threading.Lock()
counter = {"n": 0}
LOG_PATH = None


def mode():
    try:
        with open(MODE_FILE) as f:
            m = f.read().strip()
            return m if m in MODES else "normal"
    except OSError:
        return os.environ.get("ROUTEREADY_API_MODE", "normal")


def eta_enabled_for(cohort):
    """Override file wins; otherwise the default, or ON for cohorts listed in config/feature-flags.json."""
    try:
        with open(FLAG_OVERRIDES) as f:
            ov = json.load(f)
            if "eta_confidence_enabled" in ov:
                return bool(ov["eta_confidence_enabled"])
    except (OSError, ValueError):
        pass
    try:
        with open(FLAGS_FILE) as f:
            cfg = json.load(f)
    except (OSError, ValueError):
        return False
    if cfg.get("defaults", {}).get("eta_confidence_enabled"):
        return True
    return cohort in cfg.get("cohorts", {}).get("eta_confidence_enabled", [])


def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def route_status(route_id, m):
    t = time.time()
    phase = (t / 90.0) % (2 * math.pi)  # the fake bus loops every ~9.5 minutes
    delay = max(0, round(3 + 3 * math.sin(phase)))
    observed = datetime.now(timezone.utc) - timedelta(seconds=4)
    if m == "stale":
        observed -= timedelta(minutes=10)
    body = {
        "route_id": route_id,
        "status": "DELAYED" if delay >= 3 else "ON_TIME",
        "delay_minutes": delay,
        "observed_at": iso(observed),
        "is_stale": False,
        "eta_confidence": round(0.7 + 0.25 * math.cos(phase), 2),
        "bus": {"lat": round(41.4993 + 0.01 * math.sin(phase), 5), "lng": round(-81.6944 + 0.01 * math.cos(phase), 5)},
    }
    if m == "null-eta":
        body["eta_confidence"] = None
    if m == "breaking-v2":
        body["state"] = body.pop("status").lower()
        body["delay_mins"] = body.pop("delay_minutes")
    return body


class Handler(BaseHTTPRequestHandler):
    server_version = "RouteReadyMock/1.0"

    def log_message(self, fmt, *args):  # quiet default logger; we write our own line per request
        pass

    def _send(self, code, obj, rid):
        data = json.dumps(obj, indent=2).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Request-Id", rid)
        self.end_headers()
        self.wfile.write(data)
        line = f"{datetime.now().strftime('%H:%M:%S')} {rid} {self.command} {self.path} -> {code} (mode={mode()})"
        print(line, flush=True)
        if LOG_PATH:
            with open(LOG_PATH, "a") as f:
                f.write(line + "\n")

    def _token(self):
        auth = self.headers.get("Authorization", "")
        return auth[7:].strip() if auth.startswith("Bearer ") else None

    def _common(self, rid):
        m = mode()
        if m == "slow":
            time.sleep(6)
        if m == "flaky-503":
            with lock:
                counter["n"] += 1
                if counter["n"] % 2 == 0:
                    self._send(503, {"error": "upstream_unavailable", "request_id": rid}, rid)
                    return None
        return m

    def do_GET(self):
        rid = self.headers.get("X-Request-Id") or uuid.uuid4().hex[:12]
        m = self._common(rid)
        if m is None:
            return
        path = self.path.split("?")[0].rstrip("/")
        if path in ("", "/health"):
            return self._send(200, {"ok": True, "mode": m}, rid)
        if path == "/api/v1/capabilities":
            return self._send(200, {"contract": "v1", "features": ["eta_confidence"]}, rid)
        if path.startswith("/api/v1/"):
            tok = ROUTEREADY_TOKENS.get(self._token() or "")
            if not tok:
                return self._send(401, {"error": "unauthorized", "hint": "send Authorization: Bearer demo-parent"}, rid)
            if path == "/api/v1/me":
                return self._send(200, {"name": tok["parent"], "routes": tok["routes"]}, rid)
            if path == "/api/v1/config":
                return self._send(200, {"eta_confidence_enabled": eta_enabled_for(tok["cohort"])}, rid)
            if path == "/api/v1/routes":
                return self._send(200, [ROUTES[r] for r in tok["routes"]], rid)
            if path.startswith("/api/v1/routes/") and path.endswith("/status"):
                route_id = path.split("/")[4]
                if route_id not in tok["routes"]:
                    return self._send(404, {"error": "not_found"}, rid)
                return self._send(200, route_status(route_id, m), rid)
            if path == "/api/v1/alerts":
                return self._send(200, ALERTS, rid)
        if path == "/stayready/v1/reservations":
            tenant = self._tenant(m)
            if not tenant:
                return self._send(401, {"error": "unauthorized", "hint": "Bearer cedar-cove-guest or harbor-house-guest"}, rid)
            return self._send(200, {"tenant": tenant, "reservations": RESERVATIONS[tenant]}, rid)
        if path == "/stayready/v1/service-requests":
            tenant = self._tenant(m)
            if not tenant:
                return self._send(401, {"error": "unauthorized"}, rid)
            return self._send(200, {"tenant": tenant, "service_requests": service_requests[tenant]}, rid)
        self._send(404, {"error": "not_found", "path": path}, rid)

    def _tenant(self, m):
        if m == "tenant-header-bug" and self.headers.get("X-Tenant") in RESERVATIONS:
            return self.headers.get("X-Tenant")  # BUG on purpose: identity must come from the token, never a header
        return STAYREADY_TOKENS.get(self._token() or "")

    def do_POST(self):
        rid = self.headers.get("X-Request-Id") or uuid.uuid4().hex[:12]
        m = self._common(rid)
        if m is None:
            return
        path = self.path.split("?")[0].rstrip("/")
        if path != "/stayready/v1/service-requests":
            return self._send(404, {"error": "not_found"}, rid)
        tenant = self._tenant(m)
        if not tenant:
            return self._send(401, {"error": "unauthorized"}, rid)
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except ValueError:
            return self._send(400, {"error": "invalid_json"}, rid)
        key = self.headers.get("Idempotency-Key")
        with lock:
            if m != "no-idempotency" and key and (tenant, key) in idempotency:
                return self._send(200, dict(idempotency[(tenant, key)], replayed=True), rid)
            req = {"id": "sr-" + uuid.uuid4().hex[:6], "reservation_id": body.get("reservation_id"),
                   "kind": body.get("kind", "other"), "note": str(body.get("note", ""))[:200],
                   "created_at": iso(datetime.now(timezone.utc))}
            service_requests[tenant].append(req)
            if key:
                idempotency[(tenant, key)] = req
        self._send(201, req, rid)


def main():
    global LOG_PATH
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8080)))
    ap.add_argument("--host", default="0.0.0.0", help="0.0.0.0 so the Android emulator (10.0.2.2) and a phone on your Wi-Fi can reach it")
    args = ap.parse_args()
    os.makedirs(TOOLS, exist_ok=True)
    LOG_PATH = os.path.join(TOOLS, "api.log")
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"RouteReady mock API on http://localhost:{args.port}  (emulator: http://10.0.2.2:{args.port})  mode={mode()}", flush=True)
    print("Ctrl+C to stop. Change modes with: local/drill.sh api-mode <mode>", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
        sys.exit(0)


if __name__ == "__main__":
    main()
