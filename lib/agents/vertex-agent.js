// Vertex AI answer layer. Retrieval, policy checks, and metric calculation stay
// in GrowthOS code; Gemini only turns the already-scoped result into clear copy.
// Cloud Run supplies ADC through its service account, so no model key is stored.

const { GoogleGenAI } = require('@google/genai');
const { config } = require('./config');

class VertexUnavailable extends Error {
  constructor(message) { super(message); this.code = 'VERTEX_UNAVAILABLE'; }
}

function money(value) { return `$${Math.round(value).toLocaleString('en-US')}`; }

function findings(retrieval) {
  const records = retrieval.records || [];
  const totalSpend = records.reduce((sum, record) => sum + (Number(record.spend) || 0), 0);
  return [
    { label: 'Records retrieved', value: String(records.length) },
    ...(totalSpend ? [{ label: 'Retrieved spend', value: money(totalSpend) }] : []),
    { label: 'Reporting window', value: retrieval.freshness }
  ];
}

function compactRecords(records) {
  return records.slice(0, 25).map(record => ({
    name: record.name || record.campaign || null,
    status: record.status || null,
    spend: record.spend ?? null,
    impressions: record.impressions ?? null,
    clicks: record.clicks ?? null,
    conversions: record.conversions ?? null,
    budget: record.budget ?? null,
    metadata: record.metadata || null
  }));
}

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new VertexUnavailable(`Vertex response exceeded ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function runVertexAgent({ agent, message, plan, demo, brandId = null, threadId = null }) {
  if (!config.vertex.projectId) throw new VertexUnavailable('VERTEX_AI_PROJECT_ID is not set.');

  const retrieval = await agent.retrieve({ range: plan.range, dimension: plan.dimension, demo });
  if (retrieval.pending) throw new VertexUnavailable('Provider connection is pending; deterministic response is more accurate.');

  const client = new GoogleGenAI({
    vertexai: true,
    project: config.vertex.projectId,
    location: config.vertex.location,
    apiVersion: 'v1'
  });
  const payload = {
    provider: agent.capability.provider,
    requestedQuestion: message,
    requestedDimension: plan.dimension,
    requestedRange: plan.range,
    freshness: retrieval.freshness,
    isPreviewData: Boolean(retrieval.isDemoData),
    records: compactRecords(retrieval.records || [])
  };
  const prompt = `You are the GrowthOS ${agent.capability.provider} Retrieval Agent. You are read-only.\n\nUse only the JSON records below. Do not invent metrics, infer causality, make budget recommendations, or imply that you can change anything. State whether the data is preview/demo or provider-reported. Give a concise, conversational answer with at most three findings, then a short “Data basis” list containing scope, record count, and freshness.\n\n${JSON.stringify(payload)}`;
  const response = await withTimeout(client.models.generateContent({
    model: config.model.id,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.2, maxOutputTokens: config.model.maxTokens }
  }), config.model.timeoutMs);
  const answer = String(response.text || '').trim();
  if (!answer) throw new VertexUnavailable('Vertex returned an empty response.');

  return {
    runId: `vertex_${Date.now().toString(36)}`,
    engine: 'vertex',
    plan: { ...plan, provider: 'vertex', threadId, brandId },
    retrieval,
    answer,
    findings: findings(retrieval),
    suggestedPrompts: ['Show active campaigns', 'Retrieve ad set metadata', 'What attribution window is configured?'],
    disclaimer: 'Read-only retrieval agent. Results are provider-reported and are not a recommendation or execution instruction.'
  };
}

module.exports = { runVertexAgent, VertexUnavailable };
