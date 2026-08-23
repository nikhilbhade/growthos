// Client for the Python knowledge service (M3 embedding retrieval). When
// KNOWLEDGE_SERVICE_URL is set, queries the service; otherwise falls back to a
// local keyword scorer over the same corpus.json, so the agent can always ground
// its answers in the documentation even with the service offline.

const fs = require('fs');
const path = require('path');
const { config } = require('./config');

const CORPUS_PATH = path.join(__dirname, '..', '..', 'services', 'knowledge', 'corpus.json');

let corpusCache = null;
function corpus() {
  if (!corpusCache) corpusCache = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));
  return corpusCache;
}

function tokens(text) {
  return (String(text).toLowerCase().match(/[a-z0-9]+/g) || []);
}

// Local fallback: token-overlap score (query tokens present in a doc), normalized
// by query length, with provider filtering. Deterministic and dependency-free.
function localSearch(query, provider = 'all', k = 3) {
  const q = new Set(tokens(query));
  if (!q.size) return [];
  const scored = [];
  for (const doc of corpus().documents) {
    if (provider !== 'all' && provider != null && doc.provider !== 'all' && doc.provider !== provider) continue;
    const docTokens = new Set(tokens(`${doc.title} ${doc.text}`));
    let hits = 0;
    for (const t of q) if (docTokens.has(t)) hits++;
    const score = hits / q.size;
    if (score > 0) scored.push({ id: doc.id, title: doc.title, source: doc.source, provider: doc.provider, score: Number(score.toFixed(4)), snippet: doc.text });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

async function remoteSearch(query, provider, k) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.knowledge.authToken) headers.Authorization = `Bearer ${config.knowledge.authToken}`;
  const res = await fetch(`${config.knowledge.url.replace(/\/$/, '')}/v1/search`, {
    method: 'POST', headers, body: JSON.stringify({ query, provider, k }),
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) throw new Error(`knowledge service ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// Search the knowledge base. Never throws to the caller — on any remote failure
// it falls back to local so grounding degrades gracefully.
async function searchKnowledge({ query, provider = 'all', k = 3 } = {}) {
  if (config.knowledge.url) {
    try { return await remoteSearch(query, provider, k); }
    catch (error) { console.warn(`[knowledge-client] remote search failed, using local fallback: ${error.message}`); }
  }
  return localSearch(query, provider, k);
}

module.exports = { searchKnowledge, localSearch };
