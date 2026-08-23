# Knowledge service (M3 embedding retrieval)

Read-only grounding retrieval for the Meta & TikTok agents. Given a question, it
returns the most relevant documentation snippets (metric definitions, data
dictionary, naming taxonomy, integration SOP) so the agent can cite GrowthOS's
own knowledge instead of guessing. This is the first Python service in GrowthOS;
it follows the same control-plane / microservice split as the Node provider
services.

The corpus (`corpus.json`) holds **documentation and taxonomy only** — never raw
customer PII or payment data.

## HTTP surface

```
GET  /health
GET  /v1/capabilities
POST /v1/search   {"query": str, "provider": "meta|tiktok|all", "k": int}
```

Optional bearer auth via `SERVICE_AUTH_TOKEN` (same convention as the Node
services). `POST /v1/search` returns ranked `{id, title, source, provider, score,
snippet}`.

## Embedding backend

Dependency-free for the MVP: a local hashing embedder (`retriever.py`) gives
semantic-ish retrieval with no install step and deterministic results. The
`Embedder` seam in `build_embedder()` is where a real provider plugs in once
`AGENT_EMBEDDING_MODEL` and its key are configured — the corpus and interface
stay the same. The pgvector-backed store (LangGraph Store namespace) is the next
step from here.

## Run

```bash
python services/knowledge/app.py            # PORT defaults to 4200
# or via compose (see docker-compose.microservices.yml)
docker compose -f docker-compose.microservices.yml up knowledge
```

## Test

```bash
cd services/knowledge && python -m unittest -v
```

## Node integration

The web app never depends on this service being up. `lib/agents/knowledge-client.js`
calls it when `KNOWLEDGE_SERVICE_URL` is set and otherwise falls back to a local
keyword search over the same `corpus.json`, so the `search_knowledge_base` agent
tool always works.
