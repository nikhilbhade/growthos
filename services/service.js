const http = require('http');
const { randomUUID } = require('crypto');
const { getProvider } = require('./providers');

const providerId = process.env.PROVIDER;
const role = process.env.ROLE;
const provider = getProvider(providerId);
const port = Number(process.env.PORT || 4100);

if (!provider || !['integration', 'ingestion'].includes(role)) {
  throw new Error('PROVIDER must be meta, tiktok, google, doordash, or ubereats and ROLE must be integration or ingestion.');
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
    });
  });
}

function authorized(req) {
  const token = process.env.SERVICE_AUTH_TOKEN;
  return !token || req.headers.authorization === `Bearer ${token}`;
}

http.createServer(async (req, res) => {
  if (!authorized(req)) return send(res, 401, { error: 'Unauthorized service request' });
  const url = new URL(req.url, `http://${req.headers.host}`);
  const service = `${providerId}-${role}`;

  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, { ok: true, service, provider: providerId, role, version: 'v1' });
  }

  if (req.method === 'GET' && url.pathname === '/v1/capabilities') {
    return send(res, 200, { provider: providerId, role, ...provider });
  }

  if (role === 'integration' && req.method === 'POST' && url.pathname === '/v1/connection-intents') {
    const body = await readJson(req);
    if (!body.workspaceId) return send(res, 400, { error: 'workspaceId is required' });
    return send(res, 202, {
      status: 'pending_customer_authorization',
      connectionIntentId: randomUUID(),
      workspaceId: body.workspaceId,
      provider: providerId,
      authorization: provider.auth,
      requiredScopes: provider.scopes,
      nextStep: 'Redirect the authorized customer to the provider consent or invitation flow.'
    });
  }

  if (role === 'ingestion' && req.method === 'POST' && url.pathname === '/v1/ingestions') {
    const body = await readJson(req);
    if (!body.workspaceId || !body.connectionId) return send(res, 400, { error: 'workspaceId and connectionId are required' });
    return send(res, 202, {
      status: 'queued',
      ingestionRunId: randomUUID(),
      workspaceId: body.workspaceId,
      connectionId: body.connectionId,
      provider: providerId,
      requestedRange: body.range || 'incremental',
      objectTypes: provider.objects,
      nextStep: 'A provider-specific worker retrieves, normalizes, and writes the run to the shared warehouse.'
    });
  }

  return send(res, 404, { error: 'Route not found', service });
}).listen(port, () => console.log(`${providerId} ${role} service listening on ${port}`));
