# Meta & TikTok agent scope — intelligence layer

This document scopes the next phase of work on the **Meta Retrieval Agent** and
the **TikTok Retrieval Agent**. It is a planning artifact: it defines the goal,
the boundaries, the milestones, the data contracts, and the guardrails so the
work can be executed and reviewed against a fixed target.

The two agents share one runtime, one audit trail, and one guardrail policy, so
they are scoped together. Wherever this document says "the agent" it applies to
both unless a provider-specific note calls out a difference (Meta uses **ad
sets**, TikTok uses **ad groups**; TikTok additionally exposes an **advertiser**
object).

## 1. Where the agents are today

| Layer | File | State |
| --- | --- | --- |
| Agent capability + retrieval | `lib/agents/meta-retrieval-agent.js`, `lib/agents/tiktok-retrieval-agent.js` | Read-only. Expose `capability` + `retrieve()`. Return demo records or a `pending: true` "not connected" state. No mutation methods by design. |
| Request planner | `lib/agents/agent-runtime.js` | Deterministic. `planQuery` → `chooseDimension` (regex) picks one of four read-only tools; `blockedActionPattern` refuses mutations before any retrieval; `summarize` renders findings + an "answer basis" + a run ID. |
| HTTP entry | `api/agent-chat.js` | Routes `{ agent, message, dimension, range, demo }` into `runAgentChat`. |
| Audit trail | `supabase/migrations/002_agent_retrieval_runs.sql` | `agent_retrieval_runs` table, `provider in ('meta','tiktok')`, RLS by brand owner. **Not yet written to by the runtime.** |
| Frontend | `public/agents-v2.js` | Per-platform chat; posts to `/api/agent-chat`; renders answer + plan tool + findings. |
| Roadmap | `docs/agentic-capabilities.md` | Names the ML capabilities this phase implements. |

The agents are scaffolded end to end but the planner is regex-based and the ML
capabilities named in the roadmap do not exist yet.

## 2. Goal of this phase

Upgrade the **intelligence** of the two agents while keeping retrieval read-only
and provider-agnostic in shape. Concretely:

1. Replace the regex planner with an **LLM tool-calling planner** that produces a
   structured, validated retrieval plan — without weakening the mutation
   refusal or letting the model construct provider API calls.
2. Add a **semantic metric layer** so provider-specific terms ("sales",
   "conversions", "ROAS", "results") resolve to a single versioned definition per
   provider.
3. Add **embedding retrieval** over the data dictionary, integration SOP, and
   campaign-naming taxonomy so the planner can ground its answers in GrowthOS's
   own documentation instead of guessing.
4. Stand up an **evaluation harness** so planner and prose changes are measured
   before they ship.
5. Start **writing the audit trail** (`agent_retrieval_runs`) on every run.

## 2a. Framework & memory architecture

The agent is built on **LangChain / LangGraph** (JS) with **Claude via
`@langchain/anthropic`**, and traced/evaluated with **LangFuse** (open-source,
self-hostable — trace data, which contains campaign metrics, stays on
infrastructure we control). LangGraph's memory model maps one-to-one onto the
three memory systems the agent is organized around:

| Memory | Question it answers | Backing | Module |
| --- | --- | --- | --- |
| **Procedural** | *How do I act?* | System prompt + tool policy + compiled graph (versioned) | `lib/agents/memory/procedural-memory.js`, `system-prompt.js` |
| **Semantic** | *What is true?* | Metric registry, data dictionary, naming taxonomy → LangGraph Store namespace w/ embedding search (M2/M3) | `lib/agents/memory/semantic-memory.js` |
| **Episodic** | *What happened?* | Past runs per brand → checkpointer (thread) + Store namespace backed by `agent_retrieval_runs` (M5) | `lib/agents/memory/episodic-memory.js` |

The model **selects read-only tools**; it never constructs a provider request.
The deterministic planner (`agent-runtime.js`) is retained as (a) an
un-overridable pre-model mutation guardrail and (b) the fallback when the model
key or framework is unavailable — so **preview mode queries demo data with or
without a model configured**. All framework dependencies are isolated under
`lib/agents/` and lazy-loaded; the rest of the app is unchanged.

Secrets (`AGENT_MODEL_API_KEY`, LangFuse keys, memory DB URL) live in `.env`
(gitignored) via `process.env`, and move to a secrets manager in production —
mirroring how provider tokens are kept in the owning service's encrypted store.

## 2b. Build status (this branch)

- **Done** — LangGraph agent core (`llm-agent.js`), the three memory systems
  (`memory/`), the performance-marketing system prompt (`system-prompt.js`), the
  read-only tool surface (`tools.js`), and the deterministic guardrail + fallback
  wiring (`agent-runtime.js`). Semantic metric registry (M2) is seeded. Episodic
  audit write path (M5) is wired with migration `004`.
- **Done — launch hardening**: per-turn timeout + bounded tool loop
  (`AGENT_MODEL_TIMEOUT_MS`, `AGENT_RECURSION_LIMIT`) so a hung/looping model call
  falls back instead of hanging a live request; secrets kept server-side.
- **Done — M4 harness (started)**: `lib/agents/eval/` with a labelled dataset and
  a zero-dep runner (`npm test`), gated in CI (`.github/workflows/agent-evals.yml`).
  Covers refusal, dimension selection, and metric correctness in the deterministic
  engine (the prod fallback); model-mode adds tool-selection and no-revenue-invention
  checks when `AGENT_MODEL_API_KEY` is set.
- **Done — M3 (started)**: `services/knowledge/` Python service — read-only
  embedding retrieval over the grounding corpus, dependency-free (local hashing
  embedder) for the MVP with a real-provider seam. Wired to the agent via the
  `search_knowledge_base` tool and `lib/agents/knowledge-client.js`, which falls
  back to a local search over the same `corpus.json` when the service is down.
  This is the first Python service; its tests run in CI. Real embedding backend
  (`ApiEmbedder`, provider-configurable) and pgvector persistence (`PgVectorIndex`,
  `ingest.py`, migration `005`) are in place behind env flags — in-memory + local
  stays the zero-config default; both activate when a key / DB URL is set.
- **Next** — enable the model path in a staging env (set the key), expand the
  model-mode eval set, then the remaining Python offline work (evals at scale,
  real embeddings, later anomaly/forecasting).

## 3. Explicitly out of scope

This phase does **not** touch:

- **Live provider integration** — OAuth, token storage, real Marketing API
  calls, and ingestion remain stubbed in `services/` and `lib/agents/*.retrieve`.
  The intelligence layer is built and validated against the existing demo /
  `pending` retrieval contract so it is ready the day live data lands. (Tracked
  separately; see `docs/integration-access-sop.md` and
  `docs/microservices-architecture.md`.)
- **Any mutation capability** — creating, editing, pausing, publishing, or
  reallocating budget stays out of the product until a separate approval
  workflow is built. The agents expose no mutation method and the planner must
  refuse mutation intents.
- **Anomaly detection and forecasting** — deferred until there is clean history.
  They are named in the roadmap but are not part of this phase.
- **New providers** — Google, DoorDash, and Uber Eats are unchanged. The audit
  table and metric registry are built provider-keyed so they extend later, but
  only `meta` and `tiktok` are wired now.

## 4. Milestones

### M1 — LLM tool-calling planner

Replace `chooseDimension` regex classification with a model call that emits a
structured plan, while keeping the deterministic layer as a **guardrail and
fallback**, not a throwaway.

- **Tool surface exposed to the model** — the four existing read-only
  retrievals, described as tools the model *selects*, never as endpoints it
  *constructs*:
  - `retrieve_campaigns`
  - `retrieve_ad_sets` (ad groups for TikTok)
  - `retrieve_creatives`
  - `retrieve_performance`
  - plus `refuse_out_of_scope` for mutation / unsupported requests.
- **Model output** is a validated plan object (see §5), not free prose and not a
  provider request. The server maps the chosen tool name to the existing
  `agent.retrieve({ range, dimension, demo })` call. The model never sees a
  token or a raw provider URL.
- **Guardrail precedence** — `blockedActionPattern` runs **before and after** the
  model. If either the regex or the model flags a mutation intent, the request is
  refused; the model cannot override a regex refusal. This keeps the existing
  safety property ("refuse before any provider call") intact.
- **Fallback** — if the model call fails, times out, or returns an invalid plan,
  fall back to the current deterministic `planQuery`. The agent must never fail
  closed into silence or fail open into an unsafe call.
- **Model** — default `claude-opus-5` via the Anthropic Node SDK
  (`@anthropic-ai/sdk`), keyed by `AGENT_MODEL_API_KEY` (already reserved in
  `.env.example`). Model id is config, not hardcoded. Use strict tool schemas so
  the plan validates exactly; the key must stay server-side (never in the browser,
  prompt, or event payload).

### M2 — Semantic metric layer

A versioned registry that resolves a user's metric term to the provider-specific
source definition and reporting window.

- Module `lib/agents/memory/semantic-memory.js` (provider-keyed) — **seeded**:
  maps canonical metric → per-provider field, definition text, unit, and default
  attribution / reporting window. "results" → Meta `results` vs. TikTok
  `conversions`; "sales"/"ROAS" are *not* provider metrics and resolve to an
  explicit "unavailable, use a POS/attribution source" verdict. Next: move the
  backing store to a LangGraph Store namespace with embedding search (M3).
- The planner consumes the registry so a question about "conversions" retrieves
  the right field and the prose cites the exact definition and window it used.
- Every definition is versioned; a definition change is a reviewable diff, and
  the version used is recorded on the run (see M5).

### M3 — Embedding retrieval (pgvector)

Ground the planner in GrowthOS's own documentation.

- New migration adds a `pgvector` store for: the provider data dictionary, the
  integration SOP (`docs/integration-access-sop.md`), and the campaign-naming
  taxonomy. Store document text + metadata only — **no raw customer PII and no
  payment data**.
- Embedding model configured via `AGENT_EMBEDDING_MODEL` (already reserved in
  `.env.example`).
- Retrieval is scoped per workspace/brand and returns citations the prose can
  surface, consistent with the existing "answer basis" pattern.

### M4 — Evaluation harness

No planner or prose change ships without passing an eval set. Cover, at minimum:

- **Unsafe-action refusal** — every mutation phrasing is refused before retrieval
  (regression guard for the M1 guardrail).
- **False retrieval** — the planner selects the correct dimension/tool for a
  labelled question set across both providers.
- **Metric-definition correctness** — terms resolve to the right provider field
  and window (M2).
- **Hallucinated-citation** — prose only cites records/definitions that were
  actually retrieved.

Run the suite in CI and before enabling any model-generated prose in production.

### M5 — Audit trail write path

Wire `runAgentChat` to write `agent_retrieval_runs` on every run: provider,
requested range, requested dimension, status (`running`/`succeeded`/`failed`),
records returned, freshness, the selected tool/plan, the metric-definition
version used, and any refusal reason. This makes every retrieval auditable and
gives the eval harness ground-truth logs.

## 5. Data contract — the retrieval plan

The model's job is to emit this object (validated server-side); it is the single
seam between the LLM and the existing runtime. Field names mirror what
`runAgentChat`/`agent.retrieve` already consume so the change is additive.

```jsonc
{
  "safe": true,                     // false ⇒ refuse, no retrieval
  "intent": "read_only_retrieval",  // or "mutation_request" | "out_of_scope"
  "tool": "retrieve_campaigns",     // one of the 5 tool names, or null when unsafe
  "dimension": "campaign",          // campaign | ad_set | creative | performance
  "range": "last_14_days",          // last_7_days | last_14_days | last_30_days
  "metric": "conversions",          // canonical metric key, resolved via M2, or null
  "metricVersion": "meta.v1",       // registry version used, recorded on the run
  "reason": "…"                     // required when safe=false
}
```

Invariants the server enforces regardless of model output:

- `tool` must be one of the five known names; anything else ⇒ fallback plan.
- A mutation verb detected by `blockedActionPattern` ⇒ `safe:false` even if the
  model returned `safe:true`.
- `range` must be one of the three supported windows; otherwise clamp to the
  request default (`last_14_days`).

## 6. Guardrails (must hold through the LLM change)

Carried forward verbatim from `docs/agentic-capabilities.md` §Production
guardrails — the model layer must not weaken any of these:

- Structured tool schemas + server-side authorization. The model **selects** a
  tool; it never constructs a provider API request.
- Provider tokens stay in the owning integration service — never in the browser,
  prompt, or event payload. The planner receives only the user question, the
  metric registry, and approved/minimized tool results.
- Log request, selected tool, parameters, source freshness, record count, and
  refusal reason on every run (M5).
- Mutation refusal happens **before any provider call is made**, and a regex
  refusal cannot be overridden by the model.
- Ship model-generated prose only after the eval sets (M4) pass.

## 7. Configuration & dependencies

- Add `@anthropic-ai/sdk` to `package.json` (currently only `@supabase/supabase-js`).
- Activate the reserved env vars in `.env.example`: `AGENT_MODEL_API_KEY`,
  `AGENT_EMBEDDING_MODEL`. Keep both server-side only.
- New migration for the pgvector document store (M3); no change to
  `002_agent_retrieval_runs.sql` beyond starting to write it (M5).

## 8. Suggested sequence

1. **M5** (audit write path) + **M4 skeleton** (refusal + false-retrieval evals)
   against the *current* regex planner — establishes the safety net and baseline.
2. **M1** (LLM planner behind the guardrail, with deterministic fallback), gated
   on the M4 evals.
3. **M2** (metric registry), extend evals for metric correctness.
4. **M3** (embedding retrieval), extend evals for citation grounding.

This ordering keeps the mutation-refusal guarantee and an auditable trail in
place *before* the model is introduced, so every later step is measured against a
green baseline.

## 9. Open decisions

- **Prose generation**: does the model also write the final answer prose, or does
  it only produce the plan while `summarize` keeps rendering deterministic prose?
  Deterministic prose is safer and cheaper to start; model prose is gated on M4's
  hallucinated-citation eval. Recommendation: start plan-only, enable model prose
  per-provider once evals are green.
- **Embedding provider**: Anthropic has no first-party embedding endpoint, so
  `AGENT_EMBEDDING_MODEL` points at whichever embedding service is chosen — decide
  the vendor before M3.
- **Eval data source**: hand-labelled question set vs. replayed
  `agent_retrieval_runs` logs. Start hand-labelled; grow from real logs once M5 is
  writing them.
