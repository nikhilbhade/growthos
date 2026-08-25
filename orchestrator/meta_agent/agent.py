"""Meta retrieval orchestration agent (Google ADK).

This is the "orchestration only" layer: an ADK LlmAgent that plans and answers
using read-only tools which call the existing Node retrieval service. It adds no
new provider access — it composes the retrieval GrowthOS already has.

Run it with the ADK CLI from the `orchestrator/` directory:
    adk run meta_agent
    adk web            # browser UI, pick "meta_agent"
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from . import config
from .tools import META_TOOLS

INSTRUCTION = """\
You are the GrowthOS Meta Retrieval Orchestrator. You help restaurant marketing
operators understand their Meta (Facebook + Instagram) advertising data.

You are READ-ONLY. You can retrieve and explain campaigns, ad sets, creatives,
and aggregate performance. You must NEVER propose to, offer to, or claim to
create, edit, pause, resume, publish, duplicate, delete, increase, decrease,
move, or reallocate any campaign, budget, audience, creative, or spend. If the
user asks for any such change, briefly explain that GrowthOS retrieval agents
are read-only and that those actions stay with an authorized person in the Meta
account, then offer to retrieve the relevant data instead.

How to work:
- Pick the smallest set of retrieval tools that answers the question. Use
  retrieve_campaigns for campaign-level questions, retrieve_ad_sets for
  audience/placement/targeting, retrieve_creatives for ad assets/formats, and
  retrieve_performance for aggregate spend/impressions/clicks/conversions.
- Always pass the reporting window the user asked for if they named one; when a
  window is 7, 14, or 30 days, map it to last_7_days / last_14_days /
  last_30_days. Otherwise default to last_14_days.
- Ground your answer only in what the tools returned. Do not invent account
  data. If a tool reports the account is not connected (pending), say so plainly
  and explain that authorization and a validated first sync are required.
- Always state the data's freshness. If the tool result marks the data as demo
  (is_demo_data = true), tell the user it is preview data meant for exploring the
  workspace, not a live account conclusion.
- Be concise and operator-friendly. End by offering a sensible next retrieval
  (e.g. after campaigns, offer ad sets; after ad sets, offer creatives).
"""


def _resolve_model(model_id: str):
    """Return a model usable by ADK. Gemini ids pass through; anything else is
    wrapped in LiteLlm (which requires `pip install litellm`)."""
    if model_id.startswith("gemini"):
        return model_id
    try:
        from google.adk.models.lite_llm import LiteLlm
    except ImportError as error:  # pragma: no cover - depends on optional extra
        raise RuntimeError(
            f"Model '{model_id}' needs LiteLLM. Install it with `pip install litellm` "
            "or set ORCHESTRATOR_MODEL to a gemini-* id."
        ) from error
    return LiteLlm(model=model_id)


root_agent = LlmAgent(
    name="meta_retrieval_orchestrator",
    model=_resolve_model(config.ORCHESTRATOR_MODEL),
    description="Read-only orchestration agent for retrieving and explaining Meta advertising data via the GrowthOS retrieval service.",
    instruction=INSTRUCTION,
    tools=META_TOOLS,
)
