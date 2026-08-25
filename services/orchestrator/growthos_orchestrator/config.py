"""Model + runtime configuration for the GrowthOS ADK orchestrator.

One place decides which model backend every agent uses. Google ADK is
Gemini-native, but also runs any LiteLLM-supported model (Claude, GPT, etc.)
through the ``LiteLlm`` wrapper — so the backend is a single env switch and the
agent code never has to care.

    GROWTHOS_AGENT_MODEL   e.g. "gemini-2.5-flash" (native) or
                           "anthropic/claude-opus-4-8" (routed via LiteLlm)
    GROWTHOS_JUDGE_MODEL   optional override for the judge (defaults to the same)

A model string that contains a "/" is treated as a LiteLLM route and wrapped;
a bare Gemini id is passed straight to ADK. Nothing here is ever sent to the
browser or into a prompt.
"""

from __future__ import annotations

import os

# Sensible defaults. ADK is a Google framework, so the default is a Gemini
# model; flip GROWTHOS_AGENT_MODEL to a "provider/model" route to use Claude or
# any other LiteLLM-supported backend without touching the agents.
DEFAULT_AGENT_MODEL = os.getenv("GROWTHOS_AGENT_MODEL", "gemini-2.5-flash")
DEFAULT_JUDGE_MODEL = os.getenv("GROWTHOS_JUDGE_MODEL", DEFAULT_AGENT_MODEL)


def build_model(model_id: str | None = None):
    """Return an ADK-usable model handle for ``model_id``.

    Bare Gemini ids (no "/") are returned as-is for ADK's native path. Anything
    that looks like a LiteLLM route ("anthropic/...", "openai/...") is wrapped in
    ``LiteLlm`` so the same agent definitions run on any backend.
    """
    model_id = model_id or DEFAULT_AGENT_MODEL
    if "/" not in model_id:
        return model_id
    # Imported lazily so a Gemini-only deployment need not install litellm.
    from google.adk.models.lite_llm import LiteLlm

    return LiteLlm(model=model_id)


def agent_model():
    return build_model(DEFAULT_AGENT_MODEL)


def judge_model():
    return build_model(DEFAULT_JUDGE_MODEL)
