"""GrowthOS orchestrator: the coordinator that fronts the analyst agents.

Two composition modes are provided:

- ``growthos_orchestrator`` — an LlmAgent coordinator whose sub_agents are the
  Meta and TikTok analysts. ADK routes each turn to the right analyst via
  LLM-driven delegation, reading the analysts' `description`. This is the
  default root agent (retrieval only, for now).

- ``build_review_pipeline(provider)`` — a SequentialAgent that runs one analyst
  and then the digital-marketing judge, so the judge grades the analyst's answer
  in the same run. It builds FRESH analyst/judge instances (an ADK agent can
  have only one parent), so it never reparents the coordinator's sub_agents.
"""

from google.adk.agents import LlmAgent, SequentialAgent

from ..config import agent_model, judge_model
from ..prompts import (
    META_ANALYST_INSTRUCTION,
    META_ANALYST_DESCRIPTION,
    TIKTOK_ANALYST_INSTRUCTION,
    TIKTOK_ANALYST_DESCRIPTION,
    DIGITAL_MARKETING_JUDGE_INSTRUCTION,
    DIGITAL_MARKETING_JUDGE_DESCRIPTION,
)
from ..tools import META_TOOLS, TIKTOK_TOOLS
from .meta_analyst import meta_data_analyst
from .tiktok_analyst import tiktok_data_analyst

_ORCHESTRATOR_INSTRUCTION = """\
You are the GrowthOS orchestrator. You do not analyze data yourself — you route
each request to the right read-only data-analyst agent and let it answer:

- Meta / Facebook / Instagram questions -> meta_data_analyst.
- TikTok questions -> tiktok_data_analyst.
- A cross-channel question (both platforms) -> route to each analyst in turn and
  keep their answers clearly separated by channel; do not blend or compare
  metrics across platforms unless the user asks, and never merge spend into a
  single number the platforms did not report jointly.

If the user asks to change, create, pause, or reallocate anything, do not route
it as an action — the analysts are read-only; explain that and offer retrieval
instead. Never invent data or answer a channel question without its analyst.\
"""

growthos_orchestrator = LlmAgent(
    name="growthos_orchestrator",
    model=agent_model(),
    description=(
        "Routes marketing data questions to the Meta or TikTok read-only data "
        "analyst and returns their answer."
    ),
    instruction=_ORCHESTRATOR_INSTRUCTION,
    sub_agents=[meta_data_analyst, tiktok_data_analyst],
)


def _fresh_analyst(provider: str) -> LlmAgent:
    if provider == "meta":
        return LlmAgent(
            name="meta_data_analyst",
            model=agent_model(),
            description=META_ANALYST_DESCRIPTION,
            instruction=META_ANALYST_INSTRUCTION,
            tools=META_TOOLS,
            output_key="analyst_answer",
        )
    if provider == "tiktok":
        return LlmAgent(
            name="tiktok_data_analyst",
            model=agent_model(),
            description=TIKTOK_ANALYST_DESCRIPTION,
            instruction=TIKTOK_ANALYST_INSTRUCTION,
            tools=TIKTOK_TOOLS,
            output_key="analyst_answer",
        )
    raise ValueError(f"unknown provider {provider!r}; expected 'meta' or 'tiktok'")


def build_review_pipeline(provider: str) -> SequentialAgent:
    """Analyst -> judge, in one run. The analyst writes its answer to
    state['analyst_answer']; the judge reads it and writes state['judge_verdict'].
    """
    analyst = _fresh_analyst(provider)
    judge = LlmAgent(
        name="digital_marketing_judge",
        model=judge_model(),
        description=DIGITAL_MARKETING_JUDGE_DESCRIPTION,
        instruction=(
            DIGITAL_MARKETING_JUDGE_INSTRUCTION
            + "\n\nThe analyst answer to grade is:\n{analyst_answer}"
        ),
        tools=[],
        output_key="judge_verdict",
    )
    return SequentialAgent(
        name=f"{provider}_analyst_reviewed",
        sub_agents=[analyst, judge],
        description=(
            f"Runs the {provider} data analyst, then grades its answer with the "
            "digital-marketing judge."
        ),
    )
