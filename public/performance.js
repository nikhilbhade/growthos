const emptyAnalytics = document.getElementById('emptyAnalytics');
const playgroundLive = document.getElementById('chartLive');
const chart = document.getElementById('performanceChart');
const chartChange = document.getElementById('chartChange');
const spendChart = document.getElementById('spendTrendChart');
const spendChange = document.getElementById('spendTrendChange');
const chartNote = document.getElementById('chartNote');
const scope = document.getElementById('analyticsScope');
const marketplaceFilter = document.getElementById('marketplaceFilter');
const locationFilter = document.getElementById('locationFilter');
const channelFilter = document.getElementById('channelFilter');
const sameStores = document.getElementById('sameStores');
const filters = [marketplaceFilter, locationFilter, channelFilter, sameStores];
const locations = [
  { id: 'river-north', name: 'River North', previous: { payout: 46300, sales: 61800, orders: 2040, spend: 8120, ads: 7220, promos: 980, commission: 8920, marketing: 25700, organic: 36100 }, current: { payout: 77100, sales: 103600, orders: 3370, spend: 13780, ads: 12120, promos: 1760, commission: 16800, marketing: 46100, organic: 57500 } },
  { id: 'west-loop', name: 'West Loop', previous: { payout: 38800, sales: 52100, orders: 1770, spend: 6780, ads: 6080, promos: 720, commission: 7410, marketing: 21100, organic: 31000 }, current: { payout: 64800, sales: 86900, orders: 2860, spend: 10720, ads: 9440, promos: 1310, commission: 13350, marketing: 36600, organic: 50300 } },
  { id: 'wicker-park', name: 'Wicker Park', previous: { payout: 32700, sales: 43800, orders: 1490, spend: 5410, ads: 4840, promos: 610, commission: 6180, marketing: 17100, organic: 26700 }, current: { payout: 54700, sales: 73400, orders: 2370, spend: 8750, ads: 7680, promos: 1120, commission: 10910, marketing: 30100, organic: 43300 } }
];
const marketplaceWeights = { all: 1, meta: 0.31, tiktok: 0.18, google: 0.26, doordash: 0.15, ubereats: 0.1 };
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
let mode = 'yoy';
let hasData = false;
let calendarOpen = false;
let yoyBasis = 'weekday';
let selectedRange = { start: '2026-08-01', end: '2026-08-30' };
const calendarToggleButton = document.querySelector('[data-mode="custom"]');
calendarToggleButton.removeAttribute('data-mode');
calendarToggleButton.dataset.openCalendar = '';
calendarToggleButton.textContent = 'Calendar range';

function formatDate(value) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); }
function daysBetween(start, end) { return Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1); }
function dateShift(value, days) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function calendarYearBefore(value) { const date = new Date(`${value}T12:00:00`); const year = date.getFullYear() - 1; const month = date.getMonth(); const day = date.getDate(); const lastDay = new Date(year, month + 1, 0).getDate(); return new Date(year, month, Math.min(day, lastDay), 12).toISOString().slice(0, 10); }
function activeRange() {
  const totalDays = daysBetween(selectedRange.start, selectedRange.end);
  const previousStart = mode === 'pop' ? dateShift(selectedRange.start, -totalDays) : yoyBasis === 'weekday' ? dateShift(selectedRange.start, -364) : calendarYearBefore(selectedRange.start);
  const previousEnd = mode === 'pop' ? dateShift(selectedRange.start, -1) : yoyBasis === 'weekday' ? dateShift(selectedRange.end, -364) : calendarYearBefore(selectedRange.end);
  return { previous: `${formatDate(previousStart)} – ${formatDate(previousEnd)}`, current: `${formatDate(selectedRange.start)} – ${formatDate(selectedRange.end)}`, multiplier: totalDays / 30 };
}
function renderCalendar() {
  let controls = document.getElementById('calendarControls');
  if (!controls) {
    controls = document.createElement('div'); controls.id = 'calendarControls'; controls.className = 'custom-date-controls calendar-controls';
    controls.innerHTML = `<label>Current period start<input type="date" data-current-date="start" value="${selectedRange.start}" /></label><label>Current period end<input type="date" data-current-date="end" value="${selectedRange.end}" /></label><label class="yoy-basis">YoY comparison basis<select id="yoyBasis"><option value="weekday">52-week aligned · marketing + agent</option><option value="calendar">Calendar year · analytics metrics</option></select></label><small id="calendarRule"></small>`;
    document.querySelector('.comparison-mode').after(controls);
    controls.querySelectorAll('[data-current-date]').forEach(input => input.addEventListener('change', () => { selectedRange[input.dataset.currentDate] = input.value; if (selectedRange.end < selectedRange.start) selectedRange.end = selectedRange.start; renderDemo(); }));
    controls.querySelector('#yoyBasis').addEventListener('change', event => { yoyBasis = event.target.value; renderDemo(); });
  }
  controls.classList.toggle('visible', calendarOpen);
  controls.querySelector('.yoy-basis').classList.toggle('hidden', mode !== 'yoy');
  controls.querySelector('#calendarRule').textContent = mode === 'pop' ? 'PoP compares this range with the immediately preceding equal-length range.' : yoyBasis === 'weekday' ? 'YoY uses 364 days earlier so weekdays align.' : 'YoY uses the same calendar dates one year earlier.';
}

function filterValues(select) { return window.GrowthOSFilters?.values(select) || (select.value === 'all' ? [] : [select.value]); }
function filterIsAll(select) { return window.GrowthOSFilters?.isAll(select) ?? select.value === 'all'; }
function selectedLocations() { const values = filterValues(locationFilter); return filterIsAll(locationFilter) ? locations : locations.filter(location => values.includes(location.id)); }
function marketFactor() { return filterIsAll(marketplaceFilter) ? 1 : Math.min(1, filterValues(marketplaceFilter).reduce((total, value) => total + (marketplaceWeights[value] || 0), 0)); }
function channelAdjustments(metric) {
  if (filterIsAll(channelFilter)) return 1;
  return Math.min(1, filterValues(channelFilter).reduce((total, channel) => {
    if (channel === 'organic') return total + (['organic', 'sales', 'payout', 'orders'].includes(metric) ? 0.56 : 0);
    if (channel === 'paid') return total + (['marketing', 'spend', 'ads', 'promos', 'sales', 'payout', 'orders'].includes(metric) ? 0.42 : 0);
    return total + (['payout', 'sales', 'commission', 'marketing', 'orders'].includes(metric) ? 0.29 : metric === 'spend' ? 0.18 : 0);
  }, 0));
}
function total(period, metric) { return selectedLocations().reduce((sum, location) => sum + location[period][metric] * marketFactor() * channelAdjustments(metric) * activeRange().multiplier, 0); }
function metricValue(period, metric) {
  if (metric === 'aov') return total(period, 'sales') / Math.max(total(period, 'orders'), 1);
  if (metric === 'spend' && isPaidMediaOnly()) return total(period, 'ads');
  return total(period, metric);
}
function selectedMarketplaces() { return filterIsAll(marketplaceFilter) ? ['meta', 'tiktok', 'google', 'doordash', 'ubereats'] : filterValues(marketplaceFilter); }
function hasMarketplaceCommission() { return selectedMarketplaces().some(value => value === 'doordash' || value === 'ubereats'); }
function isPaidMediaOnly() { const values = selectedMarketplaces(); return values.length > 0 && values.every(value => ['meta', 'tiktok', 'google'].includes(value)); }
function percentage(previous, current) { return previous === 0 ? 0 : ((current - previous) / previous) * 100; }
function signedPercentage(previous, current) { const value = percentage(previous, current); return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`; }

function periodLabels() {
  const preset = activeRange();
  document.getElementById('previousLabel').textContent = preset.previous;
  document.getElementById('currentLabel').textContent = preset.current;
  document.getElementById('ledgerPrevious').textContent = preset.previous;
  document.getElementById('ledgerCurrent').textContent = preset.current;
}

function metricRow(label, field, options = {}) {
  const previous = metricValue('previous', field);
  const current = metricValue('current', field);
  const delta = percentage(previous, current);
  const badWhenUp = options.badWhenUp === true;
  const tone = (badWhenUp ? delta > 0 : delta < 0) ? 'negative' : 'positive';
  const detail = options.details ? `<div class="ledger-subrows">${options.details.map(([detailLabel, detailField]) => `<span>${detailLabel} <b>${money.format(total('current', detailField))}</b></span>`).join('')}</div>` : '';
  return `<article class="ledger-row"><div class="ledger-label"><span>${label}</span>${detail}</div><strong>${money.format(previous)}</strong><strong>${money.format(current)}</strong><em class="${tone}">${signedPercentage(previous, current)}</em></article>`;
}

function renderLedger() {
  const ledger = document.getElementById('locationBreakdown');
  const spendDetails = isPaidMediaOnly() ? [['Ads spend', 'ads']] : [['Ads spend', 'ads'], ['Promotional spend', 'promos']];
  const rows = [
    metricRow('Payouts', 'payout'),
    metricRow('Sales', 'sales'),
    metricRow('Spend', 'spend', { badWhenUp: true, details: spendDetails }),
    metricRow('Organic sales', 'organic'),
    metricRow('AOV', 'aov')
  ];
  if (hasMarketplaceCommission()) rows.splice(3, 0, metricRow('Marketplace commission', 'commission', { badWhenUp: true }));
  ledger.innerHTML = rows.join('');
}

function renderTrend() {
  const previous = total('previous', 'sales');
  const current = total('current', 'sales');
  const width = Math.max(chart.clientWidth || 900, 360);
  const height = 220;
  const previousData = [0.12, 0.15, 0.14, 0.17, 0.19, 0.23].map(value => previous * value);
  const currentData = [0.11, 0.14, 0.17, 0.18, 0.19, 0.25].map(value => current * value);
  const max = Math.max(...previousData, ...currentData);
  const points = values => values.map((value, index) => `${44 + index * ((width - 72) / 5)},${190 - (value / max) * 145}`).join(' ');
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((label, index) => `<text x="${44 + index * ((width - 72) / 5)}" y="214" text-anchor="middle">${label}</text>`).join('');
  chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
  chart.innerHTML = `<line x1="34" y1="190" x2="${width - 18}" y2="190"/><line x1="34" y1="112" x2="${width - 18}" y2="112"/><polyline class="previous-line" points="${points(previousData)}"/><polyline class="current-line" points="${points(currentData)}"/>${labels}`;
  chartChange.textContent = `${signedPercentage(previous, current)} sales vs baseline`;
}

function shortDate(iso) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`)); }
const salesSeason = { 0: 1.02, 1: 0.82, 2: 0.85, 3: 0.9, 4: 1.0, 5: 1.22, 6: 1.28 };
const spendSeason = { 0: 0.95, 1: 0.98, 2: 1.0, 3: 1.03, 4: 1.06, 5: 1.08, 6: 0.9 };
function dailySeries(totalValue, season, startIso, days) {
  const weights = [];
  for (let i = 0; i < days; i++) { const weekday = new Date(`${dateShift(startIso, i)}T12:00:00`).getDay(); weights.push(season[weekday] * (1 + i * 0.006)); }
  const sum = weights.reduce((acc, value) => acc + value, 0) || 1;
  return weights.map(value => (value / sum) * totalValue);
}
function renderSpendTrend() {
  const days = daysBetween(selectedRange.start, selectedRange.end);
  const salesTotal = total('current', 'sales');
  const spendTotal = total('current', 'marketing');
  const salesData = dailySeries(salesTotal, salesSeason, selectedRange.start, days);
  const spendData = dailySeries(spendTotal, spendSeason, selectedRange.start, days);
  const width = Math.max(spendChart.clientWidth || 820, 360);
  const height = 220, padL = 50, padR = 54, padT = 16, padB = 26;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const salesMax = (Math.max(...salesData) || 1) * 1.12;
  const spendMax = (Math.max(...spendData) || 1) * 1.12;
  const x = index => padL + (days <= 1 ? plotW / 2 : index * (plotW / (days - 1)));
  const ySales = value => padT + plotH - (value / salesMax) * plotH;
  const ySpend = value => padT + plotH - (value / spendMax) * plotH;
  const line = (data, y) => data.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const fracs = [0, 0.5, 1];
  const grid = fracs.map(frac => { const gy = (padT + plotH - frac * plotH).toFixed(1); return `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}"/>`; }).join('');
  const leftLabels = fracs.map(frac => `<text class="axis-left" x="${padL - 7}" y="${(padT + plotH - frac * plotH + 3).toFixed(1)}">${compactMoney.format(salesMax * frac)}</text>`).join('');
  const rightLabels = fracs.map(frac => `<text class="axis-right" x="${width - padR + 7}" y="${(padT + plotH - frac * plotH + 3).toFixed(1)}">${compactMoney.format(spendMax * frac)}</text>`).join('');
  const step = Math.max(1, Math.round(days / 6));
  let xLabels = '';
  for (let index = 0; index < days; index += step) xLabels += `<text x="${x(index).toFixed(1)}" y="${height - 8}" text-anchor="middle">${shortDate(dateShift(selectedRange.start, index))}</text>`;
  spendChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
  spendChart.innerHTML = `${grid}${leftLabels}${rightLabels}<polyline class="sales-line" points="${line(salesData, ySales)}"/><polyline class="spend-line" points="${line(spendData, ySpend)}"/>${xLabels}`;
  const roas = spendTotal > 0 ? `${(salesTotal / spendTotal).toFixed(2)}x` : '—';
  spendChange.textContent = `${compactMoney.format(salesTotal)} sales · ${compactMoney.format(spendTotal)} spend · ${roas}`;
}

function renderIncrementals() {
  const previousSales = total('previous', 'sales'); const currentSales = total('current', 'sales');
  const previousSpend = total('previous', 'spend'); const currentSpend = total('current', 'spend');
  const incrementalSales = currentSales - previousSales;
  const incrementalSpend = currentSpend - previousSpend;
  const incrementalMarketing = total('current', 'marketing') - total('previous', 'marketing');
  const incrementalOrganic = total('current', 'organic') - total('previous', 'organic');
  document.getElementById('incrementalRoi').textContent = `${(incrementalSales / Math.max(incrementalSpend, 1)).toFixed(2)}x`;
  document.getElementById('incrementalSales').textContent = `↗ ${compactMoney.format(incrementalSales)}`;
  document.getElementById('incrementalSpend').textContent = `↗ ${compactMoney.format(incrementalSpend)}`;
  document.getElementById('incrementalMarketing').textContent = `↗ ${compactMoney.format(incrementalMarketing)}`;
  document.getElementById('incrementalOrganic').textContent = `↗ ${compactMoney.format(incrementalOrganic)}`;
}

function renderScope() {
  const market = window.GrowthOSFilters?.label(marketplaceFilter) || marketplaceFilter.options[marketplaceFilter.selectedIndex].text;
  const location = window.GrowthOSFilters?.label(locationFilter) || locationFilter.options[locationFilter.selectedIndex].text;
  const channel = window.GrowthOSFilters?.label(channelFilter) || channelFilter.options[channelFilter.selectedIndex].text;
  scope.textContent = `${location} · ${market} · ${channel}`;
  const comparisonNote = mode === 'pop' ? 'PoP uses the immediately preceding equal-length period.' : yoyBasis === 'weekday' ? 'YoY is 52-week aligned for marketing and agent reporting.' : 'YoY uses the same calendar dates one year earlier for analytics metrics.';
  chartNote.textContent = `Synthetic demo data only · ${market}, ${location}, ${channel}. ${comparisonNote}`;
}

window.GrowthOSSummary = function () {
  if (!hasData) return null;
  const days = daysBetween(selectedRange.start, selectedRange.end);
  const salesCur = total('current', 'sales');
  const salesPrev = total('previous', 'sales');
  const spendCur = total('current', 'marketing');
  const spendPrev = total('previous', 'marketing');
  return {
    days,
    sales: salesCur, salesPrev, salesChange: percentage(salesPrev, salesCur),
    spend: spendCur, spendPrev, spendChange: percentage(spendPrev, spendCur),
    roas: spendCur > 0 ? salesCur / spendCur : 0,
    dailySales: dailySeries(salesCur, salesSeason, selectedRange.start, days),
    dailySpend: dailySeries(spendCur, spendSeason, selectedRange.start, days),
    startDate: selectedRange.start,
    comparisonLabel: mode === 'pop' ? 'the previous 30 days' : 'the same time last year'
  };
};

function renderDemo() { renderCalendar(); periodLabels(); renderIncrementals(); renderLedger(); renderTrend(); renderSpendTrend(); renderScope(); if (window.GrowthOSSimpleRender) window.GrowthOSSimpleRender(); }
function showPending() { hasData = false; emptyAnalytics.classList.remove('hidden'); playgroundLive.classList.add('hidden'); filters.forEach(filter => filter.disabled = true); if (window.GrowthOSSimpleRender) window.GrowthOSSimpleRender(); }
function showDemo() { hasData = true; emptyAnalytics.classList.add('hidden'); playgroundLive.classList.remove('hidden'); filters.forEach(filter => filter.disabled = false); renderDemo(); }
async function loadPerformance() {
  // Preview data is fully client-side, so it renders even on static hosting where the API returns no data.
  if (window.growthOSDemo?.isEnabled?.()) return showDemo();
  try { const response = await fetch(`/api/performance${window.growthOSDemo?.query() || ''}`); const data = await response.json(); if (data.noData) return showPending(); showDemo(); } catch { showPending(); } }

filters.forEach(filter => filter.addEventListener('change', renderDemo));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; calendarOpen = true; document.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active', item === button)); renderDemo(); }));
calendarToggleButton.addEventListener('click', () => { calendarOpen = !calendarOpen; renderDemo(); });
document.getElementById('previousPeriod').addEventListener('click', () => { calendarOpen = true; renderDemo(); });
document.getElementById('currentPeriod').addEventListener('click', () => { calendarOpen = true; renderDemo(); });
document.getElementById('resetFilters').addEventListener('click', () => { [marketplaceFilter, locationFilter, channelFilter].forEach(filter => window.GrowthOSFilters?.set(filter, 'all', false) || (filter.value = 'all')); sameStores.checked = true; mode = 'yoy'; yoyBasis = 'weekday'; calendarOpen = false; selectedRange = { start: '2026-08-01', end: '2026-08-30' }; document.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active', item.dataset.mode === 'yoy')); renderDemo(); });
window.addEventListener('resize', () => { if (hasData) { renderTrend(); renderSpendTrend(); } });
loadPerformance();
