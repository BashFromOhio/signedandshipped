#!/usr/bin/env python3
"""Old-client contract check (MOB-106, drill 11).

Calls the running API and checks that every field the INSTALLED clients decode is still there
with the same JSON type. Fixtures in contracts/fixtures/<version>/ are the recorded shapes.
Exit 0 = every installed version still works. Exit 1 = you would break someone's phone.
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = os.environ.get("API", "http://localhost:8080")


def jtype(v):
    if v is None:
        return "null"
    return {bool: "boolean", int: "number", float: "number", str: "string", list: "array", dict: "object"}[type(v)]


def get(path):
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer demo-parent"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def main():
    try:
        live = get("/api/v1/routes/r-1/status")
    except Exception as e:  # noqa: BLE001 - beginner-friendly message
        print(f"Can't reach the API at {BASE} ({e}). Start it: local/03-run-api.sh --bg")
        return 2
    failed = False
    for version in sorted(os.listdir(os.path.join(ROOT, "contracts", "fixtures"))):
        fx = json.load(open(os.path.join(ROOT, "contracts", "fixtures", version, "route-status.json")))
        problems = []
        for key, val in fx.items():
            if key.startswith("_"):
                continue
            if key not in live:
                problems.append(f"missing field '{key}'")
            elif jtype(live[key]) != jtype(val) and not (jtype(live[key]) == "null" and key == "eta_confidence"):
                problems.append(f"'{key}' changed type {jtype(val)} -> {jtype(live[key])}")
        if key_problem := [p for p in problems]:
            failed = True
            print(f"FAIL  app {version}: " + "; ".join(key_problem))
        else:
            print(f"PASS  app {version}: every field it reads is still there")
    if failed:
        print("\nThis API change would break installed apps. Make it additive (add new fields, keep old ones).")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
