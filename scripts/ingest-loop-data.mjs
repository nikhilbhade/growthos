#!/usr/bin/env node
/**
 * Bulk-load a gzipped CSV of Loop campaign data into a Supabase Postgres
 * staging table using COPY.
 *
 * Why COPY: for files of this size (~100-200 MB uncompressed, millions of rows)
 * COPY is one to two orders of magnitude faster than row-by-row inserts through
 * PostgREST / supabase-js, and it streams straight from the .gz so the file is
 * never fully decompressed to disk.
 *
 * Design choices:
 *   - The staging table is created with EVERY column as text, so one malformed
 *     value can never abort the whole load. Cast into typed/modeled tables with
 *     SQL afterwards (INSERT ... SELECT ...::type).
 *   - Loads stop after a configurable uncompressed-byte budget (default 100 MB)
 *     so we can start small, on a clean row boundary.
 *   - Every run is logged to public.data_ingestion_runs for auditability.
 *
 * Usage:
 *   SUPABASE_DB_URL='postgresql://postgres:<pw>@<host>:5432/postgres' \
 *   node scripts/ingest-loop-data.mjs \
 *     --file ./loop_campaign_dataset_A_loop_run.csv.gz \
 *     --table loop_run_a \
 *     [--schema staging] [--max-mb 100] [--truncate]
 *
 * Get SUPABASE_DB_URL from: Supabase Dashboard -> Project Settings -> Database
 * -> Connection string. Use the direct connection or the SESSION pooler
 * (port 5432) for COPY, not the transaction pooler (6543).
 *
 * Requires: npm install (adds pg + pg-copy-streams).
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { once } from 'node:events';

// pg and pg-copy-streams are imported lazily inside main() so this module can be
// imported (e.g. by tests) without the database driver installed, and so the
// CLI only requires them when it actually connects.

// --- CLI parsing ---------------------------------------------------------

function parseArgs(argv) {
  const args = { schema: 'staging', maxMb: 100, truncate: false };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--file') args.file = argv[++i];
    else if (key === '--table') args.table = argv[++i];
    else if (key === '--schema') args.schema = argv[++i];
    else if (key === '--max-mb') args.maxMb = Number(argv[++i]);
    else if (key === '--truncate') args.truncate = true;
    else throw new Error(`Unknown argument: ${key}`);
  }
  if (!args.file) throw new Error('Missing --file <path to .csv.gz>');
  if (!args.table) throw new Error('Missing --table <staging table name>');
  if (!Number.isFinite(args.maxMb) || args.maxMb <= 0) throw new Error('--max-mb must be a positive number');
  if (!process.env.SUPABASE_DB_URL) throw new Error('Set SUPABASE_DB_URL in the environment');
  return args;
}

// --- CSV header parsing --------------------------------------------------

// Split a single CSV header line, honouring double-quoted fields (which may
// contain commas or escaped "" quotes). Data rows are never re-parsed here —
// they are streamed to COPY verbatim so their exact formatting is preserved.
export function splitCsvLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { fields.push(field); field = ''; }
    else field += ch;
  }
  fields.push(field);
  return fields;
}

// Turn a raw header name into a safe, stable snake_case SQL identifier, and
// de-duplicate collisions so two headers never map to the same column.
export function toIdentifiers(headers) {
  const seen = new Map();
  return headers.map((raw, idx) => {
    let base = String(raw).trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!base) base = `col_${idx + 1}`;
    if (/^[0-9]/.test(base)) base = `c_${base}`;
    let name = base;
    let n = 1;
    while (seen.has(name)) { n += 1; name = `${base}_${n}`; }
    seen.set(name, true);
    return name;
  });
}

export function qIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

// --- gzip helpers --------------------------------------------------------

function openGzLines(file) {
  const input = fs.createReadStream(file).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  return { input, rl };
}

// Read only the first line (the CSV header) then tear the stream down.
export async function readHeaderLine(file) {
  const { input, rl } = openGzLines(file);
  for await (const line of rl) {
    rl.close();
    input.destroy();
    return line;
  }
  throw new Error('File appears to be empty — no header row found');
}

// Stream every data row (past the header) of a .csv.gz to `onChunk`, stopping
// on a clean row boundary once `maxBytes` of uncompressed data has been sent.
// `onChunk` may return a promise to apply backpressure (COPY stream drain).
// Returns the load stats. DB-free, so this is unit-testable on its own.
export async function streamDataLines(file, maxBytes, onChunk) {
  const { input, rl } = openGzLines(file);
  let rows = 0;
  let bytes = 0;
  let capped = false;
  let lineNo = 0;
  try {
    for await (const line of rl) {
      lineNo += 1;
      if (lineNo === 1) continue;      // skip the header we already consumed
      if (line.length === 0) continue; // skip blank lines
      const chunk = `${line}\n`;
      bytes += Buffer.byteLength(chunk);
      await onChunk(chunk);
      rows += 1;
      if (maxBytes && bytes >= maxBytes) { capped = true; break; }
    }
  } finally {
    rl.close();
    input.destroy();
  }
  return { rows, bytes, capped };
}

// --- main ----------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const maxBytes = Math.round(args.maxMb * 1024 * 1024);
  const qualified = `${qIdent(args.schema)}.${qIdent(args.table)}`;

  const headerLine = await readHeaderLine(args.file);
  const rawHeaders = splitCsvLine(headerLine);
  const columns = toIdentifiers(rawHeaders);
  console.log(`Detected ${columns.length} columns in ${args.file}`);

  const pg = (await import('pg')).default;
  const { from: copyFrom } = await import('pg-copy-streams');

  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    // Bulk COPY of a large file can run well past the default statement timeout.
    statement_timeout: 0,
    query_timeout: 0
  });
  await client.connect();

  let runId;
  try {
    await client.query(`create schema if not exists ${qIdent(args.schema)}`);
    const colDefs = columns.map(c => `${qIdent(c)} text`).join(',\n  ');
    await client.query(`create table if not exists ${qualified} (\n  ${colDefs}\n)`);

    const run = await client.query(
      `insert into public.data_ingestion_runs
         (source_file, target_table, status, max_bytes, truncated, columns)
       values ($1, $2, 'running', $3, $4, $5::jsonb)
       returning id`,
      [args.file, `${args.schema}.${args.table}`, maxBytes, args.truncate, JSON.stringify(columns)]
    );
    runId = run.rows[0].id;

    await client.query('begin');
    if (args.truncate) await client.query(`truncate ${qualified}`);

    const copySql = `copy ${qualified} from stdin with (format csv)`;
    const copyStream = client.query(copyFrom(copySql));
    // Surface a COPY-side failure instead of hanging on the finish/drain await.
    const copyDone = new Promise((resolve, reject) => {
      copyStream.on('error', reject);
      copyStream.on('finish', resolve);
    });

    const { rows, bytes, capped } = await streamDataLines(args.file, maxBytes, chunk => {
      if (!copyStream.write(chunk)) return once(copyStream, 'drain');
      return undefined;
    });

    copyStream.end();
    await copyDone;
    await client.query('commit');

    await client.query(
      `update public.data_ingestion_runs
         set status = 'succeeded', rows_loaded = $2, bytes_loaded = $3,
             capped = $4, finished_at = now()
       where id = $1`,
      [runId, rows, bytes, capped]
    );

    console.log(
      `Loaded ${rows.toLocaleString()} rows (${(bytes / 1024 / 1024).toFixed(1)} MB uncompressed) ` +
      `into ${args.schema}.${args.table}${capped ? ` — stopped at the ${args.maxMb} MB budget` : ' — reached end of file'}`
    );
  } catch (error) {
    try { await client.query('rollback'); } catch { /* not in a transaction */ }
    if (runId) {
      await client.query(
        `update public.data_ingestion_runs
           set status = 'failed', error_message = $2, finished_at = now()
         where id = $1`,
        [runId, String(error && error.message || error)]
      ).catch(() => {});
    }
    throw error;
  } finally {
    await client.end();
  }
}

// Only run when executed directly (node scripts/ingest-loop-data.mjs), not when
// imported by a test.
const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().catch(error => {
    console.error('Ingestion failed:', error.message);
    process.exit(1);
  });
}
