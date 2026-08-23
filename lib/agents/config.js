// Central, server-side-only configuration for the agent runtime.
// Secrets are read from process.env (populated from .env, which is gitignored).
// Nothing here is ever sent to the browser, a prompt, or an event payload.

const config = {
  // Anthropic model. AGENT_MODEL_API_KEY is reserved in .env.example.
  model: {
    id: process.env.AGENT_MODEL_ID || 'claude-opus-5',
    apiKey: process.env.AGENT_MODEL_API_KEY || null,
    maxTokens: Number(process.env.AGENT_MODEL_MAX_TOKENS || 1024),
    // Effort keeps planning cheap; raise for harder reasoning once evals exist.
    effort: process.env.AGENT_MODEL_EFFORT || 'low'
  },
  // Embedding model powers semantic-memory vector search (LangGraph Store index).
  embedding: {
    model: process.env.AGENT_EMBEDDING_MODEL || null
  },
  // LangFuse observability. Traces stay on infrastructure you control.
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || null,
    secretKey: process.env.LANGFUSE_SECRET_KEY || null,
    baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com'
  },
  // Postgres connection for durable long-term memory (LangGraph checkpointer + store).
  postgres: {
    connectionString: process.env.AGENT_MEMORY_DATABASE_URL || process.env.DATABASE_URL || null
  }
};

// The LLM path is only attempted when a model key is present. Without it the
// runtime uses the deterministic planner, so preview mode keeps working.
function modelEnabled() {
  return Boolean(config.model.apiKey);
}

function langfuseEnabled() {
  return Boolean(config.langfuse.publicKey && config.langfuse.secretKey);
}

module.exports = { config, modelEnabled, langfuseEnabled };
