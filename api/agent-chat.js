const { getAgent } = require('../lib/agents');
const { runAgentChat } = require('../lib/agents/agent-runtime');
module.exports = async (req, res) => {
  const { agent: agentId = 'meta', message = '', range = 'last_14_days', dimension = 'campaign', demo = false } = req.body || {};
  const agent = getAgent(agentId);
  if (!agent) return res.status(400).json({ error: 'Unknown agent' });
  const result = await runAgentChat({ agent, message, range, dimension, demo: demo === true || req.query?.demo === '1' });
  return res.status(200).json(result);
};
