"""Embed corpus.json into Postgres/pgvector (milestone M3 persistence).

    KNOWLEDGE_DATABASE_URL=postgres://... \
    AGENT_EMBEDDING_MODEL=voyage-3 AGENT_EMBEDDING_API_KEY=... \
    python services/knowledge/ingest.py

Idempotent upsert keyed by document id. Uses the configured embedder (a real
provider when set, else the local hashing embedder — but store dimensions must
match the migration's vector(N), so use a real model in shared environments).
Requires psycopg and that migration 005 has been applied.
"""

from __future__ import annotations

import os

from retriever import CORPUS_PATH, build_embedder
import json


def main() -> None:
    dsn = os.getenv("KNOWLEDGE_DATABASE_URL") or os.getenv("AGENT_MEMORY_DATABASE_URL")
    if not dsn:
        raise SystemExit("Set KNOWLEDGE_DATABASE_URL (or AGENT_MEMORY_DATABASE_URL) to ingest.")
    import psycopg  # lazy; only the ingest path needs it

    embedder = build_embedder()
    documents = json.loads(CORPUS_PATH.read_text())["documents"]
    print(f"embedding {len(documents)} documents with {embedder.name}...")

    rows = []
    for doc in documents:
        vector = embedder.embed(f"{doc['title']}. {doc['text']}")
        literal = "[" + ",".join(str(x) for x in vector) + "]"
        rows.append((doc["id"], doc["provider"], doc["source"], doc["title"], doc["text"], literal))

    upsert = (
        "insert into public.knowledge_documents (id, provider, source, title, body, embedding) "
        "values (%s, %s, %s, %s, %s, %s::vector) "
        "on conflict (id) do update set provider=excluded.provider, source=excluded.source, "
        "title=excluded.title, body=excluded.body, embedding=excluded.embedding, updated_at=now()"
    )
    with psycopg.connect(dsn) as conn, conn.cursor() as cur:
        cur.executemany(upsert, rows)
        conn.commit()
    print(f"upserted {len(rows)} documents into public.knowledge_documents")


if __name__ == "__main__":
    main()
