// Syntax-checks every tracked .js file with `node --check`.
// Zero dependencies; runs anywhere Node runs (local + CI).
const { execFileSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');

const SKIP = new Set(['node_modules', '.git', '.vercel']);
const root = process.cwd();

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = collect(root);
const failures = [];
for (const file of files) {
  try {
    execFileSync('node', ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    failures.push(`${file.replace(root + '/', '')}\n${(error.stderr || error.message).toString().trim()}`);
  }
}

if (failures.length) {
  console.error(`✗ syntax check failed for ${failures.length} file(s):\n\n${failures.join('\n\n')}`);
  process.exit(1);
}
console.log(`✓ syntax check passed (${files.length} files)`);
