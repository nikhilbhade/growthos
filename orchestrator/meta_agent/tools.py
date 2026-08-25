"""Read-only retrieval tools exposed to the ADK orchestrator.

Every tool here is a plain function that ADK auto-wraps as a FunctionTool. They
are ALL read-only: each just forwards a dimension to the Node retrieval service
and shapes the response for the model. There is deliberately no tool that
creates, edits, pauses, or reallocates anything on Meta — the orchestrator
cannot mutate provider state because no such tool exists.
"""
from __future__ import annotations

from typing import Any

from . import config
from .growthos_client import RetrievalServiceError, retrieve

_RANGE_DOC = (
    "Reporting window. One of: 'last_7_days', 'last_14_days', 'last_30_days'. "
    "Defaults to 'last_14_days' if omitted or unrecognized."
)


def _shape(dimension: str, time_range: str) -> dict[str, Any]:
    """Run one retrieval and compress it into a model-friendly result."""
    try:
        result = retrieve(dimension=dimension, time_range=time_range)
    except RetrievalServiceError as error:
        return {"error": str(error), "records": [], "record_count": 0}

    if result.get("pending"):
        return {
            "pending": True,
            "record_count": 0,
            "records": [],
            "message": (
                "The Meta account is not connected to GrowthOS yet, so no records "
                "could be read. The account must be authorized and its first sync "
                "validated before any data is available."
            ),
        }

    records = result.get("records", []) or []
    return {
        "pending": False,
        "range": result.get("range"),
        "freshness": result.get("freshness"),
        "is_demo_data": result.get("isDemoData", False),
        "record_count": len(records),
        "records": records,
    }


def retrieve_campaigns(time_range: str = config.DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta campaign records (name, status, spend, impressions,
    clicks, conversions, budget, attribution window) for a reporting window.

    Args:
        time_range: %s
    """ % _RANGE_DOC
    return _shape("campaign", time_range)


def retrieve_ad_sets(time_range: str = config.DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta ad sets (audience, placement, spend, budget) for a
    reporting window.

    Args:
        time_range: %s
    """ % _RANGE_DOC
    return _shape("ad_set", time_range)


def retrieve_creatives(time_range: str = config.DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta creative/ad records (format, placement, spend) for
    a reporting window.

    Args:
        time_range: %s
    """ % _RANGE_DOC
    return _shape("creative", time_range)


def retrieve_performance(time_range: str = config.DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta aggregate performance (spend, impressions, clicks,
    conversions) for a reporting window.

    Args:
        time_range: %s
    """ % _RANGE_DOC
    return _shape("performance", time_range)


META_TOOLS = [retrieve_campaigns, retrieve_ad_sets, retrieve_creatives, retrieve_performance]
