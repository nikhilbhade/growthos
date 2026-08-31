const connectionGrid = document.getElementById('connectionGrid');
const connectionModal = document.getElementById('connectionModal');
const connectionFlow = document.getElementById('connectionFlow');

const providerInfo = {
  meta: {
    name: 'Meta', label: 'Facebook + Instagram advertising', logo: '∞', directUrl: 'https://business.facebook.com/adsmanager/manage/campaigns', authorization: 'Sign in with the Meta user who can access the brand’s Business Portfolio and selected ad accounts.', requirement: 'The marketer, agency partner, or owner who can see the brand’s Meta ad accounts.', read: ['Campaigns, ad sets, ads, and their status', 'Budgets, placements, audience settings, and attribution setup', 'Daily spend, impressions, clicks, and conversions'], history: 'We bring in up to 12 months of available history, then refresh daily.', scope: 'You will see the Meta ad accounts you can access. Pick the brand accounts GradientOS should include.', validation: 'We check that the right accounts, history, timezone, and campaign structure came through.', eta: 'About 5 minutes for you · up to 15 minutes for GradientOS to check the first sync'
  },
  tiktok: {
    name: 'TikTok', label: 'TikTok Ads', logo: '♪', directUrl: 'https://business.tiktok.com/', authorization: 'Sign in with the TikTok Business Center user who can access the intended advertiser accounts.', requirement: 'The marketer, agency partner, or owner who can access the brand’s TikTok advertiser accounts.', read: ['Campaigns, ad groups, ads, and their status', 'Budgets, targeting, placements, and creative settings', 'Daily spend, impressions, clicks, and conversions'], history: 'We bring in up to 12 months of available history, then refresh daily.', scope: 'TikTok Business Center will show the advertiser accounts you can access. Pick the brand accounts GradientOS should include.', validation: 'We check that the right accounts, history, timezone, and campaign structure came through.', eta: 'About 5 minutes for you · up to 15 minutes for GradientOS to check the first sync'
  },
  google: { name: 'Google Ads', label: 'Search, Performance Max + YouTube', logo: 'G', directUrl: 'https://ads.google.com/aw/overview', authorization: 'Sign in with the Google Ads administrator who can view the brand’s intended customer accounts.', requirement: 'The marketer, agency partner, or owner with administrator or reporting access to the Google Ads account.', read: ['Campaigns, ad groups, ads, and their status', 'Budgets, performance reporting, and attribution settings'], history: 'We bring in the available account history, then refresh daily.', scope: 'Google Ads will show the accounts your administrator can access. Pick the brand accounts GradientOS should include.', validation: 'We check that reporting access and campaign details are ready for Analytics.', eta: 'About 5 minutes for you · up to 15 minutes for GradientOS to check the first sync' },
  toast: { name: 'Toast', label: 'POS and order system', logo: 'T', authorization: 'Sign in with the Toast administrator who can approve reporting access for the brand locations.', requirement: 'The brand owner, operations lead, or Toast administrator with access to each location.', read: ['Completed online orders, order time, location, channel, net sales, discounts, and payment totals', 'A hashed customer reference only when the merchant is authorized to share it', 'A verified checkout or session identifier only when Toast makes it available'], history: 'We normalize up to 12 months of completed order history, then refresh daily. Platform attribution and Toast financial outcomes are reconciled at the selected reporting level.', scope: 'Select the Toast brand groups and locations GradientOS should include.', validation: 'We check order IDs, timezone, location mapping, duplicate prevention, and whether an identifier can safely support a direct order match.', eta: 'About 7 minutes for you · up to 30 minutes for GradientOS to validate the first order import' },
  pos: { name: 'Other POS', label: 'Square, NCR, QSRSoft, or custom import', logo: 'POS', authorization: 'Choose the order system administrator or provide the approved read-only export route.', requirement: 'The operations or finance owner who can grant reporting access or provide a daily order export.', read: ['Completed online orders, order time, location, channel, net sales, discounts, and order identifiers', 'A verified checkout, click, or session identifier only when the source preserves it'], history: 'We map the available historical order fields and reconcile platform attribution against the order-system financial outcome on the agreed schedule.', scope: 'Select the locations and order sources GradientOS should include.', validation: 'We validate the order schema, location mapping, duplicate prevention, and whether a deterministic direct join is genuinely possible.', eta: 'About 10 minutes for you · timing depends on the order system and export method' },
  doordash: { name: 'DoorDash', label: 'Merchant Portal', logo: 'DD', authorization: 'Open Merchant Portal user management and invite the GradientOS integration identity.', requirement: 'The brand’s Business Admin, or the Business Group Admin for multi-brand groups.', read: ['Brand locations and store details', 'Location mapping and connection health'], history: 'We match the stores that appear to the locations you expect to see.', scope: 'Choose the brands or business groups GradientOS should include.', validation: 'We check that the right brand locations came through.', eta: 'About 5 minutes for you · up to 15 minutes for GradientOS to check the first sync' },
  ubereats: { name: 'Uber Eats', label: 'Merchant Portal', logo: 'UE', authorization: 'Open Uber Eats Manager and invite the GradientOS integration identity as Manager.', requirement: 'The person who manages access for each brand location in Uber Eats Manager.', read: ['Brand locations and store details', 'Location mapping and connection health'], history: 'We match the stores that appear to the locations you expect to see.', scope: 'Choose the brand locations GradientOS should include.', validation: 'We check that the right brand locations came through.', eta: 'About 5 minutes for you · up to 15 minutes for GradientOS to check the first sync' }
};
const providerLogoUrls = {
  meta: 'https://cdn.simpleicons.org/meta/0866FF',
  tiktok: 'https://cdn.simpleicons.org/tiktok/EE1D52',
  google: 'https://cdn.simpleicons.org/google/4285F4',
  toast: 'https://cdn.simpleicons.org/toast/FF4F00',
  pos: 'https://cdn.simpleicons.org/databricks/FF3621',
  doordash: 'https://cdn.simpleicons.org/doordash/FF3008',
  ubereats: 'https://cdn.simpleicons.org/ubereats/06C167'
};

let selectedProvider = 'meta';
let flowStep = 0;

function providerLogo(id, compact = false) {
  const info = providerInfo[id];
  return `<span class="provider-logo provider-${id} ${compact ? 'provider-logo-compact' : ''}"><img src="${providerLogoUrls[id]}" alt="${info.name} logo" /></span>`;
}

function focusCard(connection) {
  const info = providerInfo[connection.id];
  const isPaidMedia = connection.id === 'meta' || connection.id === 'tiktok' || connection.id === 'google';
  const actionLabel = connection.status === 'connected' ? 'Review connection' : connection.id === 'meta' ? 'Connect Meta' : connection.id === 'tiktok' ? 'Connect TikTok' : connection.id === 'google' ? 'Connect Google' : connection.id === 'toast' ? 'Connect Toast' : connection.id === 'pos' ? 'Connect other POS' : 'View setup';
  return `<article class="connection-card ${isPaidMedia ? 'connection-card-focus' : ''}"><div class="connection-head">${providerLogo(connection.id)}<div><h3>${connection.name}</h3><small>${info.label}</small></div><span class="integration-state state-${connection.status}">${connection.status.replace('_', ' ')}</span></div><div class="connection-guidance"><div><span>WHO SHOULD DO THIS</span><p>${info.requirement}</p></div><div><span>WHAT HAPPENS NEXT</span><p>They sign in, choose the brand account(s), and GradientOS checks the first sync.</p></div></div><p class="connection-eta">${info.eta}</p><button class="connection-action" data-connect="${connection.id}"><span>${actionLabel}</span><i aria-hidden="true">→</i></button></article>`;
}

function renderSetupStatus(connections) {
  const total = connections.length || 5;
  const ready = connections.filter(connection => connection.status === 'connected').length;
  const stage = ready === 0 ? 1 : ready < total ? 3 : 4;
  const copy = ready === 0
    ? ['Choose your first integration', 'Start with the paid-media source you use most.']
    : ready < total
      ? [`${ready} of ${total} integrations ready`, 'Connect the remaining sources, then we will validate their first sync.']
      : ['All integrations are ready', 'Your sources have completed validation and are ready for analytics.'];
  document.getElementById('setupStatusSummary').textContent = copy[0];
  document.getElementById('setupStatusDetail').textContent = copy[1];
  document.getElementById('setupProgressFill').style.width = `${Math.max(9, (ready / total) * 100)}%`;
  document.querySelectorAll('[data-setup-stage]').forEach(item => {
    const itemStage = Number(item.dataset.setupStage);
    item.classList.toggle('complete', itemStage < stage);
    item.classList.toggle('active', itemStage === stage);
  });
}

function renderConnections(connections) {
  const order = ['meta', 'tiktok', 'google', 'toast', 'pos', 'doordash', 'ubereats'];
  const ordered = [...connections].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  renderSetupStatus(ordered);
  connectionGrid.innerHTML = ordered.map(focusCard).join('');
  connectionGrid.querySelectorAll('[data-connect]').forEach(button => button.addEventListener('click', () => openConnection(button.dataset.connect)));
}

function footer() {
  return `<div class="flow-footer"><button type="button" class="flow-back" ${flowStep === 0 ? 'disabled' : ''}>Back</button><button type="button" class="flow-next">${flowStep === 3 ? 'Finish setup' : 'Continue →'}</button></div>`;
}

function flowMarkup(provider) {
  const info = providerInfo[provider];
  const icon = providerLogo(provider, true);
  const providerLine = `<div class="connection-provider">${icon}<span>${info.name} access setup</span><span class="flow-step-label">Step ${flowStep + 1} of 4</span></div>`;
  const timing = `<p class="flow-timing">${info.eta}</p>`;
  if (flowStep === 0) return `<section class="connection-flow-step active">${providerLine}<span class="flow-kicker">1 · WHO SHOULD DO THIS</span><h3>Invite the person who has access.</h3><p>${info.requirement}</p><div class="access-readiness"><span>THEIR ONE JOB</span><strong>They sign in and approve read-only access. No password is shared with GradientOS.</strong><small>Expected time: about 2 minutes.</small></div>${timing}${footer()}</section>`;
  if (flowStep === 1) return `<section class="connection-flow-step active">${providerLine}<span class="flow-kicker">2 · WHAT THEY WILL DO</span><h3>Review the simple access summary.</h3><p>GradientOS only reads the information needed to build your analytics. It cannot create, edit, pause, or change anything in ${info.name}.</p><ul class="data-contract">${info.read.map(item => `<li><span>✓</span><span>${item}</span></li>`).join('')}</ul><div class="access-callout"><strong>What happens after</strong><br/>${info.history}</div>${timing}${footer()}</section>`;
  if (flowStep === 2) return `<section class="connection-flow-step active">${providerLine}<span class="flow-kicker">3 · CONNECT SECURELY</span><h3>They approve access in ${info.name}.</h3><p>${info.authorization}</p><div class="authorization-card">${icon}<div><strong>Secure ${info.name} sign-in</strong><small>They will briefly leave GradientOS, approve access, then come right back.</small></div></div><button type="button" class="provider-authorize" data-authorize="${provider}">Continue to ${info.name}</button><p class="authorization-status" id="authorizationStatus">Expected time: about 2 minutes.</p>${timing}${footer()}</section>`;
  return `<section class="connection-flow-step active">${providerLine}<span class="flow-kicker">4 · CHOOSE ACCOUNTS</span><h3>You choose what GradientOS can include.</h3><p>${info.scope}</p><div class="scope-placeholder"><span>ACCOUNT / STORE SELECTION</span><strong>We will show the accounts or locations available to you after sign-in.</strong><small>You choose what to include. You can remove access later.</small></div><div class="validation-row"><span>✓</span><div><strong>What GradientOS does next</strong><br/>${info.validation}</div></div><p class="flow-timing">Expected time: about 1 minute for you, then up to 15 minutes while GradientOS checks the first sync.</p>${footer()}</section>`;
}

function renderFlow() {
  connectionFlow.innerHTML = flowMarkup(selectedProvider);
  document.querySelectorAll('.modal-step').forEach((item, index) => { item.classList.toggle('active', index === flowStep); item.classList.toggle('complete', index < flowStep); });
  const stepNames = ['Choose the access owner', 'Confirm what GradientOS can read', 'Approve secure sign-in', 'Choose the accounts to include'];
  document.getElementById('flowProgressText').textContent = `Step ${flowStep + 1} of 4 · ${stepNames[flowStep]}`;
  connectionFlow.querySelector('.flow-next').addEventListener('click', () => {
    if (flowStep < 3) { flowStep += 1; renderFlow(); return; }
    connectionFlow.innerHTML = `<section class="connection-flow-step active"><div class="completion-icon">✓</div><span class="step-kicker">SETUP PLAN SAVED</span><h3>Ready for the secure handoff.</h3><p>GradientOS will only begin ingestion after the provider authorizes access, you select scope, and the first sync passes validation.</p><div class="flow-footer"><span></span><button type="button" class="flow-next" id="finishConnection">Done</button></div></section>`;
    document.querySelectorAll('.modal-step').forEach(item => item.classList.add('complete'));
    document.getElementById('flowProgressText').textContent = 'Setup plan complete · waiting for provider authorization';
    document.getElementById('finishConnection').addEventListener('click', closeConnection);
  });
  connectionFlow.querySelector('.flow-back').addEventListener('click', () => { if (flowStep > 0) { flowStep -= 1; renderFlow(); } });
  const authorize = connectionFlow.querySelector('[data-authorize]');
  if (authorize) authorize.addEventListener('click', () => {
    const status = document.getElementById('authorizationStatus');
    status.textContent = `Secure ${providerInfo[selectedProvider].name} authorization will open here once the GradientOS provider application is configured and approved. No access has been requested in this workspace.`;
    status.classList.add('authorization-pending');
  });
}

function openConnection(provider) {
  const directUrl = providerInfo[provider]?.directUrl;
  if (directUrl) {
    window.location.assign(directUrl);
    return;
  }
  selectedProvider = provider;
  flowStep = 0;
  renderFlow();
  connectionModal.classList.remove('hidden');
}
function closeConnection() { connectionModal.classList.add('hidden'); }
window.openProviderSetup = openConnection;
document.getElementById('closeConnection').addEventListener('click', closeConnection);
connectionModal.addEventListener('click', event => { if (event.target === connectionModal) closeConnection(); });

fetch(`/api/integrations${window.growthOSDemo?.query() || ''}`).then(response => response.json()).then(renderConnections).catch(() => renderConnections([]));
