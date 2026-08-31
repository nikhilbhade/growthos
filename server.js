require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const { listIntegrations, requestIntegrationSetup } = require('./lib/integrations');
const { getAgent, listAgents } = require('./lib/agents');
const { runAgentChat } = require('./lib/agents/agent-runtime');
const { getMarketIntelligence } = require('./lib/market-intelligence');
const { createAuthClient } = require('./lib/api-auth');
const { accessForUser } = require('./lib/access-control');

// Serve the built React/shadcn SPA from public-dist when it exists (produced by
// `npm run build` in web/, or the Docker build stage). Fall back to the legacy
// static public/ directory when the app has not been built yet.
const builtRoot = path.join(__dirname, 'public-dist');
const root = fs.existsSync(path.join(builtRoot, 'index.html')) ? builtRoot : path.join(__dirname, 'public');
const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};
const performance = {
  noData: true,
  message: 'Analytics will appear after at least one provider completes its first historical sync.'
};
const demoPerformance = {
  isDemoData: true,
  periods: ['Aug 1', 'Aug 5', 'Aug 9', 'Aug 13', 'Aug 17', 'Aug 21'],
  yoy: { current: [12400, 13100, 13900, 13400, 14500, 15300], comparison: [10400, 10800, 11200, 11800, 12100, 12500], labels: ['This year', 'Last year'], metric: 'Attributed revenue ($)' },
  pop: { current: [12400, 13100, 13900, 13400, 14500, 15300], comparison: [13900, 14200, 13800, 14400, 14100, 14800], labels: ['Current 21 days', 'Previous 21 days'], metric: 'Attributed revenue ($)' }
};
function json(res, body, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
function readJson(req) { return new Promise(resolve => { let body = ''; req.on('data', chunk => { body += chunk; }); req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } }); }); }
async function authenticateRequest(req) {
  if (process.env.GROWTHOS_REQUIRE_AUTH !== 'true') return { user: null };
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const client = createAuthClient();
  if (!client) return { error: 'Authentication is enabled but Supabase is not configured.', status: 503 };
  if (!token) return { error: 'Sign in is required.', status: 401 };
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: 'Your session is invalid or has expired. Please sign in again.', status: 401 };
  const access = accessForUser(data.user);
  if (!access.allowed) return { error: access.error, status: access.status };
  return { user: data.user };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const demo = url.searchParams.get('demo') === '1';
  if (url.pathname === '/_health' && req.method === 'GET') return json(res, { status: 'ok' });
  if ((url.pathname === '/api/auth/config' || url.pathname === '/api/auth-config') && req.method === 'GET') {
    const urlValue = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    return json(res, {
      enabled: Boolean(urlValue && anonKey),
      required: process.env.GROWTHOS_REQUIRE_AUTH === 'true',
      url: urlValue || null,
      anonKey: anonKey || null
    });
  }
  if (url.pathname.startsWith('/api/')) {
    const authentication = await authenticateRequest(req);
    if (authentication.error) return json(res, { error: authentication.error }, authentication.status);
    req.growthosUser = authentication.user;
  }
  if (url.pathname === '/api/auth/access' && req.method === 'GET') {
    return json(res, { allowed: true, email: req.growthosUser.email });
  }
  if (url.pathname === '/api/agents' && req.method === 'GET') return json(res, listAgents());
  const retrievalMatch = url.pathname.match(/^\/api\/agents\/(meta|tiktok|google|delivery)\/retrieve$/);
  if (retrievalMatch && req.method === 'POST') {
    const body = await readJson(req); const agent = getAgent(retrievalMatch[1]);
    return json(res, await agent.retrieve({ range: body.range, dimension: body.dimension, demo: demo || body.demo === true }));
  }
  if (url.pathname === '/api/performance' && req.method === 'GET') return json(res, demo ? demoPerformance : performance);
  if (url.pathname === '/api/market-intelligence' && req.method === 'GET') return json(res, getMarketIntelligence({
    demo,
    location: url.searchParams.get('location') || 'all',
    source: url.searchParams.get('source') || 'google',
    comparableSet: url.searchParams.get('comparableSet') || 'core'
  }));
  if (url.pathname === '/api/agent-chat' && req.method === 'POST') {
    const body = await readJson(req); const agent = getAgent(body.agent) || getAgent('meta');
    return json(res, await runAgentChat({ agent, message: body.message || '', range: body.range || 'last_14_days', dimension: body.dimension || 'campaign', demo: demo || body.demo === true, brandId: body.brandId || null, threadId: body.threadId || null }));
  }
  if (url.pathname === '/api/integrations' && req.method === 'GET') return json(res, await listIntegrations({ demo }));
  if (url.pathname.startsWith('/api/integrations/') && req.method === 'POST') {
    const id = url.pathname.split('/')[3];
    const integration = await requestIntegrationSetup(id);
    if (!integration) return json(res, { error: 'Integration not found' }, 404);
    return json(res, { ...integration, message: 'Connection request logged. OAuth begins only after a human approves the setup.' });
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.normalize(path.join(root, requested));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log('GradientOS running at http://localhost:3000'));
