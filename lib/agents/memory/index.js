// Memory facade for the agents. Bundles the three memory systems the LangGraph
// agent relies on:
//
//   procedural — how to act (role, playbooks, guardrails) → system prompt
//   semantic   — what is true (metrics, data dictionary, structure) → lookup tool
//   episodic   — what happened (past runs per brand) → recall tool + write path
//
// The LangGraph mapping: procedural is the compiled graph + prompt, semantic is a
// Store namespace with embedding search, episodic is the checkpointer plus a
// per-brand Store namespace backed by agent_retrieval_runs.

const procedural = require('./procedural-memory');
const semantic = require('./semantic-memory');
const episodic = require('./episodic-memory');

// Assemble a memory context for one turn. Reads are cheap and safe; the episodic
// read is awaited so the prompt can carry recent-activity recall.
async function getMemory({ provider = 'meta', brandId = null, demo = false } = {}) {
  const recentRuns = await episodic.recentRuns({ provider, brandId, demo, limit: 5 });
  return {
    provider,
    procedural: procedural.getProcedural(),
    semantic: {
      snapshot: semantic.promptSnapshot(provider),
      resolveMetric: term => semantic.resolveMetric(term, provider),
      describeDimension: semantic.describeDimension,
      structure: semantic.getStructure(provider)
    },
    episodic: {
      recentRuns,
      summary: episodic.summarize(recentRuns),
      record: run => episodic.record({ ...run, provider, brandId })
    },
    versions: { procedural: procedural.VERSION, semantic: semantic.VERSION, episodic: episodic.VERSION }
  };
}

module.exports = { getMemory, procedural, semantic, episodic };
