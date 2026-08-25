"""Meta retrieval orchestration agent package.

Importing `from . import agent` is the ADK convention that lets `adk run`/`adk web`
discover `agent.root_agent`.
"""
from . import agent  # noqa: F401

__all__ = ["agent"]
