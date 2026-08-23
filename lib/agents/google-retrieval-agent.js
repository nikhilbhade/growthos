const capability = {
  id: 'google',
  name: 'Google Ads Retrieval Agent',
  provider: 'Google Ads',
  mode: 'read_only',
  capabilities: ['campaign metadata', 'ad group metadata', 'responsive-search and video creative metadata', 'audience signals', 'video engagement', 'learning status', 'spend', 'impressions', 'clicks', 'conversions', 'budgets', 'attribution windows']
};

async function retrieve({ range = 'last_14_days', dimension = 'campaign', demo = false } = {}) {
  if (demo) return { agent: capability, range, dimension, retrievedAt: new Date().toISOString(), freshness: 'Preview data complete through Aug 19', pending: false, isDemoData: true, records: demoRecords(dimension) };
  return { agent: capability, range, dimension, retrievedAt: new Date().toISOString(), freshness: 'Pending Google Ads connection and first sync', pending: true, isDemoData: false, records: [] };
}

function demoRecords(dimension) {
  const records = {
    campaign: [
      { id: 'google-camp-01', name: 'Chicago Lunch Search', platform: 'Google Search', status: 'ACTIVE', spend: 3480, impressions: 366800, clicks: 15320, conversions: 238, budget: 3640, attributionWindow: 'Data-driven attribution' },
      { id: 'google-camp-02', name: 'First Order Video', platform: 'YouTube + Demand Gen', status: 'ACTIVE', spend: 2260, impressions: 274000, clicks: 3086, conversions: 126, budget: 2520, attributionWindow: 'Data-driven attribution' }
    ],
    ad_set: [
      { id: 'google-adgroup-01', name: 'High-intent lunch terms', parentCampaign: 'Chicago Lunch Search', status: 'ACTIVE', spend: 2130, audience: 'Exact + phrase local search intent', placement: 'Google Search', budget: 2240, attributionWindow: 'Data-driven attribution' },
      { id: 'google-adgroup-02', name: 'Local food discovery', parentCampaign: 'First Order Video', status: 'ACTIVE', spend: 2260, audience: 'Food delivery + local dining signals', placement: 'YouTube Shorts', budget: 2520, attributionWindow: 'Data-driven attribution' }
    ],
    creative: [
      { id: 'google-creative-01', name: 'Lunch bowls · responsive search ad', parentCampaign: 'Chicago Lunch Search', status: 'ACTIVE', spend: 1560, format: 'Responsive search ad', placement: 'Google Search', attributionWindow: 'Data-driven attribution' },
      { id: 'google-creative-02', name: 'First order · 15s vertical video', parentCampaign: 'First Order Video', status: 'ACTIVE', spend: 1760, format: 'YouTube Shorts video', placement: 'YouTube Shorts', attributionWindow: 'Data-driven attribution' }
    ]
  };
  return dimension === 'performance' ? records.campaign : (records[dimension] || records.campaign);
}

module.exports = { capability, retrieve };
