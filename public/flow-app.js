/* GrowthOS — streamlined connect → insights flow. All data is mock/demo. */
(function () {
  'use strict';

  // --- Mock channel data (last 30 days). prevRoas drives the trend. ---
  const CHANNELS = [
    { id: 'meta',      name: 'Meta',       mono: 'M',  color: '#4f8cff', spend: 28000, sales: 89600, prevRoas: 3.00 },
    { id: 'google',    name: 'Google Ads', mono: 'G',  color: '#f9ab00', spend: 22000, sales: 63800, prevRoas: 2.60 },
    { id: 'tiktok',    name: 'TikTok',     mono: 'T',  color: '#ff4d6d', spend: 18000, sales: 34200, prevRoas: 2.40 },
    { id: 'doordash',  name: 'DoorDash',   mono: 'DD', color: '#ff3008', spend: 15000, sales: 33000, prevRoas: 2.60 },
    { id: 'ubereats',  name: 'Uber Eats',  mono: 'UE', color: '#06c167', spend: 16000, sales: 20800, prevRoas: 1.60 },
    { id: 'deliveroo', name: 'Deliveroo',  mono: 'De', color: '#00ccbc', spend: 11000, sales: 8800,  prevRoas: 1.10 },
    { id: 'grubhub',   name: 'Grubhub',    mono: 'Gr', color: '#f63440', spend: 9000,  sales: 7650,  prevRoas: 0.80 }
  ].map(c => {
    const roas = c.sales / c.spend;
    return { ...c, roas, trend: (roas - c.prevRoas) / c.prevRoas };
  });

  // --- Formatting helpers ---
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const money2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = v => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
  const roasText = v => `${money2.format(v)}`;

  // --- Performance badge: ROAS level + trend ---
  function badge(c) {
    if (c.roas < 1.0) return { key: 'poor', label: 'Underperforming', emoji: '🔴', tone: 'poor' };
    if (c.roas >= 2.0 && c.trend >= -0.05) return { key: 'well', label: 'Working well', emoji: '✅', tone: 'well' };
    return { key: 'watch', label: 'Watch', emoji: '🟡', tone: 'watch' };
  }

  // --- Plain-English insight from level + trend ---
  function insight(c) {
    const b = badge(c);
    const dir = c.trend >= 0 ? `up ${pct(c.trend)}` : `down ${pct(Math.abs(c.trend)).replace('+', '')}`;
    if (b.key === 'well') return `${c.name} is one of your strongest channels — ${roasText(c.roas)} back for every $1 spent, and ${dir} vs. last month. Good candidate for more budget.`;
    if (b.key === 'poor') return `${c.name} is losing money — only ${roasText(c.roas)} back per $1 spent (${dir}). Worth pausing or reworking the offer before spending more.`;
    if (c.roas >= 2.0) return `${c.name} is still profitable at ${roasText(c.roas)} per $1, but it's ${dir} — keep an eye on rising costs before it slips.`;
    return `${c.name} is near break-even at ${roasText(c.roas)} per $1 and ${dir}. Review targeting and creative before scaling.`;
  }

  // --- State ---
  const state = {
    // Demo starts with all 7 connected so reviewers see a full dashboard.
    connections: Object.fromEntries(CHANNELS.map(c => [c.id, true])),
    active: null
  };
  const connectedChannels = () => CHANNELS.filter(c => state.connections[c.id]);
  const connectedCount = () => connectedChannels().length;

  // --- Screen navigation ---
  function setScreen(name) {
    document.body.dataset.screen = name;
    const isLogin = name === 'login';
    document.querySelectorAll('[data-screen-chrome]').forEach(el => { el.hidden = isLogin; });
    document.querySelectorAll('[data-screen-panel]').forEach(el => {
      el.classList.toggle('active', el.dataset.screenPanel === name);
    });
    document.getElementById('connectionsLink').hidden = (name === 'login' || name === 'connect');
    window.scrollTo(0, 0);
    if (name === 'connect') renderConnect();
    if (name === 'dashboard') renderDashboard();
  }

  // --- ② Connect screen ---
  function renderConnect() {
    const grid = document.getElementById('providerGrid');
    grid.innerHTML = CHANNELS.map(c => {
      const on = state.connections[c.id];
      return `<article class="provider-card ${on ? 'connected' : ''}" data-provider="${c.id}">
        <div class="provider-id"><span class="provider-mono" style="background:${c.color}22;color:${c.color};border-color:${c.color}55">${c.mono}</span><strong>${c.name}</strong></div>
        <button class="btn ${on ? 'btn-connected' : 'btn-outline'} btn-sm provider-toggle" type="button" data-provider="${c.id}">${on ? '✓ Connected' : 'Connect'}</button>
      </article>`;
    }).join('');
    const n = connectedCount();
    document.getElementById('connectCount').textContent = `${n} of ${CHANNELS.length} connected`;
    const go = document.getElementById('goDashboard');
    go.disabled = n < 1;
    document.getElementById('gateHint').style.visibility = n < 1 ? 'visible' : 'hidden';
  }

  function toggleProvider(id) {
    const card = document.querySelector(`.provider-card[data-provider="${id}"]`);
    if (state.connections[id]) { state.connections[id] = false; renderConnect(); return; }
    // brief mock "connecting…" state
    const btn = card.querySelector('.provider-toggle');
    btn.textContent = 'Connecting…';
    btn.disabled = true;
    setTimeout(() => { state.connections[id] = true; renderConnect(); }, 550);
  }

  // --- ③ Dashboard ---
  function statTile(label, value, sub, tone) {
    return `<article class="stat-tile"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong>${sub ? `<em class="stat-sub ${tone || ''}">${sub}</em>` : ''}</article>`;
  }

  function renderDashboard() {
    const chans = connectedChannels();
    const sales = chans.reduce((s, c) => s + c.sales, 0);
    const spend = chans.reduce((s, c) => s + c.spend, 0);
    const roas = spend > 0 ? sales / spend : 0;
    document.getElementById('dashScope').textContent = `Across ${chans.length} connected channel${chans.length === 1 ? '' : 's'} · last 30 days`;
    document.getElementById('statRow').innerHTML =
      statTile('Total sales', money.format(sales), 'Attributed to marketing', '') +
      statTile('Marketing spend', money.format(spend), 'Across all channels', '') +
      statTile('Blended ROAS', roasText(roas), `${roas >= 1 ? 'Making more than you spend' : 'Spending more than you make'}`, roas >= 1 ? 'good' : 'bad');

    const ranked = [...chans].sort((a, b) => b.roas - a.roas);
    const groups = { well: [], watch: [], poor: [] };
    ranked.forEach(c => groups[badge(c).key].push(c));
    fillGroup('groupWell', 'Working well', groups.well);
    fillGroup('groupWatch', 'Watch', groups.watch);
    fillGroup('groupPoor', 'Underperforming', groups.poor);
  }

  function fillGroup(elId, title, list) {
    const el = document.getElementById(elId);
    if (!list.length) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<div class="group-title group-${list[0] && badge(list[0]).tone}">${title} <span>${list.length}</span></div>` +
      list.map(c => {
        const b = badge(c);
        return `<button class="channel-row" type="button" data-channel="${c.id}">
          <span class="channel-id"><span class="provider-mono sm" style="background:${c.color}22;color:${c.color};border-color:${c.color}55">${c.mono}</span><strong>${c.name}</strong></span>
          <span class="channel-metrics">
            <span><small>Spend</small>${money.format(c.spend)}</span>
            <span><small>Sales</small>${money.format(c.sales)}</span>
            <span class="channel-roas"><small>ROAS</small>${roasText(c.roas)}</span>
            <span class="channel-trend ${c.trend >= 0 ? 'up' : 'down'}">${c.trend >= 0 ? '▲' : '▼'} ${pct(c.trend).replace('+', '')}</span>
          </span>
          <span class="badge badge-${b.tone}">${b.emoji} ${b.label}</span>
          <span class="channel-go">›</span>
        </button>`;
      }).join('');
  }

  // --- ④ Deep-dive ---
  const seasonSales = { 0: 1.02, 1: 0.82, 2: 0.85, 3: 0.9, 4: 1.0, 5: 1.22, 6: 1.28 };
  const seasonSpend = { 0: 0.95, 1: 0.98, 2: 1.0, 3: 1.03, 4: 1.06, 5: 1.08, 6: 0.9 };
  function daily(total, season, days) {
    const w = [];
    const start = new Date('2026-07-28T12:00:00');
    for (let i = 0; i < days; i++) { const d = new Date(start); d.setDate(d.getDate() + i); w.push(season[d.getDay()] * (1 + i * 0.006)); }
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    return w.map(x => (x / sum) * total);
  }

  function renderDetail(id) {
    const c = CHANNELS.find(x => x.id === id);
    if (!c) return;
    state.active = id;
    const b = badge(c);
    document.getElementById('detailHead').innerHTML =
      `<div class="detail-title"><span class="provider-mono" style="background:${c.color}22;color:${c.color};border-color:${c.color}55">${c.mono}</span><h1>${c.name}</h1><span class="badge badge-${b.tone}">${b.emoji} ${b.label}</span></div>`;
    document.getElementById('detailStats').innerHTML =
      statTile('Marketing spend', money.format(c.spend), 'Last 30 days', '') +
      statTile('Attributed sales', money.format(c.sales), 'Last 30 days', '') +
      statTile('ROAS', roasText(c.roas), `${c.trend >= 0 ? '▲' : '▼'} ${pct(c.trend).replace('+', '')} vs. last month`, c.trend >= 0 ? 'good' : 'bad');
    document.getElementById('detailInsight').innerHTML = `<span class="insight-mark">${b.emoji}</span><p>${insight(c)}</p>`;
    renderDetailChart(c);
    renderCampaigns(c);
    setScreen('detail');
  }

  function renderDetailChart(c) {
    const svg = document.getElementById('detailChart');
    const days = 30;
    const sales = daily(c.sales, seasonSales, days);
    const spend = daily(c.spend, seasonSpend, days);
    const width = Math.max(svg.clientWidth || 760, 320);
    const height = 240, padL = 58, padR = 18, padT = 16, padB = 30;
    const plotW = width - padL - padR, plotH = height - padT - padB;
    const max = (Math.max(...sales, ...spend) || 1) * 1.12;
    const x = i => padL + i * (plotW / (days - 1));
    const y = v => padT + plotH - (v / max) * plotH;
    const line = data => data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const fracs = [0, 0.5, 1];
    const grid = fracs.map(f => { const gy = (padT + plotH - f * plotH).toFixed(1); return `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}"/>`; }).join('');
    const yLabels = fracs.map(f => `<text class="axis" x="${padL - 8}" y="${(padT + plotH - f * plotH + 4).toFixed(1)}" text-anchor="end">${money.format(max * f)}</text>`).join('');
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const start = new Date('2026-07-28T12:00:00');
    let xLabels = '';
    for (let i = 0; i < days; i += 6) { const d = new Date(start); d.setDate(d.getDate() + i); xLabels += `<text class="axis" x="${x(i).toFixed(1)}" y="${height - 10}" text-anchor="middle">${fmt.format(d)}</text>`; }
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `${grid}${yLabels}<polyline class="line-spend" points="${line(spend)}"/><polyline class="line-sales" points="${line(sales)}"/>${xLabels}`;
  }

  function renderCampaigns(c) {
    // Deterministic mock campaigns derived from the channel totals.
    const splits = [0.5, 0.3, 0.2];
    const names = {
      meta: ['Weekend Reach — Chicago', 'Retargeting — Cart', 'New Menu Launch'],
      google: ['Branded Search', 'Non-brand — "delivery near me"', 'Performance Max'],
      tiktok: ['Spark Ads — Trending', 'Creator Collab', 'Lunch Deals'],
      doordash: ['Sponsored Listing', 'Promoted Placement', '$0 Delivery Promo'],
      ubereats: ['Homepage Banner', 'Offers — BOGO', 'Sponsored Search'],
      deliveroo: ['Top Placement', 'Free Delivery Offer', 'New Customer Push'],
      grubhub: ['Sponsored Brand', 'Loyalty Promo', 'Category Boost']
    }[c.id] || ['Campaign A', 'Campaign B', 'Campaign C'];
    const rows = splits.map((s, i) => {
      const spend = c.spend * s;
      const roasVar = c.roas * (i === 0 ? 1.12 : i === 1 ? 0.95 : 0.78);
      const sales = spend * roasVar;
      return `<div class="campaign-row"><span>${names[i]}</span><span>${money.format(spend)}</span><span>${money.format(sales)}</span><span class="cr-roas ${roasVar >= 1 ? '' : 'neg'}">${roasText(roasVar)}</span></div>`;
    }).join('');
    document.getElementById('campaignTable').innerHTML =
      `<div class="campaign-row campaign-head"><span>Campaign</span><span>Spend</span><span>Sales</span><span>ROAS</span></div>${rows}`;
  }

  // --- Events ---
  document.getElementById('loginForm').addEventListener('submit', e => { e.preventDefault(); setScreen('connect'); });
  document.getElementById('connectAll').addEventListener('click', () => { CHANNELS.forEach(c => { state.connections[c.id] = true; }); renderConnect(); });
  document.getElementById('goDashboard').addEventListener('click', () => setScreen('dashboard'));
  document.getElementById('connectionsLink').addEventListener('click', () => setScreen('connect'));
  document.getElementById('homeButton').addEventListener('click', () => setScreen(connectedCount() ? 'dashboard' : 'connect'));
  document.getElementById('backButton').addEventListener('click', () => setScreen('dashboard'));
  document.addEventListener('click', e => {
    const toggle = e.target.closest('.provider-toggle');
    if (toggle) { toggleProvider(toggle.dataset.provider); return; }
    const row = e.target.closest('.channel-row');
    if (row) { renderDetail(row.dataset.channel); }
  });
  window.addEventListener('resize', () => { if (document.body.dataset.screen === 'detail' && state.active) renderDetailChart(CHANNELS.find(c => c.id === state.active)); });

  setScreen('login');
})();
