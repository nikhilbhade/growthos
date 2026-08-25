"""TikTok Data Analyst agent — retrieval only."""

from google.adk.agents import LlmAgent

from ..config import agent_model
from ..prompts import TIKTOK_ANALYST_INSTRUCTION, TIKTOK_ANALYST_DESCRIPTION
from ..tools import TIKTOK_TOOLS

tiktok_data_analyst = LlmAgent(
    name="tiktok_data_analyst",
    model=agent_model(),
    description=TIKTOK_ANALYST_DESCRIPTION,
    instruction=TIKTOK_ANALYST_INSTRUCTION,
    tools=TIKTOK_TOOLS,
)
