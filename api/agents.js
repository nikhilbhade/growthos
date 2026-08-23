const { listAgents } = require('../lib/agents');

module.exports = (req, res) => res.status(200).json(listAgents());
