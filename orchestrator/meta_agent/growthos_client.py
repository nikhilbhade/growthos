"""HTTP client to the Node.js GrowthOS retrieval service.

This is the seam of the hybrid architecture: the ADK orchestrator (Python) does
not implement provider retrieval itself. It calls the existing Node agent, which
owns the read-only tool surface and (later) the Meta Marketing API credentials.
Keeping retrieval in one place means the guardrails, memory, and evals already
built in Node stay authoritative.
"""
from __future__ import annotations

from typing import Any

import httpx

from . import config


class RetrievalServiceError(RuntimeError):
    """Raised when the Node retrieval service cannot be reached or errors."""


def retrieve(dimension: str, time_range: str, demo: bool | None = None,
             base_url: str | None = None) -> dict[str, Any]:
    """Call POST /api/agents/meta/retrieve on the Node service and return its JSON.

    The Node endpoint returns:
      { agent, range, dimension, retrievedAt, freshness, pending, isDemoData, records }
    """
    url = f"{(base_url or config.GROWTHOS_API_URL).rstrip('/')}/api/agents/meta/retrieve"
    payload = {
        "range": config.normalize_range(time_range),
        "dimension": dimension,
        "demo": config.GROWTHOS_DEMO if demo is None else bool(demo),
    }
    try:
        response = httpx.post(url, json=payload, timeout=config.REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as error:
        raise RetrievalServiceError(
            f"Meta retrieval service call failed ({url}): {error}"
        ) from error
