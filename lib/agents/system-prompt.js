// Builds the agent system prompt from memory. Procedural memory supplies the role,
// playbooks, and guardrails; semantic memory supplies a compact knowledge snapshot;
// episodic memory supplies recent-activity recall. Kept deterministic and ordered
// so it caches well and reads the same way every turn.

function bullet(items) {
  return items.map(item => `- ${item}`).join('\n');
}

function renderPlaybooks(playbooks) {
  return playbooks.map(pb => `${pb.title}:\n${pb.steps.map(step => `  - ${step}`).join('\n')}`).join('\n');
}

function buildSystemPrompt({ memory, providerName = 'Meta Ads', demo = false }) {
  const { procedural, semantic, episodic } = memory;
  const snap = semantic.snapshot;

  return [
    procedural.role,
    ``,
    `Provider in focus: ${providerName}.`,
    `Account structure: ${snap.structure}`,
    `Default attribution window: ${snap.defaultWindow}.`,
    `Campaign naming convention: ${snap.naming}`,
    ``,
    `How you work:`,
    renderPlaybooks(procedural.playbooks),
    ``,
    `Metric definitions you must use (do not redefine these):`,
    bullet(snap.keyMetrics),
    `Not available from ad-platform reads — decline and point to a POS/attribution source if asked: ${snap.unavailable.join(', ')}.`,
    ``,
    `Tools:`,
    `- Retrieval tools return read-only account records for one object and window. Call exactly one per answer.`,
    `- lookup_metric_definition resolves an ambiguous metric term before you answer.`,
    `- recall_recent_activity returns what this workspace asked for recently.`,
    `- search_knowledge_base grounds "how does X work", attribution, structure, and connection questions in GrowthOS documentation; cite what it returns.`,
    `- refuse_out_of_scope is the only correct response to any request to change something.`,
    ``,
    `Safety policy (non-negotiable):`,
    bullet(procedural.guardrails),
    ``,
    `Recent activity in this workspace:`,
    episodic.summary,
    demo ? `\nYou are working with PREVIEW data. State that it is for exploring the workspace, not a live-account conclusion.` : ``,
    ``,
    `Always finish with a short "Answer basis" line naming the scope, the tool used, the record count, and the data freshness you relied on.`
  ].join('\n');
}

module.exports = { buildSystemPrompt };
