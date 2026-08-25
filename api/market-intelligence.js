const { getMarketIntelligence } = require('../lib/market-intelligence');
const { requireUser } = require('../lib/api-auth');

module.exports = async (req, res) => {
  if ((await requireUser(req, res)) === false) return;
  return res.status(200).json(getMarketIntelligence({
    demo: req.query?.demo === '1',
    location: req.query?.location || 'all',
    source: req.query?.source || 'google',
    comparableSet: req.query?.comparableSet || 'core'
  }));
};
