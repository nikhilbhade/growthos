// Semantic memory — "what is true."
//
// Stable domain knowledge, independent of any single conversation: the metric
// registry (canonical term -> per-provider definition + window), the provider
// data dictionary, the campaign-naming taxonomy, and the structural differences
// between Meta and TikTok. This is the seed for milestone M2 (semantic metric
// layer) and M3 (embedding retrieval): the interface stays the same when the
// backing store moves to pgvector / a LangGraph Store namespace.

const VERSION = 'semantic.v1';

const DEFAULT_WINDOW = '7-day click / 1-day view';

// Canonical metric -> definition. `providerField` names the field each provider
// reports it under; `derived` metrics are computed from base fields, not stored.
const metrics = {
  spend: { label: 'Spend', unit: 'currency', definition: 'Amount charged by the platform for delivery in the reporting window.', providerField: { meta: 'spend', tiktok: 'spend' } },
  impressions: { label: 'Impressions', unit: 'count', definition: 'Number of times an ad was shown.', providerField: { meta: 'impressions', tiktok: 'impressions' } },
  clicks: { label: 'Clicks', unit: 'count', definition: 'Link or destination clicks, platform-reported.', providerField: { meta: 'clicks', tiktok: 'clicks' } },
  conversions: { label: 'Conversions', unit: 'count', definition: 'Optimized results attributed by the platform within the attribution window. Meta labels these "results"; TikTok labels them "conversions".', providerField: { meta: 'conversions', tiktok: 'conversions' }, window: DEFAULT_WINDOW, aliases: ['results', 'purchases', 'orders', 'leads'] },
  budget: { label: 'Budget', unit: 'currency', definition: 'Configured daily or lifetime budget cap for the object.', providerField: { meta: 'budget', tiktok: 'budget' } },
  ctr: { label: 'CTR', unit: 'ratio', definition: 'Clicks divided by impressions.', derived: 'clicks / impressions', aliases: ['click-through rate'] },
  cpc: { label: 'CPC', unit: 'currency', definition: 'Spend divided by clicks.', derived: 'spend / clicks', aliases: ['cost per click'] },
  cpm: { label: 'CPM', unit: 'currency', definition: 'Spend per thousand impressions.', derived: '1000 * spend / impressions', aliases: ['cost per mille'] },
  cvr: { label: 'CVR', unit: 'ratio', definition: 'Conversions divided by clicks.', derived: 'conversions / clicks', aliases: ['conversion rate'] },
  cpa: { label: 'CPA / cost per result', unit: 'currency', definition: 'Spend divided by conversions (results).', derived: 'spend / conversions', window: DEFAULT_WINDOW, aliases: ['cost per result', 'cost per order', 'cost per acquisition', 'cpo'] },
  attribution_window: { label: 'Attribution window', unit: 'text', definition: 'Click/view lookback the platform used to credit a conversion.', providerField: { meta: 'attributionWindow', tiktok: 'attributionWindow' }, aliases: ['attribution', 'lookback window'] }
};

// Terms that read like metrics but are NOT available from ad-platform reads.
// Resolving one of these must decline rather than fabricate a number.
const unavailableMetrics = {
  roas: 'ROAS requires verified order revenue joined to spend. Ad platforms report attributed results, not sales, so ROAS needs a POS/attribution source (Toast or another order system).',
  revenue: 'Verified revenue comes from a connected POS/order system, not from the ad platform.',
  sales: 'Verified sales come from a connected POS/order system, not from the ad platform.',
  profit: 'Profit needs cost and revenue data that the ad platform does not report.',
  ltv: 'Customer lifetime value needs order history from a POS/order system.'
};

// Per-object field dictionary, by canonical dimension.
const dataDictionary = {
  campaign: ['id', 'name', 'platform', 'status', 'spend', 'impressions', 'clicks', 'conversions', 'budget', 'attributionWindow'],
  ad_set: ['id', 'name', 'parentCampaign', 'status', 'spend', 'audience', 'placement', 'budget', 'attributionWindow'],
  creative: ['id', 'name', 'parentCampaign', 'status', 'spend', 'format', 'placement', 'attributionWindow'],
  performance: ['spend', 'impressions', 'clicks', 'conversions', 'attributionWindow']
};

// Structural differences the agent must respect when talking to each provider.
const structure = {
  meta: { levels: ['campaign', 'ad set', 'ad (creative)'], middleLevel: 'ad set', resultLabel: 'results', placements: ['Facebook Feed', 'Instagram Feed', 'Instagram Reels', 'Stories'], notes: 'Meta optimizes to "results" defined by the campaign objective.' },
  tiktok: { levels: ['advertiser', 'campaign', 'ad group', 'ad (creative)'], middleLevel: 'ad group', resultLabel: 'conversions', placements: ['TikTok For You feed'], notes: 'TikTok groups ads into ad groups and shares access at the advertiser level; Spark Ads use a creator handle.' }
};

// Campaign-naming taxonomy observed in the workspace, used to parse intent from names.
const namingTaxonomy = {
  pattern: '{Geography} {Daypart/Offer} {Funnel stage}',
  examples: ['Chicago Lunch Prospecting', 'First Order Offer', 'Lunch Near You'],
  tokens: { funnel: ['Prospecting', 'Retargeting', 'Offer'], daypart: ['Lunch', 'Dinner', 'Late night'] }
};

function normalize(term) {
  return String(term || '').trim().toLowerCase();
}

// Resolve a user metric term to a definition for a provider, or an explicit
// "unavailable" verdict. Returns null only for genuinely unknown terms.
function resolveMetric(term, provider = 'meta') {
  const key = normalize(term);
  if (!key) return null;
  if (unavailableMetrics[key]) return { canonical: key, available: false, version: `${VERSION}.${provider}`, reason: unavailableMetrics[key] };
  for (const [canonical, entry] of Object.entries(metrics)) {
    const match = canonical === key || (entry.aliases || []).some(alias => normalize(alias) === key);
    if (!match) continue;
    return {
      canonical,
      available: true,
      version: `${VERSION}.${provider}`,
      label: entry.label,
      unit: entry.unit,
      definition: entry.definition,
      providerField: entry.providerField ? entry.providerField[provider] : null,
      derived: entry.derived || null,
      window: entry.window || null
    };
  }
  return null;
}

function describeDimension(dimension) {
  return dataDictionary[dimension] || dataDictionary.campaign;
}

function getStructure(provider = 'meta') {
  return structure[provider] || structure.meta;
}

// Compact snapshot injected into the system prompt so the model carries the
// essentials without a tool call for common terms.
function promptSnapshot(provider = 'meta') {
  const s = getStructure(provider);
  return {
    version: `${VERSION}.${provider}`,
    structure: `${s.levels.join(' > ')}. Middle level: ${s.middleLevel}. Results are labelled "${s.resultLabel}".`,
    keyMetrics: Object.entries(metrics).map(([k, v]) => `${k} = ${v.definition}`),
    unavailable: Object.keys(unavailableMetrics),
    defaultWindow: DEFAULT_WINDOW,
    naming: `${namingTaxonomy.pattern} (e.g. ${namingTaxonomy.examples.join(', ')})`
  };
}

module.exports = { getSemantic: () => ({ version: VERSION, metrics, unavailableMetrics, dataDictionary, structure, namingTaxonomy }), resolveMetric, describeDimension, getStructure, promptSnapshot, VERSION };
