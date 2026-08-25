const { getAgent } = require('../../../lib/agents');
const { requireUser } = require('../../../lib/api-auth');

module.exports = async (req, res) => {
  if ((await requireUser(req, res)) === false) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const agent = getAgent(req.query?.agent);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  const body = req.body || {};
  return res.status(200).json(await agent.retrieve({
    range: body.range,
    dimension: body.dimension,
    demo: req.query?.demo === '1' || body.demo === true
  }));
};
