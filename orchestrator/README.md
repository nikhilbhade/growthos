# GrowthOS orchestrator (Google ADK)

A Python [Google ADK](https://google.github.io/adk-docs/) layer that sits **on
top of** the existing Node.js retrieval agents. It plans and answers questions;
the Node service still owns the read-only tool surface, guardrails, memory, and
(later) the real Meta Marketing API credentials.

This is deliberately "orchestration only" — the orchestrator holds no provider
tokens and cannot mutate anything. It composes retrieval GrowthOS already has.

## Architecture

```
                 ┌─────────────────────────────┐
   user ───────► │  ADK LlmAgent (Python)      │   meta_agent/agent.py
                 │  meta_retrieval_orchestrator│
                 └──────────────┬──────────────┘
                                │ read-only FunctionTools
                                │ (retrieve_campaigns, _ad_sets,
                                │  _creatives, _performance)
                                ▼
                 ┌─────────────────────────────┐
                 │  httpx → Node GrowthOS       │   POST /api/agents/meta/retrieve
                 │  /api/agents/meta/retrieve   │
                 └──────────────┬──────────────┘
                                ▼
                 Node meta-retrieval-agent.js (demo data today,
                 real Meta Marketing API later — orchestrator unchanged)
```

Because retrieval stays in Node, the orchestrator automatically picks up the
real Meta API the day it replaces the demo data there — no change here.

## Layout

| File | Role |
| --- | --- |
| `meta_agent/agent.py` | The ADK `LlmAgent` (`root_agent`), instruction, model selection |
| `meta_agent/tools.py` | Read-only retrieval tools (one per Meta dimension) |
| `meta_agent/growthos_client.py` | httpx client to the Node retrieval endpoint |
| `meta_agent/config.py` | Env-driven config (API URL, demo flag, model, ranges) |
| `tests/test_tools.py` | Model-free smoke test against a mock Node endpoint |

## Setup

```bash
cd orchestrator
pip install -r requirements.txt
cp .env.example .env      # set GOOGLE_API_KEY (or switch ORCHESTRATOR_MODEL to Claude)
```

Make sure the Node server is running (`npm start` in the repo root) so the
retrieval endpoint is reachable at `GROWTHOS_API_URL`.

## Run

```bash
cd orchestrator
adk run meta_agent        # terminal chat
adk web                   # browser UI; choose "meta_agent"
```

Ask things like *"Show me the active campaigns for the last 7 days"* or *"What's
our aggregate Meta performance this period?"*. Ask it to change a budget and it
will decline — it is read-only by construction (no mutation tool exists).

## Test

No model key required:

```bash
cd orchestrator
python3 tests/test_tools.py
```

## Model choice

Defaults to `gemini-2.5-flash` (needs `GOOGLE_API_KEY`). To drive it with Claude
instead, `pip install litellm` and set `ORCHESTRATOR_MODEL="anthropic/claude-..."`;
`agent.py` wraps any non-Gemini id in ADK's `LiteLlm` automatically.

## Deploy to Cloud Run (no billable idle endpoint)

The container serves the agents as a headless HTTP API (`main.py` →
`get_fast_api_app(web=False)`). Deploy it with **`--min-instances=0`**, so the
service **scales to zero and costs nothing when idle** — there is no always-on
endpoint, no Vertex/GPU resource. You pay only for brief request compute, plus
per-token model usage *when the agent actually calls a model*.

From an **authenticated** environment (not a sandbox):

```bash
gcloud auth login
gcloud config set project growthos-506612
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

cd orchestrator
GROWTHOS_API_URL=https://<your-node-app> ./deploy.sh
```

`deploy.sh` pins `--min-instances=0`, `--max-instances=3`, modest CPU/memory, and
`--no-allow-unauthenticated` (the service requires an IAM token). The model API
key is **not** baked into the image or env — store it in Secret Manager and
reference it with `--set-secrets` (see the commented lines in `deploy.sh`).

**Tear down completely** (nothing bills afterward):

```bash
gcloud run services delete meta-orchestrator --region us-central1 --quiet
```

Files: `Dockerfile`, `.dockerignore`, `.gcloudignore`, `deploy.sh`, `main.py`.

## Status

- Meta retrieval orchestration: **done** (against demo data).
- Real Meta Marketing API: wired on the Node side later; no orchestrator change.
- TikTok / Google / delivery orchestrators: follow the same pattern.
