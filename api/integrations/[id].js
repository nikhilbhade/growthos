const { requestIntegrationSetup } = require('../../lib/integrations');
const { requireUser } = require('../../lib/api-auth');

module.exports = async (req, res) => {
  if ((await requireUser(req, res)) === false) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const integration = await requestIntegrationSetup(req.query?.id);
  if (!integration) return res.status(404).json({ error: 'Integration not found' });
  return res.status(200).json({
    ...integration,
    message: 'Connection request logged. OAuth begins only after a human approves the setup.'
  });
};
