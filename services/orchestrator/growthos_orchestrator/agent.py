"""ADK entrypoint. `adk run` / `adk web` discover the module-level `root_agent`.

Default root is the orchestrator, which routes to the Meta and TikTok read-only
data analysts. The digital-marketing judge and the analyst->judge review
pipeline are exported for eval/review use.
"""

from .agents import (
    growthos_orchestrator,
    meta_data_analyst,
    tiktok_data_analyst,
    digital_marketing_judge,
    build_review_pipeline,
)

root_agent = growthos_orchestrator

__all__ = [
    "root_agent",
    "growthos_orchestrator",
    "meta_data_analyst",
    "tiktok_data_analyst",
    "digital_marketing_judge",
    "build_review_pipeline",
]
