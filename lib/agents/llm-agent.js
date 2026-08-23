// LangGraph agent: the model-driven planner/answerer. Wires Claude
// (@langchain/anthropic) + the read-only tools + the three memory systems into a
// prebuilt react agent, traced with LangFuse.
//
// Framework dependencies are loaded lazily. If they are not installed, or no
// model key is configured, this module throws DEPS_UNAVAILABLE and the runtime
// falls back to the deterministic planner — so preview mode always works.

const { config, modelEnabled, langfuseEnabled } = require('./config');
const { getMemory } = require('./memory');
const { buildSystemPrompt } = require('./system-prompt');

class DepsUnavailable extends Error {
  constructor(message) { super(message); this.code = 'DEPS_UNAVAILABLE'; }
}

// Lazy, cached framework handles. Missing packages are a soft failure.
let framework = null;
function loadFramework() {
  if (framework) return framework;
  try {
    const { ChatAnthropic } = require('@langchain/anthropic');
    const { createReactAgent } = require('@langchain/langgraph/prebuilt');
    const { MemorySaver, InMemoryStore } = require('@langchain/langgraph');
    const { buildTools } = require('./tools'); // pulls @langchain/core + zod
    let CallbackHandler = null;
    try { ({ CallbackHandler } = require('langfuse-langchain')); } catch { /* observability optional */ }
    framework = { ChatAnthropic, createReactAgent, MemorySaver, InMemoryStore, CallbackHandler, buildTools };
    return framework;
  } catch (error) {
    throw new DepsUnavailable(`LangChain/LangGraph not installed: ${error.message}`);
  }
}

// One durable checkpointer + store per process. The checkpointer is short-term
// (thread-scoped) memory; the store is the long-term memory backend. Both move to
// Postgres (Supabase) once AGENT_MEMORY_DATABASE_URL is set — see docs.
let saver = null;
let store = null;
function memoryBackends(fw) {
  if (!saver) saver = new fw.MemorySaver();
  if (!store) store = new fw.InMemoryStore();
  return { saver, store };
}

function langfuseHandler(fw) {
  if (!langfuseEnabled() || !fw.CallbackHandler) return null;
  return new fw.CallbackHandler({ publicKey: config.langfuse.publicKey, secretKey: config.langfuse.secretKey, baseUrl: config.langfuse.baseUrl });
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`agent turn exceeded ${ms}ms`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function money(value) { return `$${Math.round(value).toLocaleString('en-US')}`; }

function buildFindings(trace) {
  const retrieval = trace.retrieval;
  if (!retrieval || retrieval.pending) return [];
  const records = retrieval.records || [];
  const totalSpend = records.reduce((sum, r) => sum + (Number(r.spend) || 0), 0);
  return [
    { label: 'Records retrieved', value: String(records.length) },
    ...(totalSpend ? [{ label: 'Retrieved spend', value: money(totalSpend) }] : []),
    { label: 'Reporting window', value: retrieval.freshness }
  ];
}

async function runLlmAgent({ agent, message, range = 'last_14_days', dimension = 'campaign', demo = false, brandId = null, threadId = null }) {
  if (!modelEnabled()) throw new DepsUnavailable('AGENT_MODEL_API_KEY is not set.');
  const fw = loadFramework();

  const provider = agent.capability.id;
  const providerName = agent.capability.provider;
  const memory = await getMemory({ provider, brandId, demo });
  const trace = { toolsUsed: [], tool: null, dimension, range, retrieval: null, metricVersion: null, refused: false, refusalReason: null };

  const systemPrompt = buildSystemPrompt({ memory, providerName, demo });
  const tools = fw.buildTools({ agent, memory, demo, defaultRange: range, trace });

  const llm = new fw.ChatAnthropic({ model: config.model.id, apiKey: config.model.apiKey, maxTokens: config.model.maxTokens });
  const { saver: checkpointSaver, store: agentStore } = memoryBackends(fw);
  const app = fw.createReactAgent({ llm, tools, prompt: systemPrompt, checkpointSaver, store: agentStore });

  const handler = langfuseHandler(fw);
  const runId = `run_${Date.now().toString(36)}`;
  // Bound the tool loop and cap wall-clock; on timeout we throw so the runtime
  // falls back to the deterministic path rather than hanging the request.
  const result = await withTimeout(app.invoke(
    { messages: [{ role: 'user', content: message }] },
    { configurable: { thread_id: threadId || `${provider}:${brandId || 'anon'}:${runId}` }, callbacks: handler ? [handler] : [], runName: `growthos-${provider}-agent`, recursionLimit: config.model.recursionLimit }
  ), config.model.timeoutMs);

  const last = result.messages[result.messages.length - 1];
  const answer = Array.isArray(last.content) ? last.content.map(part => (typeof part === 'string' ? part : part.text || '')).join('') : String(last.content || '');

  const plan = {
    safe: !trace.refused,
    intent: trace.refused ? 'out_of_scope' : 'read_only_retrieval',
    tool: trace.tool,
    dimension: trace.dimension,
    range: trace.range,
    metricVersion: trace.metricVersion,
    toolsUsed: trace.toolsUsed
  };

  await memory.episodic.record({
    question: message, selectedTool: trace.tool || (trace.refused ? 'refuse_out_of_scope' : null),
    dimension: trace.dimension, range: trace.range,
    recordsReturned: trace.retrieval ? (trace.retrieval.records || []).length : 0,
    freshness: trace.retrieval ? trace.retrieval.freshness : null, freshnessAt: trace.retrieval ? trace.retrieval.retrievedAt : null,
    metricVersion: trace.metricVersion, refusalReason: trace.refusalReason,
    status: 'succeeded'
  });

  return {
    runId, engine: 'llm', plan, retrieval: trace.retrieval, answer,
    findings: buildFindings(trace),
    suggestedPrompts: [`Show active ${provider === 'tiktok' ? 'ad groups' : 'ad sets'}`, 'What attribution window is configured?', 'Retrieve creative metadata'],
    memoryVersions: memory.versions,
    disclaimer: 'Read-only retrieval agent. Results are provider-reported and are not a recommendation or execution instruction.'
  };
}

module.exports = { runLlmAgent, DepsUnavailable };
