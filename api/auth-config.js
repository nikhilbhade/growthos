module.exports = (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  return res.status(200).json({
    enabled: Boolean(url && anonKey),
    required: process.env.GROWTHOS_REQUIRE_AUTH === 'true',
    url: url || null,
    anonKey: anonKey || null
  });
};
