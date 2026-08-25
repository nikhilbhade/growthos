"""Meta (Facebook / Instagram) Data Analyst agent — retrieval only."""

from google.adk.agents import LlmAgent

from ..config import agent_model
from ..prompts import META_ANALYST_INSTRUCTION, META_ANALYST_DESCRIPTION
from ..tools import META_TOOLS

meta_data_analyst = LlmAgent(
    name="meta_data_analyst",
    model=agent_model(),
    description=META_ANALYST_DESCRIPTION,
    instruction=META_ANALYST_INSTRUCTION,
    tools=META_TOOLS,
)
