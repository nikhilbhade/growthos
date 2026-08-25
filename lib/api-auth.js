const { createClient } = require('@supabase/supabase-js');

function authIsRequired() {
  return process.env.GROWTHOS_REQUIRE_AUTH === 'true';
}

function createAuthClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

async function requireUser(req, res) {
  if (!authIsRequired()) return null;

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const client = createAuthClient();
  if (!client) {
    res.status(503).json({ error: 'Authentication is enabled but Supabase is not configured.' });
    return false;
  }
  if (!token) {
    res.status(401).json({ error: 'Sign in is required.' });
    return false;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Your session is invalid or has expired. Please sign in again.' });
    return false;
  }
  req.growthosUser = data.user;
  return data.user;
}

module.exports = { authIsRequired, createAuthClient, requireUser };
