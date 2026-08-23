"""Stdlib unittest for the knowledge retriever: python3 -m unittest -v
(run from services/knowledge). No external dependencies."""

import unittest

from retriever import LocalHashingEmbedder, Retriever


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


if __name__ == "__main__":
    unittest.main()
