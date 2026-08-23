/*
 * Market intelligence is deliberately provider-agnostic. Google, DoorDash, and Uber Eats data
 * are not fetched from the browser: production data must arrive through an
 * approved search/listing data provider and the restaurant's own business data.
 *
 * Cuisine classification is a vector workflow. At sync time, a restaurant's
 * first-party menu + description are embedded, compared with a maintained
 * cuisine taxonomy, and the resulting tags are stored with the location. That
 * avoids brittle keyword-only comparison sets.
 */
const demoLocations = {
  'river-north': { id: 'river-north', name: 'River North', zip: '60611', googleRank: 3, doordashRank: 5, ubereatsRank: 4, rating: 4.7, reviews: 372, similarStores: 563, avgCheck: 24.8, competitors: 27.2 },
  'west-loop': { id: 'west-loop', name: 'West Loop', zip: '60607', googleRank: 5, doordashRank: 8, ubereatsRank: 6, rating: 4.6, reviews: 218, similarStores: 421, avgCheck: 22.4, competitors: 23.5 },
  'wicker-park': { id: 'wicker-park', name: 'Wicker Park', zip: '60622', googleRank: 2, doordashRank: 3, ubereatsRank: 4, rating: 4.8, reviews: 489, similarStores: 634, avgCheck: 21.6, competitors: 20.9 }
};

const baseTags = [
  { label: 'Mediterranean', confidence: 0.96 },
  { label: 'Fast casual', confidence: 0.92 },
  { label: 'Healthy bowls', confidence: 0.88 },
  { label: 'Lunch', confidence: 0.81 }
];

function selectedLocations(location) {
  const ids = String(location || 'all').split(',').filter(Boolean);
  return ids.includes('all') ? Object.values(demoLocations) : ids.map(id => demoLocations[id]).filter(Boolean);
}

function average(values) { return values.reduce((total, value) => total + value, 0) / values.length; }

function rankFor(item, source) {
  const sources = String(source || 'all').split(',').filter(Boolean);
  if (sources.includes('all')) return average([item.googleRank, item.doordashRank, item.ubereatsRank]);
  return average(sources.map(itemSource => item[`${itemSource}Rank`] || item.googleRank));
}

function sourceLabel(source) {
  const names = { google: 'Google', doordash: 'DoorDash', ubereats: 'Uber Eats' };
  const sources = String(source || 'all').split(',').filter(Boolean);
  return sources.includes('all') ? 'All channels' : sources.map(item => names[item] || item).join(' + ');
}

function demoRanking(location, source) {
  const locationSet = selectedLocations(location);
  const rank = Math.round(average(locationSet.map(item => rankFor(item, source))));
  const queries = [
    ['mediterranean restaurants', 1, 18],
    ['healthy lunch', 0, 22],
    ['fast casual mediterranean', 2, 15],
    ['bowls near me', -1, 11]
  ].map(([query, movement, volume], index) => ({
    query,
    rank: Math.max(1, rank + index),
    movement,
    localDemand: `${volume + index * 3}k searches`,
    source
  }));
  return { rank, queries };
}

function demoPricing(location, comparableSet, source) {
  const locations = selectedLocations(location);
  const averageCheck = average(locations.map(item => item.avgCheck));
  const marketAverage = average(locations.map(item => item.competitors));
  const sources = String(source || 'all').split(',').filter(Boolean);
  const multipliers = { all: 1, google: 1, doordash: 0.96, ubereats: 1.04 };
  const marketplaceMultiplier = sources.includes('all') ? 1 : average(sources.map(item => multipliers[item] || 1));
  const multiplier = (comparableSet === 'adjacent' ? 1.045 : 1) * marketplaceMultiplier;
  const adjustedMarket = marketAverage * multiplier;
  const delta = ((averageCheck / adjustedMarket) - 1) * 100;
  const zip = locations.length === 1 ? locations[0].zip : 'Selected Chicago ZIPs';
  return {
    averageCheck,
    marketAverage: adjustedMarket,
    delta,
    zip,
    sensitivity: 0.34,
    competitorCount: comparableSet === 'adjacent' ? 18 : 12,
    competitors: [
      { name: 'Ema', distance: '0.4 mi', cuisine: 'Mediterranean · $$', averageCheck: 31.2 },
      { name: 'Roti', distance: '0.6 mi', cuisine: 'Mediterranean · $', averageCheck: 19.8 },
      { name: 'Sweetgreen', distance: '0.5 mi', cuisine: 'Healthy bowls · $$', averageCheck: 18.6 },
      { name: 'The Purple Pig', distance: '0.8 mi', cuisine: 'Mediterranean · $$$', averageCheck: 39.4 }
    ],
    curve: [
      { price: 16, demand: 92 }, { price: 18, demand: 87 }, { price: 20, demand: 79 },
      { price: 22, demand: 70 }, { price: 24, demand: 60 }, { price: 26, demand: 50 },
      { price: 28, demand: 42 }, { price: 30, demand: 35 }, { price: 32, demand: 29 }
    ]
  };
}

function getMarketIntelligence({ demo = false, location = 'all', source = 'google', comparableSet = 'core' } = {}) {
  if (!demo) return {
    noData: true,
    message: 'Market intelligence will appear after an approved local-search data provider and restaurant profile have completed their first validated sync.',
    requirements: ['Approved Google, DoorDash, or Uber Eats market-data source', 'First-party menu or description for cuisine embeddings', 'Location address and ZIP code']
  };
  const selected = selectedLocations(location);
  const ranking = demoRanking(location, source);
  return {
    isDemoData: true,
    methodology: {
      cuisine: 'First-party menu and restaurant description are embedded, compared to a maintained cuisine taxonomy, then used with location ZIP and distance to select comparable results.',
      pricing: 'Price position is directional. It compares the selected cuisine fingerprint with a local competitive set and must be validated against a licensed market-data feed before use.'
    },
    cuisine: { description: 'Little Lemon is semantically matched to fast-casual Mediterranean and healthy-bowl searches. Adjacent cuisines are included only when the selected comparison set allows them.', tags: baseTags },
    ranking: {
      source,
      sourceLabel: sourceLabel(source),
      averageRank: ranking.rank,
      topThreeShare: Math.max(34, 67 - ranking.rank * 6),
      locationsTracked: selected.length,
      locations: selected.map(item => ({
        id: item.id,
        name: item.name,
        zip: item.zip,
        brand: 'Little Lemon',
        rating: item.rating,
        reviews: item.reviews,
        similarStores: item.similarStores,
        priceIndex: ((item.avgCheck / item.competitors) - 1) * 100,
        rank: rankFor(item, source)
      })),
      queries: ranking.queries
    },
    pricing: demoPricing(location, comparableSet, source)
  };
}

module.exports = { getMarketIntelligence };
