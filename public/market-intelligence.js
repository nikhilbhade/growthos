const rankingEmpty = document.getElementById('rankingEmpty');
const pricingEmpty = document.getElementById('pricingEmpty');
const rankingLive = document.getElementById('rankingLive');
const pricingLive = document.getElementById('pricingLive');
const marketLocation = document.getElementById('marketLocation');
const pricingLocation = document.getElementById('pricingLocation');
const rankingRadius = document.getElementById('rankingRadius');
const pricingSet = document.getElementById('pricingSet');
const rankingMarketplace = document.getElementById('rankingMarketplace');
const pricingMarketplace = document.getElementById('pricingMarketplace');
const rankingSourceToggle = document.getElementById('rankingSourceToggle');
let rankingSource = 'all';
const marketplaceNames = { all: 'All channels', google: 'Google', doordash: 'DoorDash', ubereats: 'Uber Eats' };
const marketMonths = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const multiValues = select => window.GrowthOSFilters?.values(select) || (select.value === 'all' ? [] : [select.value]);
const multiIsAll = select => window.GrowthOSFilters?.isAll(select) ?? select.value === 'all';
const queryValue = select => multiIsAll(select) ? 'all' : multiValues(select).join(',');
const applySelection = (select, values) => window.GrowthOSFilters?.set(select, values, false) || (select.value = Array.isArray(values) ? values[0] : values);

const marketMoney = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const marketPercent = value => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

function trendSvg(values, color, label, formatter) {
  const width = 560; const height = 186; const max = Math.max(...values); const min = Math.min(...values); const spread = Math.max(1, max - min);
  const x = index => 30 + index * ((width - 60) / (values.length - 1));
  const y = value => 126 - ((value - min) / spread) * 78;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><line x1="28" y1="126" x2="532" y2="126"/><line x1="28" y1="87" x2="532" y2="87"/><line x1="28" y1="48" x2="532" y2="48"/><polyline points="${points}" style="stroke:${color}"/>${values.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="3.5" fill="${color}"/><text x="${x(index)}" y="153" text-anchor="middle">${marketMonths[index]}</text>${index === values.length - 1 ? `<text x="${x(index)}" y="${y(value) - 10}" text-anchor="middle" fill="${color}">${formatter(value)}</text>` : ''}`).join('')}<text x="280" y="178" text-anchor="middle">MONTH</text></svg>`;
}

function ensureMarketTrends() {
  if (document.getElementById('rankingTrends')) return;
  const rankingTrend = document.createElement('section'); rankingTrend.id = 'rankingTrends'; rankingTrend.className = 'market-trends';
  rankingTrend.innerHTML = `<article><div><span>MONTH-OVER-MONTH RANKING</span><strong id="rankingTrendTitle"></strong><small id="rankingTrendChange"></small></div><div id="rankingTrendChart"></div></article>`;
  document.getElementById('rankingSummary').after(rankingTrend);
  const pricingTrend = document.createElement('section'); pricingTrend.id = 'pricingTrends'; pricingTrend.className = 'market-trends';
  pricingTrend.innerHTML = `<article><div><span>MONTH-OVER-MONTH PRICE POSITION</span><strong id="pricingTrendTitle"></strong><small id="pricingTrendChange"></small></div><div id="pricingTrendChart"></div></article>`;
  document.getElementById('pricingKpis').after(pricingTrend);
}

function renderMarketTrends(ranking, pricing) {
  ensureMarketTrends();
  const rankSeries = [ranking.averageRank + 4, ranking.averageRank + 3, ranking.averageRank + 3, ranking.averageRank + 2, ranking.averageRank + 1, ranking.averageRank].map(value => Math.max(1, Math.round(value)));
  const priceSeries = [pricing.delta - 3.1, pricing.delta - 2.4, pricing.delta - 2.9, pricing.delta - 1.7, pricing.delta - .8, pricing.delta].map(value => Number(value.toFixed(1)));
  const rankChange = rankSeries[rankSeries.length - 1] - rankSeries[0];
  const priceChange = priceSeries[priceSeries.length - 1] - priceSeries[0];
  document.getElementById('rankingTrendTitle').textContent = `#${ranking.averageRank} in Aug`;
  document.getElementById('rankingTrendChange').textContent = `${rankChange < 0 ? '↑' : '↓'} ${Math.abs(rankChange)} positions since Mar · ${rankSeries[rankSeries.length - 1] < rankSeries[rankSeries.length - 2] ? 'improved' : 'declined'} vs Jul`;
  document.getElementById('pricingTrendTitle').textContent = `${marketPercent(pricing.delta)} in Aug`;
  document.getElementById('pricingTrendChange').textContent = `${priceChange >= 0 ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(1)} pts since Mar · ${priceSeries[priceSeries.length - 1] > priceSeries[priceSeries.length - 2] ? 'higher' : 'lower'} vs Jul`;
  document.getElementById('rankingTrendChart').innerHTML = trendSvg(rankSeries, '#7affa5', 'Month-over-month ranking', value => `#${value}`);
  document.getElementById('pricingTrendChart').innerHTML = trendSvg(priceSeries, '#ffb371', 'Month-over-month price position', value => marketPercent(value));
}

function drawPriceCurve(pricing) {
  const svg = document.getElementById('priceCurve');
  const width = 680; const height = 230; const pad = { left: 42, right: 18, top: 12, bottom: 28 };
  const values = pricing.curve;
  const minPrice = values[0].price; const maxPrice = values[values.length - 1].price;
  const x = value => pad.left + ((value - minPrice) / (maxPrice - minPrice)) * (width - pad.left - pad.right);
  const y = value => pad.top + ((100 - value) / 100) * (height - pad.top - pad.bottom);
  const pointString = values.map(item => `${x(item.price)},${y(item.demand)}`).join(' ');
  const marketMin = pricing.marketAverage * 0.86;
  const marketMax = pricing.marketAverage * 1.14;
  const currentDemand = 60;
  const grid = [25, 50, 75].map(value => `<line x1="${pad.left}" y1="${y(value)}" x2="${width - pad.right}" y2="${y(value)}"/><text x="2" y="${y(value) + 3}">${value}%</text>`).join('');
  const ticks = [16, 20, 24, 28, 32].map(value => `<text x="${x(value)}" y="${height - 7}" text-anchor="middle">$${value}</text>`).join('');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = `${grid}<rect class="market-band" x="${x(marketMin)}" y="${pad.top}" width="${x(marketMax) - x(marketMin)}" height="${height - pad.top - pad.bottom}" rx="4"/><polyline class="sensitivity-line" points="${pointString}"/><circle class="current-price" cx="${x(pricing.averageCheck)}" cy="${y(currentDemand)}" r="6"/><text x="${x(pricing.averageCheck)}" y="${y(currentDemand) - 13}" text-anchor="middle">Your avg. check</text><text x="${pad.left}" y="${height - 7}">Lower average check</text><text x="${width - pad.right}" y="${height - 7}" text-anchor="end">Higher average check</text>`;
}

function renderMarket(data) {
  const hasData = !data.noData;
  rankingEmpty.classList.toggle('hidden', hasData); pricingEmpty.classList.toggle('hidden', hasData);
  rankingLive.classList.toggle('hidden', !hasData); pricingLive.classList.toggle('hidden', !hasData);
  if (!hasData) return;
  const { ranking, cuisine, pricing } = data;
  document.getElementById('rankingSummary').innerHTML = [
    ['AVG. LOCAL RANK', `#${ranking.averageRank}`, `${ranking.sourceLabel || marketplaceNames[ranking.source]} result set`],
    ['TOP-THREE PRESENCE', `${ranking.topThreeShare}%`, 'of measured relevant searches'],
    ['CUISINE QUERIES', ranking.queries.length, 'semantic cuisine match'],
    ['LOCATIONS TRACKED', ranking.locationsTracked, 'within selected scope']
  ].map(([label, value, note], index) => `<article><span>${label}</span><strong class="${index === 0 ? 'market-good' : ''}">${value}</strong><em>${note}</em></article>`).join('');
  renderMarketTrends(ranking, pricing);
  document.getElementById('rankingDirectory').innerHTML = ranking.locations.map(item => `<article class="ranking-directory-row"><button type="button" data-directory-location="${item.id}"><span class="directory-place">⌖</span><span><strong>${item.name}</strong><small>${item.zip} · View location</small></span><b>›</b></button><span>${item.brand}</span><span>${item.rating.toFixed(1)} <i>★</i> <small>${item.reviews.toLocaleString()}</small></span><span>${item.reviews.toLocaleString()}</span><span>${item.similarStores.toLocaleString()}</span><span class="price-index ${item.priceIndex <= 0 ? 'below-market' : ''}">$$ <em>${item.priceIndex > 0 ? '+' : ''}${Math.round(item.priceIndex)}%</em></span><span class="rank-index">#${item.rank} <small>/ ${item.similarStores.toLocaleString()}</small></span></article>`).join('');
  document.getElementById('rankingDirectoryCount').textContent = `${ranking.locations.length} of ${ranking.locations.length} locations`;
  document.querySelectorAll('[data-directory-location]').forEach(button => button.addEventListener('click', () => { applySelection(marketLocation, button.dataset.directoryLocation); applySelection(pricingLocation, button.dataset.directoryLocation); loadMarketIntelligence(); }));
  document.getElementById('cuisineDescription').textContent = cuisine.description;
  document.getElementById('cuisineTags').innerHTML = cuisine.tags.map(tag => `<span>${tag.label} · ${Math.round(tag.confidence * 100)}%</span>`).join('');
  document.getElementById('rankingSourceToggle').textContent = `${ranking.sourceLabel || marketplaceNames[ranking.source]} source`;
  document.getElementById('rankingTable').innerHTML = ranking.queries.map(item => `<div class="ranking-row"><span><strong>${item.query}</strong><small>${item.localDemand} · ${ranking.sourceLabel || marketplaceNames[ranking.source]} ${ranking.source === 'google' ? 'local + organic results' : ranking.source === 'all' ? 'aggregated discovery results' : 'marketplace discovery results'}</small></span><span>#${item.rank}</span><span class="${item.movement > 0 ? 'rank-up' : item.movement < 0 ? 'rank-fallback' : ''}">${item.movement > 0 ? '↑' : item.movement < 0 ? '↓' : '—'} ${Math.abs(item.movement)}</span><span>${item.rank <= 3 ? 'Top 3' : 'Tracked'}</span></div>`).join('');
  document.getElementById('pricingKpis').innerHTML = [
    ['YOUR AVG. CHECK', marketMoney(pricing.averageCheck), 'selected location scope'],
    ['LOCAL MARKET AVG.', marketMoney(pricing.marketAverage), pricing.zip],
    ['PRICE POSITION', marketPercent(pricing.delta), pricing.delta <= 0 ? 'below comparable average' : 'above comparable average'],
    ['SENSITIVITY', 'Medium', `${Math.round(pricing.sensitivity * 100)}% modeled response`]
  ].map(([label, value, note], index) => `<article><span>${label}</span><strong class="${index === 2 && pricing.delta <= 0 ? 'market-good' : ''}">${value}</strong><em>${note}</em></article>`).join('');
  document.getElementById('competitorCount').textContent = `${pricing.competitorCount} comparable venues`;
  document.getElementById('competitorList').innerHTML = pricing.competitors.map(item => `<div class="competitor-row"><div><strong>${item.name}</strong><small>${item.cuisine} · ${item.distance}</small></div><div class="competitor-price"><strong>${marketMoney(item.averageCheck)}</strong><small>avg. check</small></div></div>`).join('');
  document.getElementById('priceInsight').textContent = `The selected scope is ${Math.abs(pricing.delta).toFixed(1)}% ${pricing.delta <= 0 ? 'below' : 'above'} the ${pricing.zip} comparable-market average. Treat this as a directional signal until validated with a licensed market-data feed.`;
  drawPriceCurve(pricing);
}

async function loadMarketIntelligence() {
  const demo = window.growthOSDemo?.isEnabled() === true;
  const location = queryValue(marketLocation);
  rankingSource = queryValue(rankingMarketplace);
  if (queryValue(pricingLocation) !== location) applySelection(pricingLocation, multiIsAll(marketLocation) ? 'all' : multiValues(marketLocation));
  if (queryValue(pricingMarketplace) !== rankingSource) applySelection(pricingMarketplace, multiIsAll(rankingMarketplace) ? 'all' : multiValues(rankingMarketplace));
  const params = new URLSearchParams({ location, source: rankingSource, comparableSet: pricingSet.value });
  if (demo) params.set('demo', '1');
  try {
    const response = await fetch(`/api/market-intelligence?${params}`);
    renderMarket(await response.json());
  } catch {
    renderMarket({ noData: true });
  }
}

marketLocation.addEventListener('change', loadMarketIntelligence);
pricingLocation.addEventListener('change', () => { applySelection(marketLocation, multiIsAll(pricingLocation) ? 'all' : multiValues(pricingLocation)); loadMarketIntelligence(); });
rankingRadius.addEventListener('change', loadMarketIntelligence);
pricingSet.addEventListener('change', loadMarketIntelligence);
rankingMarketplace.addEventListener('change', () => { rankingSource = queryValue(rankingMarketplace); loadMarketIntelligence(); });
pricingMarketplace.addEventListener('change', () => { applySelection(rankingMarketplace, multiIsAll(pricingMarketplace) ? 'all' : multiValues(pricingMarketplace)); rankingSource = queryValue(pricingMarketplace); loadMarketIntelligence(); });
window.addEventListener('growthos:demo-change', loadMarketIntelligence);
loadMarketIntelligence();
