const providers = {
  meta: {
    displayName: 'Meta Ads',
    auth: 'OAuth (Facebook Login for Business) with Marketing API read + write access',
    phase: 'Development mode — build/test against own or sandbox ad accounts; App Review + Advanced Access to ads_management required before connecting customer accounts. See docs/meta-development-mode-setup.md.',
    scopes: ['ads_read', 'ads_management', 'business_management', 'pages_show_list', 'pages_read_engagement', 'pages_manage_ads', 'instagram_basic'],
    objects: ['campaigns', 'ad sets', 'ads', 'insights', 'ad images', 'ad videos', 'ad creatives'],
    capabilities: ['read reporting', 'create/update campaigns, ad sets, ads', 'upload creative assets', 'publish ads (paused by default) under the Page/Instagram identity']
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
