const { createClient } = require('@supabase/supabase-js');

const demoIntegrations = [
  { id: 'meta', provider: 'meta', name: 'Meta Ads', category: 'Paid media', required: true, status: 'needs_setup', freshness: 'Pending connection', coverage: 'Facebook + Instagram', fields: ['spend', 'impressions', 'clicks', 'conversions', 'audience', 'budget', 'attribution window'], note: 'No Meta account is connected yet. Complete the access SOP to start a historical sync.' },
  { id: 'tiktok', provider: 'tiktok', name: 'TikTok Ads', category: 'Paid media', required: true, status: 'needs_setup', freshness: 'Pending connection', coverage: 'TikTok Ads', fields: ['spend', 'impressions', 'clicks', 'conversions', 'audience', 'budget', 'attribution window'], note: 'No TikTok advertiser is connected yet. Complete the access SOP to start a historical sync.' },
  { id: 'google', provider: 'google', name: 'Google Ads', category: 'Paid media', required: false, status: 'needs_setup', freshness: 'Not connected', coverage: 'Search, Performance Max, YouTube', fields: ['spend', 'impressions', 'clicks', 'conversions', 'campaign metadata', 'budget', 'attribution window'], note: 'Read-only reporting integration. Account access is selected during secure setup.' },
  { id: 'pos', provider: 'pos', name: 'Other POS', category: 'POS and orders', required: false, status: 'needs_setup', freshness: 'Not connected', coverage: 'Custom POS or order-system import', fields: ['order ID', 'order time', 'location', 'net sales', 'discounts', 'order channel', 'verified attribution identifiers'], note: 'Use this for Square, NCR, QSRSoft, or another order system. GradientOS reconciles platform attribution to POS outcomes first; direct order matching is optional and requires validated identifiers.' },
  { id: 'doordash', provider: 'doordash', name: 'DoorDash', category: 'Marketplace', required: false, status: 'needs_setup', freshness: 'Pending access invite', coverage: 'Merchant Portal · brand or business-group access', fields: ['store access', 'store metadata', 'location mapping', 'ingestion health'], note: 'Invite the GradientOS integration identity as Business Admin or Business Group Admin. One grant should cover every selected brand.' },
  { id: 'ubereats', provider: 'ubereats', name: 'Uber Eats', category: 'Marketplace', required: false, status: 'needs_setup', freshness: 'Pending access invite', coverage: 'Merchant Portal · store-by-store access', fields: ['store access', 'store metadata', 'location mapping', 'ingestion health'], note: 'Invite the GradientOS integration identity as Manager for every restaurant location. Each store must be added individually.' }
];

function demoWorkspaceIntegrations() {
  return demoIntegrations.map(item => ({
    ...item,
    status: 'connected',
    freshness: 'Preview data complete through Aug 19',
    coverage: ({ meta: 'Facebook + Instagram · 2 campaigns', tiktok: 'TikTok Ads · 2 campaigns', google: 'Search + YouTube · 3 campaigns', pos: 'Order import · 3 preview locations', doordash: 'Merchant Portal · 3 preview locations', ubereats: 'Merchant Portal · 3 preview locations' })[item.id],
    note: 'Preview data is isolated from customer connections and can be turned off at any time.'
  }));
}

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function publicShape(row) {
  const seed = demoIntegrations.find(item => item.provider === row.provider);
  const isPaidMedia = seed.category === 'Paid media';
  return { id: row.provider, provider: row.provider, name: seed.name, category: seed.category, required: seed.required, status: row.status, freshness: row.last_successful_sync_at ? new Date(row.last_successful_sync_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : 'Not synced', coverage: row.ad_account_count ? `${row.ad_account_count} ${isPaidMedia ? `ad account${row.ad_account_count === 1 ? '' : 's'}` : 'source connection'} ready` : `Awaiting ${isPaidMedia ? 'account' : 'source'} selection`, fields: seed.fields, note: seed.note };
}

async function listIntegrations({ demo = false } = {}) {
  if (demo) return demoWorkspaceIntegrations();
  if (!supabase) return demoIntegrations;
  const { data, error } = await supabase.from('integration_connections').select('*').in('provider', ['meta', 'tiktok', 'google', 'pos', 'doordash', 'ubereats']);
  if (error) throw error;
  return data.length ? data.map(publicShape) : demoIntegrations.map(item => ({ ...item, status: 'needs_setup', freshness: 'Not connected' }));
}

async function requestIntegrationSetup(provider) {
  if (!demoIntegrations.some(item => item.provider === provider)) return null;
  if (!supabase) {
    const item = demoIntegrations.find(item => item.provider === provider);
    item.status = 'review';
    return item;
  }
  const { data, error } = await supabase.from('integration_connections').select('*').eq('provider', provider).maybeSingle();
  if (error) throw error;
  if (!data) return { ...demoIntegrations.find(item => item.provider === provider), status: 'review', freshness: 'Awaiting workspace setup' };
  const { data: updated, error: updateError } = await supabase.from('integration_connections').update({ status: 'review' }).eq('id', data.id).select().single();
  if (updateError) throw updateError;
  return publicShape(updated);
}

module.exports = { listIntegrations, requestIntegrationSetup };
