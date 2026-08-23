const capability = {
  id: 'tiktok',
  name: 'TikTok Retrieval Agent',
  provider: 'TikTok Ads',
  mode: 'read_only',
  capabilities: ['advertiser metadata', 'campaign metadata', 'ad group metadata', 'ad metadata', 'spend', 'impressions', 'clicks', 'conversions', 'budgets', 'attribution windows']
};

async function retrieve({ range = 'last_14_days', dimension = 'campaign', demo = false } = {}) {
  // OAuth-backed TikTok Marketing API retrieval belongs here once TikTok credentials are connected.
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
    freshness: 'Pending TikTok connection and first sync',
    pending: true,
    isDemoData: false,
    records: []
  };
}

function demoRecords(dimension) {
  const records = {
    campaign: [
      { id: 'tiktok-camp-01', name: 'Lunch Near You', platform: 'TikTok', status: 'ACTIVE', spend: 2940, impressions: 276400, clicks: 6120, conversions: 207, budget: 3080, attributionWindow: '7-day click / 1-day view' },
      { id: 'tiktok-camp-02', name: 'First Order Offer', platform: 'TikTok', status: 'ACTIVE', spend: 2180, impressions: 192800, clicks: 4240, conversions: 143, budget: 2240, attributionWindow: '7-day click / 1-day view' }
    ],
    ad_set: [
      { id: 'tiktok-adgroup-01', name: 'Foodies · 3-mile radius', parentCampaign: 'Lunch Near You', status: 'ACTIVE', spend: 1670, audience: 'Broad food audience', placement: 'TikTok For You feed', budget: 1750, attributionWindow: '7-day click / 1-day view' },
      { id: 'tiktok-adgroup-02', name: '18–34 · city lunch', parentCampaign: 'Lunch Near You', status: 'ACTIVE', spend: 1270, audience: 'Interest layer', placement: 'TikTok For You feed', budget: 1330, attributionWindow: '7-day click / 1-day view' }
    ],
    creative: [
      { id: 'tiktok-creative-01', name: 'Bowl build · creator cut', parentCampaign: 'Lunch Near You', status: 'ACTIVE', spend: 1360, format: '9:16 Spark Ad', placement: 'TikTok For You feed', attributionWindow: '7-day click / 1-day view' },
      { id: 'tiktok-creative-02', name: 'Street interview · 12s', parentCampaign: 'First Order Offer', status: 'ACTIVE', spend: 940, format: '9:16 video', placement: 'TikTok For You feed', attributionWindow: '7-day click / 1-day view' }
    ]
  };
  return dimension === 'performance' ? records.campaign : (records[dimension] || records.campaign);
}

module.exports = { capability, retrieve };
