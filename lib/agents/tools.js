// LangChain tool definitions for the agent. These are the ONLY actions the model
// can take. Every one is read-only: four provider retrievals, two memory reads,
// and an explicit refusal. There is deliberately no tool that mutates anything.
//
// buildTools takes a `trace` sink so the runtime can reconstruct the plan,
// findings, and the retrieval payload after the model finishes.

const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { searchKnowledge } = require('./knowledge-client');

const RANGES = ['last_7_days', 'last_14_days', 'last_30_days'];
const rangeSchema = z.enum(RANGES).default('last_14_days').describe('Reporting window.');

function buildTools({ agent, memory, demo = false, defaultRange = 'last_14_days', trace }) {
  const provider = memory.provider;

  // One shared retrieval implementation; each tool binds a dimension.
  async function retrieve(dimension, range) {
    const effectiveRange = RANGES.includes(range) ? range : defaultRange;
    const result = await agent.retrieve({ range: effectiveRange, dimension, demo });
    trace.retrieval = result;
    trace.tool = `retrieve_${dimension === 'ad_set' ? 'ad_sets' : dimension === 'creative' ? 'creatives' : dimension === 'performance' ? 'performance' : 'campaigns'}`;
    trace.dimension = dimension;
    trace.range = effectiveRange;
    trace.toolsUsed.push(trace.tool);
    if (result.pending) return `The ${provider} account is not connected yet, so no records could be read. The account must be authorized and its first sync validated first.`;
    return JSON.stringify({ range: result.range, freshness: result.freshness, isDemoData: result.isDemoData, recordCount: (result.records || []).length, records: result.records || [] });
  }

  const groupLabel = provider === 'tiktok' ? 'ad groups' : 'ad sets';

  const retrieveCampaigns = tool(async ({ range }) => retrieve('campaign', range), {
    name: 'retrieve_campaigns',
    description: `Retrieve read-only ${provider} campaign records (name, status, spend, impressions, clicks, conversions, budget, attribution window) for a reporting window.`,
    schema: z.object({ range: rangeSchema })
  });

  const retrieveAdSets = tool(async ({ range }) => retrieve('ad_set', range), {
    name: 'retrieve_ad_sets',
    description: `Retrieve read-only ${provider} ${groupLabel} (audience, placement, spend, budget) for a reporting window.`,
    schema: z.object({ range: rangeSchema })
  });

  const retrieveCreatives = tool(async ({ range }) => retrieve('creative', range), {
    name: 'retrieve_creatives',
    description: `Retrieve read-only ${provider} creative/ad records (format, placement, spend) for a reporting window.`,
    schema: z.object({ range: rangeSchema })
  });

  const retrievePerformance = tool(async ({ range }) => retrieve('performance', range), {
    name: 'retrieve_performance',
    description: `Retrieve read-only ${provider} aggregate performance (spend, impressions, clicks, conversions) for a reporting window.`,
    schema: z.object({ range: rangeSchema })
  });

  // Semantic-memory tool.
  const lookupMetric = tool(async ({ term }) => {
    const resolved = memory.semantic.resolveMetric(term);
    trace.toolsUsed.push('lookup_metric_definition');
    if (!resolved) return `"${term}" is not a recognized metric in the GrowthOS registry.`;
    if (trace.metricVersion == null) trace.metricVersion = resolved.version;
    return JSON.stringify(resolved);
  }, {
    name: 'lookup_metric_definition',
    description: 'Resolve a metric term (e.g. "results", "CPA", "ROAS") to its GrowthOS definition, provider field, and attribution window. Use before answering when a metric is ambiguous.',
    schema: z.object({ term: z.string().describe('The metric term to resolve.') })
  });

  // Episodic-memory tool.
  const recallActivity = tool(async () => {
    trace.toolsUsed.push('recall_recent_activity');
    return memory.episodic.summary;
  }, {
    name: 'recall_recent_activity',
    description: 'Return the recent retrieval history for this workspace so you can reference or build on prior questions.',
    schema: z.object({})
  });

  // Semantic-memory grounding tool (M3): retrieves relevant documentation.
  const searchKnowledgeTool = tool(async ({ query }) => {
    trace.toolsUsed.push('search_knowledge_base');
    const results = await searchKnowledge({ query, provider, k: 3 });
    if (!trace.citations) trace.citations = [];
    trace.citations.push(...results.map(r => r.id));
    if (!results.length) return 'No matching documentation found.';
    return JSON.stringify(results.map(r => ({ title: r.title, source: r.source, snippet: r.snippet })));
  }, {
    name: 'search_knowledge_base',
    description: 'Search GrowthOS documentation (metric definitions, data dictionary, naming taxonomy, integration SOP) to ground an answer. Use for "how does X work", attribution, account structure, or connection questions.',
    schema: z.object({ query: z.string().describe('What to look up.') })
  });

  // The single correct response to any change request.
  const refuse = tool(async ({ reason }) => {
    trace.refusalReason = reason || 'Requested a change GrowthOS agents cannot make.';
    trace.refused = true;
    return 'Refusal recorded. This agent is read-only and made no provider changes.';
  }, {
    name: 'refuse_out_of_scope',
    description: 'Call this instead of retrieving when the user asks to create, edit, pause, publish, duplicate, or reallocate anything, or asks for something outside read-only retrieval.',
    schema: z.object({ reason: z.string().describe('Why the request is out of scope.') })
  });

  return [retrieveCampaigns, retrieveAdSets, retrieveCreatives, retrievePerformance, lookupMetric, recallActivity, searchKnowledgeTool, refuse];
}

module.exports = { buildTools, RANGES };
