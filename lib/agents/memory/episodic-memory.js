// Episodic memory — "what happened."
//
// Per-brand history of past retrieval runs: what was asked, which tool ran, how
// many records came back, and how fresh the data was. This lets the agent say
// "last time you looked at this campaign..." and gives the eval harness (M4)
// ground-truth logs. Durable episodes live in the agent_retrieval_runs table
// (milestone M5); preview mode uses seeded demo episodes; without a brand or
// Supabase, a short in-process buffer keeps the current session coherent.

const { createClient } = require('@supabase/supabase-js');

const VERSION = 'episodic.v1';

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Session-scoped fallback so an agent has *some* recall even with no DB/brand.
const buffer = [];
const BUFFER_LIMIT = 25;

const demoEpisodes = {
  meta: [
    { question: 'Which campaign is spending the most?', selectedTool: 'retrieve_campaigns', dimension: 'campaign', range: 'last_14_days', recordsReturned: 2, freshness: 'Preview data complete through Aug 19', createdAt: '2026-08-21T15:12:00Z' },
    { question: 'Show the ad sets in Chicago Lunch Prospecting', selectedTool: 'retrieve_ad_sets', dimension: 'ad_set', range: 'last_14_days', recordsReturned: 2, freshness: 'Preview data complete through Aug 19', createdAt: '2026-08-22T09:40:00Z' }
  ],
  tiktok: [
    { question: 'What is my top TikTok creative?', selectedTool: 'retrieve_creatives', dimension: 'creative', range: 'last_14_days', recordsReturned: 2, freshness: 'Preview data complete through Aug 19', createdAt: '2026-08-22T11:05:00Z' }
  ]
};

function fromBuffer(provider, limit) {
  return buffer.filter(run => run.provider === provider).slice(-limit).reverse();
}

// Read recent episodes, newest first.
async function recentRuns({ provider = 'meta', brandId = null, limit = 5, demo = false } = {}) {
  if (demo) return (demoEpisodes[provider] || []).slice(0, limit);
  if (supabase && brandId) {
    const { data, error } = await supabase
      .from('agent_retrieval_runs')
      .select('question, selected_tool, requested_dimension, requested_range, records_returned, freshness_at, created_at, status')
      .eq('brand_id', brandId).eq('provider', provider)
      .order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(row => ({ question: row.question, selectedTool: row.selected_tool, dimension: row.requested_dimension, range: row.requested_range, recordsReturned: row.records_returned, freshness: row.freshness_at, createdAt: row.created_at, status: row.status }));
  }
  return fromBuffer(provider, limit);
}

// Record one run. Always buffered; persisted to agent_retrieval_runs only when a
// brand and Supabase are present (the table's brand_id is a required FK).
async function record(run = {}) {
  const entry = {
    provider: run.provider || 'meta',
    question: run.question || '',
    selectedTool: run.selectedTool || null,
    dimension: run.dimension || 'campaign',
    range: run.range || 'last_14_days',
    recordsReturned: Number(run.recordsReturned || 0),
    freshness: run.freshness || null,
    metricVersion: run.metricVersion || null,
    refusalReason: run.refusalReason || null,
    status: run.status || 'succeeded',
    createdAt: new Date().toISOString()
  };
  buffer.push(entry);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();

  if (!supabase || !run.brandId) return { persisted: false, entry };
  const { error } = await supabase.from('agent_retrieval_runs').insert({
    brand_id: run.brandId,
    provider: entry.provider,
    requested_range: entry.range,
    requested_dimension: entry.dimension,
    status: entry.status,
    records_returned: entry.recordsReturned,
    freshness_at: run.freshnessAt || null,
    question: entry.question,
    selected_tool: entry.selectedTool,
    metric_version: entry.metricVersion,
    refusal_reason: entry.refusalReason,
    completed_at: new Date().toISOString()
  });
  if (error) throw error;
  return { persisted: true, entry };
}

// Compact recall string for the system prompt.
function summarize(runs = []) {
  if (!runs.length) return 'No prior retrievals recorded for this workspace.';
  return runs.map(r => `• ${r.question || '(no question)'} → ${r.selectedTool || r.dimension} (${r.recordsReturned} records)`).join('\n');
}

module.exports = { recentRuns, record, summarize, VERSION };
