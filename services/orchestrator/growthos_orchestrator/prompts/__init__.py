"""GrowthOS agent prompts — the system prompts are the contract each agent
is graded against, so they live here as the single source of truth."""

from .meta_analyst import META_ANALYST_INSTRUCTION, META_ANALYST_DESCRIPTION
from .tiktok_analyst import TIKTOK_ANALYST_INSTRUCTION, TIKTOK_ANALYST_DESCRIPTION
from .judge import (
    DIGITAL_MARKETING_JUDGE_INSTRUCTION,
    DIGITAL_MARKETING_JUDGE_DESCRIPTION,
)

__all__ = [
    "META_ANALYST_INSTRUCTION",
    "META_ANALYST_DESCRIPTION",
    "TIKTOK_ANALYST_INSTRUCTION",
    "TIKTOK_ANALYST_DESCRIPTION",
    "DIGITAL_MARKETING_JUDGE_INSTRUCTION",
    "DIGITAL_MARKETING_JUDGE_DESCRIPTION",
]
