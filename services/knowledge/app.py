"""GradientOS knowledge service (milestone M3).

Read-only embedding retrieval over the grounding corpus. Stdlib-only so it runs
anywhere with Python 3 and no install step for the MVP. Narrow HTTP surface,
mirroring the Node provider microservices:

    GET  /health
    GET  /v1/capabilities
    POST /v1/search           {"query": str, "provider": "meta|tiktok|all", "k": int}

Auth: optional bearer via SERVICE_AUTH_TOKEN (same convention as services/service.js).
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from retriever import Retriever

PORT = int(os.getenv("PORT", "4200"))
AUTH_TOKEN = os.getenv("SERVICE_AUTH_TOKEN")
RETRIEVER = Retriever()


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _authorized(self) -> bool:
        if not AUTH_TOKEN:
            return True
        return self.headers.get("Authorization") == f"Bearer {AUTH_TOKEN}"

    def log_message(self, *args) -> None:  # quieter default logging
        return

    def do_GET(self) -> None:
        if not self._authorized():
            return self._send(401, {"error": "Unauthorized service request"})
        if self.path == "/health":
            return self._send(200, {"ok": True, "service": "knowledge", "version": "v1"})
        if self.path == "/v1/capabilities":
            return self._send(
                200,
                {
                    "service": "knowledge",
                    "role": "retrieval",
                    "mode": "read_only",
                    "corpusVersion": RETRIEVER.version,
                    "embedder": RETRIEVER.embedder.name,
                    "index": RETRIEVER.index.kind,
                    "documentCount": len(RETRIEVER.documents),
                },
            )
        return self._send(404, {"error": "Route not found"})

    def do_POST(self) -> None:
        if not self._authorized():
            return self._send(401, {"error": "Unauthorized service request"})
        if self.path != "/v1/search":
            return self._send(404, {"error": "Route not found"})
        length = int(self.headers.get("Content-Length", "0") or "0")
        try:
            body = json.loads(self.rfile.read(length) or "{}")
        except json.JSONDecodeError:
            body = {}
        query = body.get("query", "")
        if not query:
            return self._send(400, {"error": "query is required"})
        results = RETRIEVER.search(
            query=query, provider=body.get("provider", "all"), k=int(body.get("k", 3))
        )
        return self._send(200, {"query": query, "provider": body.get("provider", "all"), "results": results})


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"knowledge service listening on {PORT} "
          f"(corpus {RETRIEVER.version}, embedder {RETRIEVER.embedder.name})")
    server.serve_forever()


if __name__ == "__main__":
    main()
