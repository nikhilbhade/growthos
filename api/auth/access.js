const { requireUser } = require('../../lib/api-auth');
const { accessForUser } = require('../../lib/access-control');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (user === false) return;
  if (!user) return res.status(401).json({ error: 'Sign in is required.' });

  const access = accessForUser(user);
  if (!access.allowed) return res.status(access.status).json({ error: access.error });

  return res.status(200).json({ allowed: true, email: access.email });
};
