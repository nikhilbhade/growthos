const { getAgent } = require('../lib/agents');
const { runAgentChat } = require('../lib/agents/agent-runtime');
const { requireUser } = require('../lib/api-auth');
module.exports = async (req, res) => {
  if ((await requireUser(req, res)) === false) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { agent: agentId = 'meta', message = '', range = 'last_14_days', dimension = 'campaign', demo = false } = req.body || {};
  const agent = getAgent(agentId);
  if (!agent) return res.status(400).json({ error: 'Unknown agent' });
  const result = await runAgentChat({ agent, message, range, dimension, demo: demo === true || req.query?.demo === '1' });
  return res.status(200).json(result);
};
