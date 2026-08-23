const providers = {
  meta: {
    displayName: 'Meta Ads',
    auth: 'OAuth with read-only Marketing API access',
    scopes: ['ads_read', 'business_management (only when account discovery is enabled)'],
    objects: ['campaigns', 'ad sets', 'ads', 'insights', 'creative metadata']
  },
  tiktok: {
    displayName: 'TikTok Ads',
    auth: 'OAuth with read-only Marketing API reporting access',
    scopes: ['advertiser reporting and campaign read access'],
    objects: ['campaigns', 'ad groups', 'ads', 'reporting metrics', 'creative metadata']
  },
  google: {
    displayName: 'Google Ads',
    auth: 'OAuth with Google Ads reporting access',
    scopes: ['Google Ads read access through a GrowthOS developer token'],
    objects: ['campaigns', 'ad groups', 'ads', 'metrics', 'attribution settings']
  },
  doordash: {
    displayName: 'DoorDash',
    auth: 'Merchant Portal Business Admin or Business Group Admin invitation',
    scopes: ['selected brands or business groups'],
    objects: ['stores', 'location mapping', 'marketplace reporting when enabled']
  },
  ubereats: {
    displayName: 'Uber Eats',
    auth: 'Uber Eats Manager invitation at each selected location',
    scopes: ['selected restaurant locations'],
    objects: ['stores', 'location mapping', 'marketplace reporting when enabled']
  }
};

function getProvider(id) {
  return providers[id];
}

module.exports = { providers, getProvider };
