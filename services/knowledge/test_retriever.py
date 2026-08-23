"""Stdlib unittest for the knowledge retriever: python3 -m unittest -v
(run from services/knowledge). No external dependencies."""

import math
import unittest

from retriever import ApiEmbedder, InMemoryIndex, LocalHashingEmbedder, Retriever


class RetrieverTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.r = Retriever()

    def top_id(self, query: str, provider: str = "all") -> str:
        results = self.r.search(query, provider=provider, k=3)
        self.assertTrue(results, f"no results for {query!r}")
        return results[0]["id"]

    def test_roas_grounds_to_unavailable(self) -> None:
        ids = [d["id"] for d in self.r.search("what is my ROAS and revenue", k=3)]
        self.assertIn("metric-roas-unavailable", ids)

    def test_attribution_query(self) -> None:
        self.assertEqual(self.top_id("how is a conversion attributed and what lookback window"), "attribution-window")

    def test_provider_filter_excludes_other_provider(self) -> None:
        ids = [d["id"] for d in self.r.search("account structure ad group advertiser", provider="tiktok", k=5)]
        self.assertIn("structure-tiktok", ids)
        self.assertNotIn("structure-meta", ids)

    def test_embedding_is_deterministic(self) -> None:
        e = LocalHashingEmbedder()
        self.assertEqual(e.embed("Chicago lunch prospecting"), e.embed("Chicago lunch prospecting"))

    def test_empty_query_returns_nothing(self) -> None:
        self.assertEqual(self.r.search("   "), [])

    def test_default_index_is_in_memory(self) -> None:
        self.assertEqual(self.r.index.kind, "in-memory")

    def test_api_embedder_builds_request_and_normalizes(self) -> None:
        captured = {}

        class FakeApi(ApiEmbedder):
            def _post(self, payload):
                captured.update(payload)
                return {"data": [{"embedding": [3.0, 4.0]}]}  # -> L2-normalized to [0.6, 0.8]

        e = FakeApi(model="voyage-3", api_key="k", url="https://example/embeddings")
        vec = e.embed("hello")
        self.assertEqual(captured, {"model": "voyage-3", "input": ["hello"]})
        self.assertAlmostEqual(math.sqrt(sum(v * v for v in vec)), 1.0, places=6)
        self.assertEqual([round(v, 1) for v in vec], [0.6, 0.8])

    def test_in_memory_index_with_injected_embedder(self) -> None:
        idx = InMemoryIndex(self.r.documents, LocalHashingEmbedder())
        results = idx.search(LocalHashingEmbedder().embed("attribution window lookback"), "all", 2)
        self.assertTrue(any(r["id"] == "attribution-window" for r in results))


if __name__ == "__main__":
    unittest.main()
