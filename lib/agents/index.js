const meta = require('./meta-retrieval-agent');
const tiktok = require('./tiktok-retrieval-agent');
const google = require('./google-retrieval-agent');
const delivery = require('./delivery-retrieval-agent');

const agents = { meta, tiktok, google, delivery };

function getAgent(id) { return agents[id] || null; }
function listAgents() { return Object.values(agents).map(agent => agent.capability); }

module.exports = { getAgent, listAgents };
