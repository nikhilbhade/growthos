#!/usr/bin/env node
// Agent evaluation runner (milestone M4). Zero external test deps.
//
//   node lib/agents/eval/run-evals.js
//
// Runs the chat cases through runAgentChat (demo data) and the unit cases against
// semantic memory. Detects the engine automatically: with AGENT_MODEL_API_KEY set
// it exercises the LangGraph agent and runs modelOnly cases too; without a key it
// validates the deterministic fallback (which is also the production safety net).
// Exits non-zero on any failure so it gates CI.

const { runAgentChat } = require('../agent-runtime');
const { getAgent } = require('..');
const { resolveMetric } = require('../memory/semantic-memory');
const { localSearch } = require('../knowledge-client');
const { modelEnabled } = require('../config');
const { chat, unit, knowledge } = require('./dataset');

const results = [];
function record(id, category, engine, ok, detail) { results.push({ id, category, engine, ok, detail }); }

function checkAnswer(answer, expect) {
  const text = String(answer || '').toLowerCase();
  if (expect.answerMustIncludeAny && !expect.answerMustIncludeAny.some(s => text.includes(s.toLowerCase())))
    return `answer missing any of [${expect.answerMustIncludeAny.join(', ')}]`;
  if (expect.answerMustNotMatch && new RegExp(expect.answerMustNotMatch, 'i').test(text))
    return `answer matched forbidden /${expect.answerMustNotMatch}/`;
  return null;
}

async function runChatCase(c, modelMode) {
  if (c.modelOnly && !modelMode) { record(c.id, c.category, 'skipped', true, 'model-only (no key)'); return; }
  const res = await runAgentChat({ agent: getAgent(c.provider), message: c.message, demo: true });
  const e = c.expect;
  const fails = [];
  if (e.safe !== undefined && res.plan.safe !== e.safe) fails.push(`safe expected ${e.safe}, got ${res.plan.safe}`);
  if (e.dimension && res.plan.dimension !== e.dimension) fails.push(`dimension expected ${e.dimension}, got ${res.plan.dimension}`);
  if (e.tool && res.plan.tool !== e.tool) fails.push(`tool expected ${e.tool}, got ${res.plan.tool}`);
  const answerFail = checkAnswer(res.answer, e);
  if (answerFail) fails.push(answerFail);
  record(c.id, c.category, res.engine, fails.length === 0, fails.join('; '));
}

function runUnitCase(c) {
  let ok = false, detail = '';
  try { ok = c.assert(resolveMetric(c.term, c.provider)); } catch (err) { detail = err.message; }
  record(c.id, c.category, 'unit', Boolean(ok), ok ? '' : (detail || `assertion failed for "${c.term}"`));
}

function runKnowledgeCase(c) {
  const ids = localSearch(c.query, c.provider, 3).map(r => r.id);
  const fails = [];
  if (c.expectTopIds && !c.expectTopIds.every(id => ids.includes(id))) fails.push(`expected ${c.expectTopIds.join(',')} in top results [${ids.join(', ')}]`);
  if (c.mustNotIds && c.mustNotIds.some(id => ids.includes(id))) fails.push(`forbidden id present in [${ids.join(', ')}]`);
  record(c.id, c.category, 'knowledge', fails.length === 0, fails.join('; '));
}

(async () => {
  const modelMode = modelEnabled();
  console.log(`\nAgent evals — engine: ${modelMode ? 'MODEL (LangGraph + Claude)' : 'DETERMINISTIC (fallback)'}\n`);

  for (const c of chat) await runChatCase(c, modelMode);
  for (const c of unit) runUnitCase(c);
  for (const c of knowledge) runKnowledgeCase(c);

  const byCat = {};
  for (const r of results) {
    (byCat[r.category] ||= { pass: 0, fail: 0 });
    r.ok ? byCat[r.category].pass++ : byCat[r.category].fail++;
    const mark = r.ok ? '  ok ' : 'FAIL ';
    console.log(`${mark} [${r.category}] ${r.id} (${r.engine})${r.ok ? '' : ' — ' + r.detail}`);
  }

  const failed = results.filter(r => !r.ok).length;
  console.log('\nSummary by category:');
  for (const [cat, n] of Object.entries(byCat)) console.log(`  ${cat}: ${n.pass} passed, ${n.fail} failed`);
  console.log(`\n${results.length - failed}/${results.length} passed.\n`);
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error('eval runner crashed:', err); process.exit(1); });
