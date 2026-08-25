"""GrowthOS multi-agent orchestrator (Google ADK).

Meta and TikTok read-only data analysts behind a routing orchestrator, plus a
digital-marketing LLM-as-judge that grades analyst answers for expert parlance.
"""

from . import agent
from .agent import root_agent

__all__ = ["agent", "root_agent"]
