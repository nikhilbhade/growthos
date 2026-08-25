"""Read-only retrieval tools for the Meta and TikTok analyst agents.

These are the ONLY actions the agents can take. Every function reads account
records for one object and one reporting window and returns them as plain data;
there is deliberately no tool that mutates anything, which is the code-level
half of the read-only guarantee the prompts state.

For now the tools serve preview/demo records that mirror lib/agents (so the ADK
agents are runnable offline before OAuth-backed Marketing API access is wired
in). Real retrieval will replace the demo bodies without changing the tool
signatures the model sees.
"""

from __future__ import annotations

from typing import Any

RANGES = ("last_7_days", "last_14_days", "last_30_days")
_DEFAULT_RANGE = "last_14_days"

_META_DEMO: dict[str, list[dict[str, Any]]] = {
    "campaign": [
        {"id": "meta-camp-01", "name": "Chicago Lunch Prospecting", "platform": "Facebook + Instagram", "status": "ACTIVE", "spend": 3200, "impressions": 230600, "clicks": 4150, "conversions": 170, "budget": 4000, "attribution_window": "7-day click / 1-day view"},
        {"id": "meta-camp-02", "name": "First Order Offer", "platform": "Instagram", "status": "ACTIVE", "spend": 2170, "impressions": 168200, "clicks": 2910, "conversions": 142, "budget": 2800, "attribution_window": "7-day click / 1-day view"},
    ],
    "ad_set": [
        {"id": "meta-adset-01", "name": "3-mile lunch radius · 18–44", "parent_campaign": "Chicago Lunch Prospecting", "status": "ACTIVE", "spend": 1860, "audience": "Advantage+ audience", "placement": "Instagram Feed + Reels", "budget": 2200, "attribution_window": "7-day click / 1-day view"},
        {"id": "meta-adset-02", "name": "Lookalike · prior purchasers", "parent_campaign": "Chicago Lunch Prospecting", "status": "ACTIVE", "spend": 1340, "audience": "2% purchaser lookalike", "placement": "Facebook + Instagram", "budget": 1800, "attribution_window": "7-day click / 1-day view"},
    ],
    "creative": [
        {"id": "meta-creative-01", "name": "Lunch bowl · 15s vertical video", "parent_campaign": "Chicago Lunch Prospecting", "status": "ACTIVE", "spend": 2120, "format": "9:16 video", "placement": "Instagram Reels", "attribution_window": "7-day click / 1-day view"},
        {"id": "meta-creative-02", "name": "First order · $10 off carousel", "parent_campaign": "First Order Offer", "status": "ACTIVE", "spend": 1720, "format": "4-card carousel", "placement": "Instagram Feed", "attribution_window": "7-day click / 1-day view"},
    ],
}

_TIKTOK_DEMO: dict[str, list[dict[str, Any]]] = {
    "campaign": [
        {"id": "tiktok-camp-01", "name": "Lunch Near You", "platform": "TikTok", "status": "ACTIVE", "spend": 2940, "impressions": 276400, "clicks": 6120, "conversions": 207, "budget": 3080, "attribution_window": "7-day click / 1-day view"},
        {"id": "tiktok-camp-02", "name": "First Order Offer", "platform": "TikTok", "status": "ACTIVE", "spend": 2180, "impressions": 192800, "clicks": 4240, "conversions": 143, "budget": 2240, "attribution_window": "7-day click / 1-day view"},
    ],
    "ad_set": [
        {"id": "tiktok-adgroup-01", "name": "Foodies · 3-mile radius", "parent_campaign": "Lunch Near You", "status": "ACTIVE", "spend": 1670, "audience": "Broad food audience", "placement": "TikTok For You feed", "budget": 1750, "attribution_window": "7-day click / 1-day view"},
        {"id": "tiktok-adgroup-02", "name": "18–34 · city lunch", "parent_campaign": "Lunch Near You", "status": "ACTIVE", "spend": 1270, "audience": "Interest layer", "placement": "TikTok For You feed", "budget": 1330, "attribution_window": "7-day click / 1-day view"},
    ],
    "creative": [
        {"id": "tiktok-creative-01", "name": "Bowl build · creator cut", "parent_campaign": "Lunch Near You", "status": "ACTIVE", "spend": 1360, "format": "9:16 Spark Ad", "placement": "TikTok For You feed", "attribution_window": "7-day click / 1-day view"},
        {"id": "tiktok-creative-02", "name": "Street interview · 12s", "parent_campaign": "First Order Offer", "status": "ACTIVE", "spend": 940, "format": "9:16 video", "placement": "TikTok For You feed", "attribution_window": "7-day click / 1-day view"},
    ],
}

_DEMO = {"meta": _META_DEMO, "tiktok": _TIKTOK_DEMO}
_FRESHNESS = "Preview data complete through Aug 19"


def _normalize_range(reporting_window: str | None) -> str:
    return reporting_window if reporting_window in RANGES else _DEFAULT_RANGE


def _retrieve(provider: str, dimension: str, reporting_window: str | None) -> dict[str, Any]:
    """Shared read-only body. Real OAuth-backed retrieval will replace the demo
    lookup here; the returned envelope stays the same so the agents don't change."""
    window = _normalize_range(reporting_window)
    records = _DEMO[provider].get(dimension if dimension != "performance" else "campaign", [])
    return {
        "provider": provider,
        "dimension": dimension,
        "reporting_window": window,
        "freshness": _FRESHNESS,
        "is_demo_data": True,
        "record_count": len(records),
        "records": records,
    }


# --- Meta tools ------------------------------------------------------------

def retrieve_meta_campaigns(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta Ads campaign records (name, status, spend,
    impressions, clicks, conversions, budget, attribution window) for a
    reporting window ("last_7_days" | "last_14_days" | "last_30_days")."""
    return _retrieve("meta", "campaign", reporting_window)


def retrieve_meta_ad_sets(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta Ads ad-set records (audience, placement, spend,
    budget, attribution window) for a reporting window."""
    return _retrieve("meta", "ad_set", reporting_window)


def retrieve_meta_ads(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta Ads ad/creative records (format, placement,
    spend) for a reporting window."""
    return _retrieve("meta", "creative", reporting_window)


def retrieve_meta_performance(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only Meta Ads aggregate performance (spend, impressions,
    clicks, platform-attributed conversions) for a reporting window."""
    return _retrieve("meta", "performance", reporting_window)


# --- TikTok tools ----------------------------------------------------------

def retrieve_tiktok_campaigns(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only TikTok Ads campaign records (name, status, spend,
    impressions, clicks, conversions, budget, attribution window) for a
    reporting window ("last_7_days" | "last_14_days" | "last_30_days")."""
    return _retrieve("tiktok", "campaign", reporting_window)


def retrieve_tiktok_ad_groups(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only TikTok Ads ad-group records (audience, placement,
    spend, budget, attribution window) for a reporting window."""
    return _retrieve("tiktok", "ad_set", reporting_window)


def retrieve_tiktok_ads(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only TikTok Ads ad/creative records (format including Spark
    Ads, placement, spend) for a reporting window."""
    return _retrieve("tiktok", "creative", reporting_window)


def retrieve_tiktok_performance(reporting_window: str = _DEFAULT_RANGE) -> dict[str, Any]:
    """Retrieve read-only TikTok Ads aggregate performance (spend, impressions,
    clicks, platform-attributed conversions) for a reporting window."""
    return _retrieve("tiktok", "performance", reporting_window)


META_TOOLS = [
    retrieve_meta_campaigns,
    retrieve_meta_ad_sets,
    retrieve_meta_ads,
    retrieve_meta_performance,
]

TIKTOK_TOOLS = [
    retrieve_tiktok_campaigns,
    retrieve_tiktok_ad_groups,
    retrieve_tiktok_ads,
    retrieve_tiktok_performance,
]
