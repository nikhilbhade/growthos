"""Configuration for the Meta retrieval orchestration agent.

Everything here is read from the environment so no secrets live in source.
The orchestrator is a thin ADK layer: it holds no provider tokens itself and
only talks to the existing Node retrieval service, which owns credentials.
"""
from __future__ import annotations

import os

# Base URL of the Node.js GrowthOS server that exposes the read-only retrieval
# endpoints (POST /api/agents/meta/retrieve). The orchestrator calls this; it
# never touches the Meta Marketing API directly.
GROWTHOS_API_URL = os.environ.get("GROWTHOS_API_URL", "http://localhost:3000")

# While providers are not connected, retrieval runs against the Node service's
# labelled demo data. Flip to "false" once real Meta credentials are wired on
# the Node side.
GROWTHOS_DEMO = os.environ.get("GROWTHOS_DEMO", "true").lower() in ("1", "true", "yes")

# Model that drives the orchestrator's planning/answering. Defaults to a native
# Gemini model (needs GOOGLE_API_KEY or GEMINI_API_KEY). To use Claude instead,
# `pip install litellm` and set ORCHESTRATOR_MODEL="anthropic/claude-..."; the
# agent wraps non-Gemini ids in LiteLlm automatically (see agent.py).
ORCHESTRATOR_MODEL = os.environ.get("ORCHESTRATOR_MODEL", "gemini-2.5-flash")

# HTTP timeout (seconds) for calls to the Node retrieval service.
REQUEST_TIMEOUT = float(os.environ.get("GROWTHOS_REQUEST_TIMEOUT", "15"))

# The only reporting windows the Node retrieval service accepts.
ALLOWED_RANGES = ("last_7_days", "last_14_days", "last_30_days")
DEFAULT_RANGE = "last_14_days"


def normalize_range(value: str | None) -> str:
    """Coerce a model-supplied range into one the retrieval service accepts."""
    if not value:
        return DEFAULT_RANGE
    candidate = str(value).strip().lower().replace(" ", "_")
    return candidate if candidate in ALLOWED_RANGES else DEFAULT_RANGE
