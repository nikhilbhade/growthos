"""Knowledge retriever for the GrowthOS agents (milestone M3).

Embedding retrieval over the read-only grounding corpus (metric registry, data
dictionary, naming taxonomy, integration SOP). Dependency-free by default: a
local hashing embedder makes semantic-ish retrieval work offline for the MVP, and
the Embedder interface lets a real provider be swapped in when
AGENT_EMBEDDING_MODEL and a key are configured — mirroring the model path's
fallback design. The corpus holds documentation only, never customer PII.
"""

from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import Iterable

CORPUS_PATH = Path(__file__).with_name("corpus.json")
_TOKEN = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> list[str]:
    words = _TOKEN.findall(text.lower())
    grams: list[str] = list(words)
    for word in words:
        padded = f"#{word}#"
        grams += [padded[i : i + 3] for i in range(len(padded) - 2)]  # char 3-grams
    return grams


class LocalHashingEmbedder:
    """Deterministic, offline bag-of-features embedder (hashing trick + cosine)."""

    name = "local-hashing-v1"

    def __init__(self, dims: int = 1024) -> None:
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
        norm = math.sqrt(sum(v * v for v in vec))
        return [v / norm for v in vec] if norm else vec


def build_embedder() -> LocalHashingEmbedder:
    """Return the configured embedder. Local by default; a real provider plugs in
    here once AGENT_EMBEDDING_MODEL and its key are wired (kept offline for MVP)."""
    # if os.getenv("AGENT_EMBEDDING_MODEL") and os.getenv("AGENT_EMBEDDING_API_KEY"):
    #     return ApiEmbedder(...)
    return LocalHashingEmbedder()


def _cosine(a: Iterable[float], b: Iterable[float]) -> float:
    return sum(x * y for x, y in zip(a, b))  # inputs are L2-normalized


class Retriever:
    def __init__(self, corpus_path: Path = CORPUS_PATH, embedder=None) -> None:
        data = json.loads(Path(corpus_path).read_text())
        self.version = data.get("version", "unknown")
        self.documents = data["documents"]
        self.embedder = embedder or build_embedder()
        self._vectors = {
            doc["id"]: self.embedder.embed(f"{doc['title']}. {doc['text']}")
            for doc in self.documents
        }

    def search(self, query: str, provider: str = "all", k: int = 3) -> list[dict]:
        if not query or not query.strip():
            return []
        qv = self.embedder.embed(query)
        scored = []
        for doc in self.documents:
            if provider not in ("all", None) and doc["provider"] not in ("all", provider):
                continue
            score = _cosine(qv, self._vectors[doc["id"]])
            scored.append((score, doc))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        results = []
        for score, doc in scored[:k]:
            if score <= 0:
                continue
            results.append(
                {
                    "id": doc["id"],
                    "title": doc["title"],
                    "source": doc["source"],
                    "provider": doc["provider"],
                    "score": round(score, 4),
                    "snippet": doc["text"],
                }
            )
        return results
