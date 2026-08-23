// Boots the server and checks the core routes respond. Also guards the
// market-intelligence rank regression (ranks must be whole numbers).
// Zero dependencies (uses global fetch, Node 18+).
const { spawn } = require('node:child_process');

const PORT = process.env.SMOKE_PORT || 3123;
const BASE = `http://127.0.0.1:${PORT}`;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res;
}

(async () => {
  const server = spawn('node', ['server.js'], { env: { ...process.env, PORT }, stdio: 'inherit' });
  let failure = null;
  try {
    let up = false;
    for (let i = 0; i < 40; i++) {
      try { await get('/'); up = true; break; } catch { await wait(250); }
    }
    if (!up) throw new Error('server did not start within 10s');

    const html = await (await get('/')).text();
    for (const needle of ['GrowthOS', 'href="#settings"']) {
      if (!html.includes(needle)) throw new Error(`homepage missing "${needle}"`);
    }

    await get('/api/performance?demo=1');
    await get('/api/integrations');

    const mi = await (await get('/api/market-intelligence?location=all&source=all&comparableSet=core&demo=1')).json();
    const ranks = (mi.ranking && mi.ranking.locations || []).map(l => l.rank);
    if (!ranks.length) throw new Error('market-intelligence returned no ranked locations');
    const fractional = ranks.filter(r => !Number.isInteger(r));
    if (fractional.length) throw new Error(`rank must be a whole number, got: ${fractional.join(', ')}`);

    console.log(`✓ smoke passed — homepage + APIs OK, ${ranks.length} integer ranks`);
  } catch (error) {
    failure = error;
  } finally {
    server.kill('SIGTERM');
    await wait(300);
  }
  if (failure) { console.error(`✗ smoke failed: ${failure.message}`); process.exit(1); }
  process.exit(0);
})();
