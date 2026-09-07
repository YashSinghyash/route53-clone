#!/usr/bin/env python3
"""
End-to-end smoke test for the Route53 clone backend.
Run the server first: uvicorn app.main:app --reload
Then:                  python test_flow.py
"""

import sys
import requests

BASE = "http://localhost:8000/api"
PASS, FAIL = "\033[92mPASS\033[0m", "\033[91mFAIL\033[0m"

results = []


def check(label, condition, extra=""):
    status = PASS if condition else FAIL
    print(f"[{status}] {label}" + (f"  -> {extra}" if extra and not condition else ""))
    results.append(condition)
    return condition


def main():
    s = requests.Session()

    # ---------- AUTH ----------
    r = s.post(f"{BASE}/auth/login", json={"username": "yash", "password": "wrongpass"})
    check("Login with wrong password -> 401", r.status_code == 401, r.text)

    r = s.post(f"{BASE}/auth/login", json={"username": "yash", "password": "password123"})
    check("Login with correct credentials -> 200", r.status_code == 200, r.text)
    if r.status_code != 200:
        print("Cannot continue without a valid token. Aborting.")
        sys.exit(1)
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(f"{BASE}/auth/me")
    check("GET /auth/me without token -> 401", r.status_code == 401, r.text)

    r = s.get(f"{BASE}/auth/me", headers=headers)
    check("GET /auth/me with token -> 200", r.status_code == 200, r.text)

    # ---------- HOSTED ZONES ----------
    r = s.post(f"{BASE}/hosted-zones", headers=headers,
               json={"name": "example.com", "comment": "test zone"})
    ok = check("Create hosted zone -> 200/201", r.status_code in (200, 201), r.text)
    if not ok:
        print("Aborting: cannot continue without a valid zone. See error body above.")
        print(f"\n{sum(results)}/{len(results)} checks passed")
        sys.exit(1)
    zone = r.json()
    zone_id = zone.get("id") or zone.get("zone", {}).get("id")
    check("New zone has 2 default records", zone.get("record_count") == 2, str(zone))

    r = s.post(f"{BASE}/hosted-zones", headers=headers, json={"name": "example.com"})
    check("Duplicate zone name -> 409", r.status_code == 409, r.text)

    r = s.get(f"{BASE}/hosted-zones", headers=headers, params={"search": "example"})
    check("Search hosted zones finds it", r.status_code == 200 and r.json().get("count", 0) >= 1, r.text)

    r = s.put(f"{BASE}/hosted-zones/{zone_id}", headers=headers, json={"comment": "updated comment"})
    check("Update hosted zone comment", r.status_code == 200 and r.json().get("comment") == "updated comment", r.text)

    # ---------- DNS RECORDS ----------
    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "www.example.com.", "type": "A", "value": "1.2.3.4", "ttl": 300})
    check("Create valid A record -> 200/201", r.status_code in (200, 201), r.text)
    a_record = r.json()
    a_id = a_record.get("id")

    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "bad.example.com.", "type": "A", "value": "999.999.1.1"})
    check("Invalid IPv4 -> 400", r.status_code == 400, r.text)

    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "cname.example.com.", "type": "CNAME", "value": "example.com."})
    check("Create CNAME record", r.status_code in (200, 201), r.text)

    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "cname.example.com.", "type": "A", "value": "1.1.1.1"})
    check("A record conflicting with existing CNAME -> 409", r.status_code == 409, r.text)

    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "example.com.", "type": "MX", "value": "10 mail.example.com."})
    check("Create valid MX record", r.status_code in (200, 201), r.text)

    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "_sip._tcp.example.com.", "type": "SRV", "value": "10 5 not-a-port sip.example.com."})
    check("Invalid SRV (bad port) -> 400", r.status_code == 400, r.text)

    r = s.post(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers,
               json={"name": "example.com.", "type": "CAA", "value": "0 issue letsencrypt.org"})
    check("Create valid CAA record", r.status_code in (200, 201), r.text)

    r = s.get(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers, params={"type": "MX"})
    check("Filter records by type=MX", r.status_code == 200 and r.json().get("count", 0) == 1, r.text)

    r = s.get(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers, params={"search": "www"})
    check("Search records by name", r.status_code == 200 and r.json().get("count", 0) >= 1, r.text)

    r = s.put(f"{BASE}/records/{a_id}", headers=headers, json={"value": "5.6.7.8", "ttl": 600})
    check("Update A record value/ttl", r.status_code == 200 and r.json().get("value") == "5.6.7.8", r.text)

    r = s.delete(f"{BASE}/records/{a_id}", headers=headers)
    check("Delete A record", r.status_code in (200, 204), r.text)

    # ---------- CASCADE DELETE ----------
    r = s.delete(f"{BASE}/hosted-zones/{zone_id}", headers=headers)
    check("Delete hosted zone", r.status_code in (200, 204), r.text)

    r = s.get(f"{BASE}/hosted-zones/{zone_id}", headers=headers)
    check("Deleted zone now 404", r.status_code == 404, r.text)

    r = s.get(f"{BASE}/hosted-zones/{zone_id}/records", headers=headers)
    check("Records under deleted zone gone/404", r.status_code == 404, r.text)

    # ---------- SUMMARY ----------
    total = len(results)
    passed = sum(results)
    print(f"\n{passed}/{total} checks passed")
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
