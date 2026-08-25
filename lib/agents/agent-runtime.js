const rangePattern = /(?:last|past)\s+(7|14|30)\s+days/i;
const blockedActionPattern = /\b(edit|pause|resume|publish|delete|increase|decrease|move|reallocate|change)\b.*\b(budget|campaign|ad set|ad group|creative|spend)\b/i;

function chooseDimension(message, fallback = 'campaign') {
  if (/\b(creative|ad\s*(?:asset|copy|image|video)|asset)\b/i.test(message)) return 'creative';
  if (/\b(ad\s*sets?|adsets?|ad\s*groups?|adgroups?|audience|targeting|placement)\b/i.test(message)) return 'ad_set';
  if (/\bcampaigns?\b/i.test(message)) return 'campaign';
  if (/\b(spend|impression|click|conversion|ctr|cpa|performance|delivery|result)\b/i.test(message)) return 'performance';
  return fallback;
}

function planQuery({ message = '', dimension = 'campaign', range = 'last_14_days' }) {
  if (blockedActionPattern.test(message)) {
    return { safe: false, intent: 'mutation_request', tool: null, dimension, range, reason: 'GrowthOS retrieval agents cannot change provider settings.' };
  }
  const requestedRange = message.match(rangePattern)?.[1];
  const plannedDimension = chooseDimension(message, dimension);
  const tool = plannedDimension === 'performance' ? 'retrieve_performance' : plannedDimension === 'creative' ? 'retrieve_creatives' : plannedDimension === 'ad_set' ? 'retrieve_ad_sets' : 'retrieve_campaigns';
  return { safe: true, intent: 'read_only_retrieval', tool, dimension: plannedDimension, range: requestedRange ? `last_${requestedRange}_days` : range };
}

function objectLabel(dimension, provider) {
  if (dimension === 'ad_set') return provider === 'TikTok Ads' ? 'ad group' : 'ad set';
  if (dimension === 'creative') return 'creative';
  if (dimension === 'performance') return 'performance record';
  return 'campaign';
}

function readableRange(range) {
  const days = String(range).match(/(7|14|30)/)?.[1];
  return days ? `the last ${days} days` : 'the selected reporting window';
}

function money(value) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function followUp(label) {
  if (label === 'campaign') return 'Would you like me to open the ad-set or ad-group details next?';
  if (label === 'ad set' || label === 'ad group') return 'Would you like me to pull the creative details next?';
  if (label === 'creative') return 'Would you like me to retrieve the delivery or attribution metadata next?';
  return 'Would you like me to break this down by campaign or creative next?';
}

function answerBasis({ retrieval, plan, label, recordCount }) {
  return `\n\nAnswer basis\n• Scope: ${label} data for ${readableRange(plan.range)}\n• Retrieval: ${plan.tool} returned ${recordCount} record${recordCount === 1 ? '' : 's'}\n• Freshness: ${retrieval.freshness}`;
}

function summarize(retrieval, plan, message = '') {
  if (retrieval.pending) return {
    answer: `I’d like to pull that for you, but ${retrieval.agent.provider} is not connected to GrowthOS yet. I don’t want to guess at account data. Once the account is authorized and the first sync is validated, I can retrieve and explain the campaigns, structure, and delivery metrics in this chat.\n\nAnswer basis\n• Requested scope: ${objectLabel(plan.dimension, retrieval.agent.provider)} data for ${readableRange(plan.range)}\n• Retrieval status: connection required before any account data can be read`,
    findings: [],
    suggestedPrompts: ['Which person should connect this account?', 'What data will GrowthOS read?']
  };
  const label = objectLabel(plan.dimension, retrieval.agent.provider);
  const records = retrieval.records || [];
  const totalSpend = records.reduce((total, record) => total + (Number(record.spend) || 0), 0);
  const largestSpendRecord = [...records].sort((left, right) => (Number(right.spend) || 0) - (Number(left.spend) || 0))[0];
  const firstName = largestSpendRecord?.name || largestSpendRecord?.campaign || 'the first record';
  const countLabel = `${records.length} active ${label}${records.length === 1 ? '' : 's'}`;
  const scope = readableRange(retrieval.range);
  const acknowledgement = message.trim()
    ? `I checked ${label === 'performance record' ? 'the performance data' : `the ${label} data`} you asked about for ${scope}.`
    : `I checked the available ${label} data for ${scope}.`;
  const spendLine = totalSpend ? ` Together, the retrieved records show ${money(totalSpend)} in spend.` : '';
  const detailLine = largestSpendRecord && totalSpend
    ? ` ${firstName} has the largest visible spend at ${money(largestSpendRecord.spend)}.`
    : '';
  const response = records.length
      ? `${acknowledgement} I found ${countLabel}.${spendLine}${detailLine} This is ${retrieval.isDemoData ? 'preview data, so use it to explore the workspace rather than draw a live account conclusion' : 'provider-reported data'}. ${followUp(label)}`
      : `${acknowledgement} I didn’t find any active ${label}s in this scope. It may be worth checking the account selection, time range, or provider reporting cutoff.`;
  return {
    answer: `${response}${answerBasis({ retrieval, plan, label, recordCount: records.length })}`,
    findings: [
      { label: `Active ${label}${records.length === 1 ? '' : 's'}`, value: String(records.length) },
      ...(totalSpend ? [{ label: 'Retrieved spend', value: money(totalSpend) }] : []),
      { label: 'Reporting window', value: retrieval.freshness }
    ],
    suggestedPrompts: [`Show active ${label}s`, 'What attribution window is configured?', 'Retrieve creative metadata']
  };
}

// Deterministic retrieval + summary. Used both as the fallback when the LLM
// agent is unavailable and as the guaranteed refusal path for mutation intents.
async function runDeterministic({ agent, message, dimension, range, demo, runId }) {
  const plan = planQuery({ message, dimension, range });
  if (!plan.safe) return {
    runId,
    engine: 'deterministic',
    plan,
    answer: `I can help you understand the data behind a possible change, but I can’t alter campaigns, budgets, creatives, or spend. Those actions stay with an authorized person in the provider account. If you’d like, ask me to retrieve the relevant campaign, ad set, or creative details first.\n\nAnswer basis\n• Requested operation: provider change\n• Access policy: read-only retrieval; no changes were attempted`,
    findings: [],
    suggestedPrompts: ['Show active campaigns', 'Retrieve ad set metadata', 'What attribution window is configured?'],
    disclaimer: 'Read-only retrieval agent. No provider changes were attempted.'
  };
  const retrieval = await agent.retrieve({ range: plan.range, dimension: plan.dimension, demo });
  const summary = summarize(retrieval, plan, message);
  return {
    runId,
    engine: 'deterministic',
    plan,
    retrieval,
    ...summary,
    disclaimer: 'Read-only retrieval agent. Results are provider-reported and are not a recommendation or execution instruction.'
  };
}

async function runAgentChat({ agent, message, dimension, range, demo, brandId = null, threadId = null }) {
  const runId = `run_${Date.now().toString(36)}`;

  // Code-enforced guardrail runs BEFORE the model and cannot be overridden: any
  // mutation intent is refused deterministically, no provider call attempted.
  const guardPlan = planQuery({ message, dimension, range });
  if (!guardPlan.safe) return runDeterministic({ agent, message, dimension, range, demo, runId });

  // Try the LangGraph agent; fall back to deterministic on any failure so the
  // chat (and preview mode) never breaks.
  try {
    const { runLlmAgent } = require('./llm-agent');
    return await runLlmAgent({ agent, message, range, dimension, demo, brandId, threadId });
  } catch (error) {
    if (error && error.code !== 'DEPS_UNAVAILABLE') console.warn(`[agent-runtime] LLM path failed, using deterministic fallback: ${error.message}`);
    return runDeterministic({ agent, message, dimension, range, demo, runId });
  }
}

module.exports = { planQuery, runAgentChat, runDeterministic };
