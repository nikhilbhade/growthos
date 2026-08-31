"""Knowledge retriever for the GradientOS agents (milestone M3).

Embedding retrieval over the read-only grounding corpus. Two swappable seams,
each with a zero-config default and an opt-in real backend — mirroring the model
path's fallback design:

  Embedder:  LocalHashingEmbedder (default, offline, deterministic)
             ApiEmbedder          (real provider, when AGENT_EMBEDDING_MODEL + key)
  Index:     InMemoryIndex        (default, embeds the corpus at startup)
             PgVectorIndex        (Postgres + pgvector, when a DB URL is set)

The corpus holds documentation only, never customer PII.
"""

from __future__ import annotations

import json
import math
import os
import re
import urllib.request
from pathlib import Path
from typing import Iterable

CORPUS_PATH = Path(__file__).with_name("corpus.json")
_TOKEN = re.compile(r"[a-z0-9]+")

# Vector width for the local embedder and the pgvector column (migration 005).
# A real model has its own width; keep the migration's vector(N) in sync with it.
LOCAL_DIMS = 1024


def _tokens(text: str) -> list[str]:
    words = _TOKEN.findall(text.lower())
    grams: list[str] = list(words)
    for word in words:
        padded = f"#{word}#"
        grams += [padded[i : i + 3] for i in range(len(padded) - 2)]  # char 3-grams
    return grams


def _l2(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vec))
    return [v / norm for v in vec] if norm else vec


class LocalHashingEmbedder:
    """Deterministic, offline bag-of-features embedder (hashing trick + cosine)."""

    name = "local-hashing-v1"

    def __init__(self, dims: int = LOCAL_DIMS) -> None:
        self.dims = dims

    @staticmethod
    def _bucket(token: str) -> int:
        # Stable FNV-1a hash (Python's built-in hash() is process-randomized).
        h = 2166136261
        for byte in token.encode("utf-8"):
            h = ((h ^ byte) * 16777619) & 0xFFFFFFFF
        return h

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dims
        for token in _tokens(text):
            vec[self._bucket(token) % self.dims] += 1.0
        return _l2(vec)


class ApiEmbedder:
    """HTTP embedding client (Voyage-style request shape by default; endpoint and
    model are configurable). Used only when a provider + key are configured — the
    corpus, interface, and index stay identical to the local path."""

    def __init__(self, model: str, api_key: str, url: str, dims: int | None = None) -> None:
        self.name = f"api:{model}"
        self.model = model
        self.api_key = api_key
        self.url = url
        self.dims = dims

    def _post(self, payload: dict) -> dict:
        req = urllib.request.Request(
            self.url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310 (trusted config URL)
            return json.loads(resp.read())

    def embed(self, text: str) -> list[float]:
        data = self._post({"model": self.model, "input": [text]})
        vector = data["data"][0]["embedding"]
        return _l2([float(x) for x in vector])


def build_embedder():
    """Return the configured embedder: a real provider when AGENT_EMBEDDING_MODEL
    and AGENT_EMBEDDING_API_KEY are set, otherwise the offline local embedder."""
    model = os.getenv("AGENT_EMBEDDING_MODEL")
    key = os.getenv("AGENT_EMBEDDING_API_KEY")
    if model and key:
        url = os.getenv("AGENT_EMBEDDING_API_URL", "https://api.voyageai.com/v1/embeddings")
        dims = int(os.getenv("AGENT_EMBEDDING_DIMS", "0")) or None
        return ApiEmbedder(model=model, api_key=key, url=url, dims=dims)
    return LocalHashingEmbedder()


def _cosine(a: Iterable[float], b: Iterable[float]) -> float:
    return sum(x * y for x, y in zip(a, b))  # inputs are L2-normalized


def _format(doc: dict, score: float) -> dict:
    return {"id": doc["id"], "title": doc["title"], "source": doc["source"],
            "provider": doc["provider"], "score": round(float(score), 4), "snippet": doc["text"]}


class InMemoryIndex:
    """Default index: embeds the corpus once and cosine-ranks in process."""

    kind = "in-memory"

    def __init__(self, documents: list[dict], embedder) -> None:
        self.documents = documents
        self.embedder = embedder
        self._vectors = {d["id"]: embedder.embed(f"{d['title']}. {d['text']}") for d in documents}

    def search(self, qv: list[float], provider: str, k: int) -> list[dict]:
        scored = []
        for doc in self.documents:
            if provider not in ("all", None) and doc["provider"] not in ("all", provider):
                continue
            score = _cosine(qv, self._vectors[doc["id"]])
            if score > 0:
                scored.append((score, doc))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [_format(doc, score) for score, doc in scored[:k]]


class PgVectorIndex:
    """Postgres + pgvector index. Documents are ingested by ingest.py; search runs
    cosine distance in SQL. Requires psycopg (see requirements.txt)."""

    kind = "pgvector"

    def __init__(self, dsn: str) -> None:
        import psycopg  # lazy: only needed on the pgvector path

        self._psycopg = psycopg
        self.dsn = dsn

    def search(self, qv: list[float], provider: str, k: int) -> list[dict]:
        literal = "[" + ",".join(str(x) for x in qv) + "]"
        provider_filter = ("all",) if provider in ("all", None) else ("all", provider)
        placeholders = ",".join(["%s"] * len(provider_filter))
        sql = (
            "select id, title, source, provider, body, "
            "1 - (embedding <=> %s::vector) as score "
            "from public.knowledge_documents "
            f"where provider in ({placeholders}) "
            "order by embedding <=> %s::vector asc limit %s"
        )
        with self._psycopg.connect(self.dsn) as conn, conn.cursor() as cur:
            cur.execute(sql, (literal, *provider_filter, literal, k))
            rows = cur.fetchall()
        return [
            {"id": r[0], "title": r[1], "source": r[2], "provider": r[3],
             "score": round(float(r[5]), 4), "snippet": r[4]}
            for r in rows
        ]


class Retriever:
    def __init__(self, corpus_path: Path = CORPUS_PATH, embedder=None, index=None) -> None:
        data = json.loads(Path(corpus_path).read_text())
        self.version = data.get("version", "unknown")
        self.documents = data["documents"]
        self.embedder = embedder or build_embedder()
        self.index = index or self._build_index()

    def _build_index(self):
        dsn = os.getenv("KNOWLEDGE_DATABASE_URL") or os.getenv("AGENT_MEMORY_DATABASE_URL")
        if dsn:
            try:
                return PgVectorIndex(dsn)
            except Exception as err:  # missing psycopg / bad DSN -> graceful fallback
                print(f"pgvector index unavailable ({err}); using in-memory index")
        return InMemoryIndex(self.documents, self.embedder)

    def search(self, query: str, provider: str = "all", k: int = 3) -> list[dict]:
        if not query or not query.strip():
            return []
        return self.index.search(self.embedder.embed(query), provider, k)
