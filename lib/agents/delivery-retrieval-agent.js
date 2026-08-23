const capability = {
  id: 'delivery',
  name: 'Delivery Retrieval Agent',
  provider: 'DoorDash + Uber Eats',
  mode: 'read_only',
  capabilities: ['campaign metadata', 'promotion metadata', 'location mapping', 'spend', 'sales', 'marketing credit', 'reported ROI', 'attributed ROI', 'gross margin', 'budget']
};

async function retrieve({ range = 'last_28_days', dimension = 'campaign', demo = false } = {}) {
  // Merchant-portal retrieval belongs here once both marketplace connections are authorized.
  if (demo) return {
    agent: capability,
    range,
    dimension,
    retrievedAt: new Date().toISOString(),
    freshness: 'Preview data complete through Aug 19',
    pending: false,
    isDemoData: true,
    records: demoRecords()
  };
  return {
    agent: capability,
    range,
    dimension,
    retrievedAt: new Date().toISOString(),
    freshness: 'Pending DoorDash and Uber Eats connection and first sync',
    pending: true,
    isDemoData: false,
    records: []
  };
}

function demoRecords() {
  return [
    { id: 'dd-oak-20', name: 'Existing 20% off up to $10', platform: 'DoorDash', location: 'River North', status: 'ACTIVE', spend: 17152, sales: 92104, marketingCredit: 109, roi: 5.37, attributedRoi: 4.36, margin: 77.07, budget: 'Uncapped' },
    { id: 'dd-bogo', name: 'Lunch BOGO', platform: 'DoorDash', location: 'West Loop', status: 'ACTIVE', spend: 13699, sales: 32056, marketingCredit: 0, roi: 2.34, attributedRoi: 2.42, margin: 58.69, budget: 'Uncapped' },
    { id: 'ue-30', name: '30% off, up to $35', platform: 'Uber Eats', location: 'River North', status: 'ACTIVE', spend: 6811, sales: 22331, marketingCredit: 2114, roi: 3.28, attributedRoi: 3.64, margin: 72.5, budget: 'Uncapped' },
    { id: 'ue-item', name: 'Free item (spend $35)', platform: 'Uber Eats', location: 'Wicker Park', status: 'ACTIVE', spend: 4921, sales: 12935, marketingCredit: 1661, roi: 2.63, attributedRoi: 3.39, margin: 70.53, budget: 'Uncapped' }
  ];
}

module.exports = { capability, retrieve };
