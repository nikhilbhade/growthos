const { listIntegrations } = require('../../lib/integrations');
const { requireUser } = require('../../lib/api-auth');

module.exports = async (req, res) => {
  if ((await requireUser(req, res)) === false) return;
  return res.status(200).json(await listIntegrations({ demo: req.query?.demo === '1' }));
};
