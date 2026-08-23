const deliveryCampaigns = [
  { id: 'dd-oak-20', name: 'Existing 20% off up to $10', marketplace: 'doordash', location: 'river-north', locationLabel: 'River North', sales: 92104, spend: 17152, credit: 109, roi: 5.37, attributed: 4.36, margin: 77.07, budget: 'Uncapped', status: 'Co-funded' },
  { id: 'dd-bogo', name: 'Lunch BOGO', marketplace: 'doordash', location: 'west-loop', locationLabel: 'West Loop', sales: 32056, spend: 13699, credit: 0, roi: 2.34, attributed: 2.42, margin: 58.69, budget: 'Uncapped', status: 'New' },
  { id: 'ue-30', name: '30% off, up to $35', marketplace: 'ubereats', location: 'river-north', locationLabel: 'River North', sales: 22331, spend: 6811, credit: 2114, roi: 3.28, attributed: 3.64, margin: 72.5, budget: 'Uncapped', status: 'Co-funded' },
  { id: 'ue-item', name: 'Free item (spend $35)', marketplace: 'ubereats', location: 'wicker-park', locationLabel: 'Wicker Park', sales: 12935, spend: 4921, credit: 1661, roi: 2.63, attributed: 3.39, margin: 70.53, budget: 'Uncapped', status: 'New' }
];

const deliveryNames = { doordash: 'DoorDash', ubereats: 'Uber Eats' };
const deliveryMoney = value => `$${Math.round(value).toLocaleString('en-US')}`;

function selectedDeliveryCampaigns() {
  const location = document.getElementById('deliveryLocation').value;
  const marketplace = document.getElementById('deliveryMarketplace').value;
  return deliveryCampaigns.filter(item => (location === 'all' || item.location === location) && (marketplace === 'all' || item.marketplace === marketplace));
}

function renderDeliveryAnalytics() {
  const rows = selectedDeliveryCampaigns();
  const sales = rows.reduce((sum, row) => sum + row.sales, 0);
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const credit = rows.reduce((sum, row) => sum + row.credit, 0);
  const roi = spend ? (sales / spend).toFixed(2) : '—';
  document.getElementById('deliveryKpis').innerHTML = `<article><span>REPORTED SALES</span><strong>${deliveryMoney(sales)}</strong><small>selected campaigns</small></article><article><span>MARKETING SPEND</span><strong>${deliveryMoney(spend)}</strong><small>promotion and ads spend</small></article><article><span>MARKETING CREDIT</span><strong>${deliveryMoney(credit)}</strong><small>marketplace funded</small></article><article><span>REPORTED ROI</span><strong>${roi}x</strong><small>sales ÷ spend</small></article>`;
  document.getElementById('deliveryCampaignCount').textContent = `${rows.length} active`;
  document.getElementById('deliveryTable').innerHTML = `<div class="delivery-table-row header"><span>Campaign</span><span>Marketplace</span><span>Location</span><span>Sales</span><span>Spend</span><span>Credit</span><span>Reported ROI</span><span>Attributed ROI</span><span>Margin</span><span>Budget</span></div>${rows.map(row => `<div class="delivery-table-row"><span class="delivery-campaign"><i class="${row.marketplace}">${row.marketplace === 'doordash' ? 'D' : 'UE'}</i><b>${row.name}</b><small>${row.status} · Active</small></span><span class="delivery-provider ${row.marketplace}">${deliveryNames[row.marketplace]}</span><span>${row.locationLabel}</span><strong class="delivery-sales">${deliveryMoney(row.sales)}</strong><span>${deliveryMoney(row.spend)}</span><span>${deliveryMoney(row.credit)}</span><span>${row.roi.toFixed(2)}x</span><span>${row.attributed.toFixed(2)}x</span><span>${row.margin.toFixed(1)}%</span><span>${row.budget}</span></div>`).join('') || `<p class="delivery-no-results">No campaigns match those filters.</p>`}`;
}

function postDeliveryChat(text, role = 'agent', detail = '') {
  const messages = document.getElementById('deliveryChatMessages');
  const node = document.createElement('div');
  node.className = `delivery-message ${role === 'user' ? 'is-user' : 'is-agent'}`;
  node.innerHTML = `<span>${role === 'user' ? 'YOU' : 'DELIVERY RETRIEVAL AGENT'}</span><p></p>`;
  node.querySelector('p').textContent = text;
  if (detail) { const note = document.createElement('small'); note.textContent = detail; node.append(note); }
  messages.append(node);
  messages.scrollTop = messages.scrollHeight;
}

async function askDeliveryAgent(question) {
  const input = document.getElementById('deliveryChatInput');
  const button = document.querySelector('#deliveryChatForm button');
  postDeliveryChat(question, 'user');
  input.disabled = true; button.disabled = true;
  const progress = document.createElement('div');
  progress.className = 'delivery-progress';
  progress.textContent = 'Retrieving marketplace campaign records…';
  document.getElementById('deliveryChatMessages').append(progress);
  try {
    const [response] = await Promise.all([
      fetch('/api/agent-chat?demo=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'delivery', message: question, dimension: 'campaign', range: `last_${document.getElementById('deliveryRange').value}_days`, demo: true }) }),
      new Promise(resolve => window.setTimeout(resolve, 1200))
    ]);
    const result = await response.json();
    progress.remove();
    if (!response.ok) throw new Error(result.error || 'Retrieval unavailable');
    postDeliveryChat(result.answer, 'agent', `${result.plan.tool} · ${result.findings.map(item => `${item.label}: ${item.value}`).join(' · ')}`);
  } catch {
    progress.remove();
    postDeliveryChat('I could not retrieve delivery campaign data right now. No marketplace settings were changed.', 'agent', 'Read-only retrieval · retry after checking the connection');
  } finally { input.disabled = false; button.disabled = false; input.focus(); }
}

['deliveryLocation', 'deliveryMarketplace', 'deliveryRange'].forEach(id => document.getElementById(id).addEventListener('change', renderDeliveryAnalytics));
document.getElementById('deliveryReset').addEventListener('click', () => { document.getElementById('deliveryLocation').value = 'all'; document.getElementById('deliveryMarketplace').value = 'all'; document.getElementById('deliveryRange').value = '28'; renderDeliveryAnalytics(); });
document.getElementById('deliveryChatForm').addEventListener('submit', event => { event.preventDefault(); const input = document.getElementById('deliveryChatInput'); const question = input.value.trim(); if (!question || input.disabled) return; input.value = ''; askDeliveryAgent(question); });
document.querySelectorAll('[data-delivery-prompt]').forEach(button => button.addEventListener('click', () => askDeliveryAgent(button.dataset.deliveryPrompt)));
postDeliveryChat('I can retrieve and explain read-only DoorDash and Uber Eats campaign metrics in this workspace.', 'agent', 'Preview marketplace reporting');
renderDeliveryAnalytics();
