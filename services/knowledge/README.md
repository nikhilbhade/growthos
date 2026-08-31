# Knowledge service (M3 embedding retrieval)

Read-only grounding retrieval for the Meta & TikTok agents. Given a question, it
returns the most relevant documentation snippets (metric definitions, data
dictionary, naming taxonomy, integration SOP) so the agent can cite GradientOS's
own knowledge instead of guessing. This is the first Python service in GradientOS;
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

## Embedding backend & index

Two swappable seams, each with a zero-config default and an opt-in real backend:

- **Embedder** — `LocalHashingEmbedder` (default: offline, deterministic, no
  install) or `ApiEmbedder` (a real provider; Voyage-style request shape by
  default) when `AGENT_EMBEDDING_MODEL` + `AGENT_EMBEDDING_API_KEY` are set.
- **Index** — `InMemoryIndex` (default: embeds the corpus at startup) or
  `PgVectorIndex` (Postgres + pgvector) when `KNOWLEDGE_DATABASE_URL` (or
  `AGENT_MEMORY_DATABASE_URL`) is set. `GET /v1/capabilities` reports which is live.

For the MVP's small corpus the in-memory + local path is sufficient and needs
nothing installed. pgvector is for scale and shared state.

### Enabling pgvector

```bash
# 1. apply the migration (adds the vector extension + knowledge_documents table)
#    supabase/migrations/005_knowledge_documents.sql   (vector width = 1024)
# 2. install the extra dep and ingest the corpus with a real embedder
pip install -r services/knowledge/requirements.txt
KNOWLEDGE_DATABASE_URL=postgres://... AGENT_EMBEDDING_MODEL=voyage-3 \
  AGENT_EMBEDDING_API_KEY=... python services/knowledge/ingest.py
```

Keep `AGENT_EMBEDDING_DIMS` and the migration's `vector(N)` in sync with the model.

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
