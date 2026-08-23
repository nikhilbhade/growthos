const capability = {
  id: 'meta',
  name: 'Meta Retrieval Agent',
  provider: 'Meta Ads',
  mode: 'read_only',
  capabilities: ['campaign metadata', 'ad set metadata', 'ad metadata', 'Facebook/Instagram placement delivery', 'spend', 'impressions', 'clicks', 'conversions', 'budgets', 'attribution windows']
};

async function retrieve({ range = 'last_14_days', dimension = 'campaign', demo = false } = {}) {
  // OAuth-backed Marketing API retrieval belongs here once Meta credentials are connected.
  // This agent deliberately exposes no campaign mutation methods.
  if (demo) return {
    agent: capability,
    range,
    dimension,
    retrievedAt: new Date().toISOString(),
    freshness: 'Preview data complete through Aug 19',
    pending: false,
    isDemoData: true,
    records: demoRecords(dimension)
  };
  return {
    agent: capability,
    range,
    dimension,
    retrievedAt: new Date().toISOString(),
    freshness: 'Pending Meta connection and first sync',
    pending: true,
    isDemoData: false,
    records: []
  };
}

function demoRecords(dimension) {
  const records = {
    campaign: [
      { id: 'meta-camp-01', name: 'Chicago Lunch Prospecting', platform: 'Facebook + Instagram', status: 'ACTIVE', spend: 3200, impressions: 230600, clicks: 4150, conversions: 170, budget: 4000, attributionWindow: '7-day click / 1-day view' },
      { id: 'meta-camp-02', name: 'First Order Offer', platform: 'Instagram', status: 'ACTIVE', spend: 2170, impressions: 168200, clicks: 2910, conversions: 142, budget: 2800, attributionWindow: '7-day click / 1-day view' }
    ],
    ad_set: [
      { id: 'meta-adset-01', name: '3-mile lunch radius · 18–44', parentCampaign: 'Chicago Lunch Prospecting', status: 'ACTIVE', spend: 1860, audience: 'Advantage+ audience', placement: 'Instagram Feed + Reels', budget: 2200, attributionWindow: '7-day click / 1-day view' },
      { id: 'meta-adset-02', name: 'Lookalike · prior purchasers', parentCampaign: 'Chicago Lunch Prospecting', status: 'ACTIVE', spend: 1340, audience: '2% purchaser lookalike', placement: 'Facebook + Instagram', budget: 1800, attributionWindow: '7-day click / 1-day view' }
    ],
    creative: [
      { id: 'meta-creative-01', name: 'Lunch bowl · 15s vertical video', parentCampaign: 'Chicago Lunch Prospecting', status: 'ACTIVE', spend: 2120, format: '9:16 video', placement: 'Instagram Reels', attributionWindow: '7-day click / 1-day view' },
      { id: 'meta-creative-02', name: 'First order · $10 off carousel', parentCampaign: 'First Order Offer', status: 'ACTIVE', spend: 1720, format: '4-card carousel', placement: 'Instagram Feed', attributionWindow: '7-day click / 1-day view' }
    ]
  };
  return dimension === 'performance' ? records.campaign : (records[dimension] || records.campaign);
}

module.exports = { capability, retrieve };
