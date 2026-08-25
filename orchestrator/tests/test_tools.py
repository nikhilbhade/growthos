"""Smoke tests for the Meta orchestrator's retrieval seam.

These need no model key: they stand up a tiny HTTP server that mimics the Node
`/api/agents/meta/retrieve` endpoint, point the client at it, and verify the
tools call the right dimension, shape the response, handle the not-connected
(pending) case, normalize bad ranges, and surface service errors.

Run:  python3 -m orchestrator.tests.test_tools   (from the repo root)
  or: python3 tests/test_tools.py                (from orchestrator/)
"""
from __future__ import annotations

import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# Allow running both as a module and as a plain script.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Received requests, for assertions.
REQUESTS: list[dict] = []


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):  # silence the default stderr logging
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        REQUESTS.append({"path": self.path, "body": body})
        dimension = body.get("dimension")

        if dimension == "pending_case":
            payload = {"pending": True, "records": [], "freshness": "Pending Meta connection"}
        else:
            payload = {
                "range": body.get("range"),
                "dimension": dimension,
                "freshness": "Preview data complete through Aug 19",
                "pending": False,
                "isDemoData": True,
                "records": [
                    {"id": "meta-camp-01", "name": "Chicago Lunch Prospecting", "spend": 3200},
                    {"id": "meta-camp-02", "name": "First Order Offer", "spend": 2170},
                ],
            }
        data = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    server = HTTPServer(("127.0.0.1", 0), _Handler)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    # Point config at the mock BEFORE importing the modules that read it.
    os.environ["GROWTHOS_API_URL"] = f"http://{host}:{port}"
    os.environ["GROWTHOS_DEMO"] = "true"

    from meta_agent import config, tools
    from meta_agent.growthos_client import RetrievalServiceError, retrieve

    # 1. Each tool hits the right dimension and shapes the response.
    result = tools.retrieve_campaigns("last_7_days")
    assert result["record_count"] == 2, result
    assert result["is_demo_data"] is True
    assert result["records"][0]["name"] == "Chicago Lunch Prospecting"
    assert REQUESTS[-1]["body"]["dimension"] == "campaign"
    assert REQUESTS[-1]["body"]["range"] == "last_7_days"
    assert REQUESTS[-1]["body"]["demo"] is True
    print("PASS retrieve_campaigns: 2 demo records, correct dimension/range/demo")

    tools.retrieve_ad_sets("last_14_days")
    assert REQUESTS[-1]["body"]["dimension"] == "ad_set"
    tools.retrieve_creatives("last_14_days")
    assert REQUESTS[-1]["body"]["dimension"] == "creative"
    tools.retrieve_performance("last_14_days")
    assert REQUESTS[-1]["body"]["dimension"] == "performance"
    print("PASS ad_sets / creatives / performance map to correct dimensions")

    # 2. Bad/omitted ranges are normalized to the default.
    assert config.normalize_range("garbage") == "last_14_days"
    assert config.normalize_range("last 30 days") == "last_30_days"
    assert config.normalize_range(None) == "last_14_days"
    tools.retrieve_campaigns("not_a_real_range")
    assert REQUESTS[-1]["body"]["range"] == "last_14_days"
    print("PASS range normalization (garbage/None/spaces -> valid range)")

    # 3. Not-connected (pending) is surfaced clearly, not as fake data.
    pending = tools._shape("pending_case", "last_7_days")
    assert pending["pending"] is True and pending["record_count"] == 0
    assert "not connected" in pending["message"]
    print("PASS pending account surfaces a clear not-connected message")

    # 4. A direct client call returns the raw service JSON.
    raw = retrieve("campaign", "last_7_days")
    assert raw["isDemoData"] is True and len(raw["records"]) == 2
    print("PASS client.retrieve returns raw service JSON")

    # 5. Service errors are caught and shaped, not raised into the model loop.
    server.shutdown()
    down = tools.retrieve_campaigns("last_7_days")
    assert "error" in down and down["record_count"] == 0
    print("PASS service-down is caught and returned as an error result")

    # And the low-level client raises a typed error when the service is down.
    try:
        retrieve("campaign", "last_7_days")
        raise AssertionError("expected RetrievalServiceError")
    except RetrievalServiceError:
        print("PASS client raises RetrievalServiceError when service is down")

    print("\nALL TESTS PASSED")


if __name__ == "__main__":
    main()
