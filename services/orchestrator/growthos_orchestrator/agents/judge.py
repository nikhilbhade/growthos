"""Digital-marketing LLM-as-judge — grades an analyst answer, retrieves nothing.

The judge writes its structured JSON verdict to session state under
``output_key`` so a pipeline (see orchestrator.build_review_pipeline) or an eval
run can read the grade programmatically.
"""

from google.adk.agents import LlmAgent

from ..config import judge_model
from ..prompts import (
    DIGITAL_MARKETING_JUDGE_INSTRUCTION,
    DIGITAL_MARKETING_JUDGE_DESCRIPTION,
)

digital_marketing_judge = LlmAgent(
    name="digital_marketing_judge",
    model=judge_model(),
    description=DIGITAL_MARKETING_JUDGE_DESCRIPTION,
    instruction=DIGITAL_MARKETING_JUDGE_INSTRUCTION,
    # No tools: the judge evaluates text, it does not retrieve.
    tools=[],
    output_key="judge_verdict",
)
