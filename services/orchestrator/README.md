# GrowthOS Orchestrator (Google ADK)

Multi-agent orchestration for GrowthOS, built on [Google ADK](https://google.github.io/adk-docs/).
Two **read-only** data-analyst agents behind a routing orchestrator, plus an
LLM-as-judge that grades analyst answers for digital-marketing expertise.

```
growthos_orchestrator (LlmAgent, router)
├── meta_data_analyst      Facebook / Instagram — retrieval only
└── tiktok_data_analyst    TikTok — retrieval only

digital_marketing_judge    grades an analyst answer (no retrieval)
build_review_pipeline()    analyst → judge, in one run
```

## What each piece is

| Piece | File | Role |
|-------|------|------|
| Meta analyst | `agents/meta_analyst.py` | Reads Meta Ads structure & delivery; explains it like a paid-social buyer. |
| TikTok analyst | `agents/tiktok_analyst.py` | Same, for TikTok (ad groups, Spark Ads, For You feed). |
| Orchestrator | `agents/orchestrator.py` | Routes each question to the right analyst (LLM-driven delegation). |
| Judge | `agents/judge.py` | Scores an answer 1–5 on domain fluency, metric rigor, guardrails, grounding, clarity; returns JSON. |

The **system prompts are the contract** and live in `prompts/` as the single
source of truth: `shared.py` (persona + guardrails + Answer-basis), `meta_analyst.py`,
`tiktok_analyst.py`, and `judge.py`.

## Guardrails (carried over from the Node runtime in `lib/agents`)

- **Read-only.** No tool mutates anything; the prompts refuse create/edit/pause/reallocate.
- **No invented revenue.** Ad platforms report spend/impressions/clicks/attributed
  conversions — not sales or ROAS. Those requests are declined and pointed at the POS.
- **Answer basis.** Every answer ends with scope / tool / record count / freshness.

## Model backend

ADK is Gemini-native but runs any LiteLLM-supported model. One env switch:

```bash
export GROWTHOS_AGENT_MODEL=gemini-2.5-flash          # native (default)
# export GROWTHOS_AGENT_MODEL=anthropic/claude-opus-4-8  # routed via LiteLlm
# export GROWTHOS_JUDGE_MODEL=...                        # optional judge override
```

A model id containing `/` is treated as a LiteLLM route and wrapped automatically
(`config.py`). Set the corresponding provider key (`GOOGLE_API_KEY` for Gemini,
`ANTHROPIC_API_KEY` for Claude, etc.).

## Run it

```bash
cd services/orchestrator
pip install -r requirements.txt
export GOOGLE_API_KEY=...            # or the key for your chosen backend

adk web growthos_orchestrator        # visual dev UI
# or
adk run growthos_orchestrator        # terminal
```

Retrieval currently serves preview/demo records (mirroring `lib/agents`) so the
agents are runnable before OAuth-backed Marketing API access is wired in. The
tool signatures won't change when real retrieval lands — only the tool bodies in
`tools/retrieval.py`.

## Status

- [x] Meta & TikTok analyst system prompts + read-only retrieval tools
- [x] Orchestrator routing
- [x] Digital-marketing LLM-as-judge + analyst→judge review pipeline
- [ ] OAuth-backed Meta / TikTok Marketing API retrieval (replaces demo bodies)
- [ ] Judge wired into an eval set / CI gate
- [ ] Shared memory & knowledge-service grounding (parity with `lib/agents`)
