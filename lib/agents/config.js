// Central, server-side-only configuration for the agent runtime.
// Secrets are read from process.env (populated from .env, which is gitignored).
// Nothing here is ever sent to the browser, a prompt, or an event payload.

const config = {
  // Agent model provider. `vertex` uses Gemini through Vertex AI with the
  // Cloud Run service account (Application Default Credentials), not an API key.
  model: {
    provider: process.env.AGENT_MODEL_PROVIDER || 'anthropic',
    id: process.env.AGENT_MODEL_ID || (process.env.AGENT_MODEL_PROVIDER === 'vertex' ? 'gemini-2.5-flash-lite' : 'claude-opus-5'),
    apiKey: process.env.AGENT_MODEL_API_KEY || null,
    maxTokens: Number(process.env.AGENT_MODEL_MAX_TOKENS || 1024),
    // Effort keeps planning cheap; raise for harder reasoning once evals exist.
    effort: process.env.AGENT_MODEL_EFFORT || 'low',
    // Production safety rails: cap wall-clock per turn and bound the tool loop so
    // a hung or looping model call falls back to deterministic instead of hanging.
    timeoutMs: Number(process.env.AGENT_MODEL_TIMEOUT_MS || 30000),
    recursionLimit: Number(process.env.AGENT_RECURSION_LIMIT || 8)
  },
  vertex: {
    projectId: process.env.VERTEX_AI_PROJECT_ID || null,
    location: process.env.VERTEX_AI_LOCATION || 'us-central1'
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
  },
  // Python knowledge service (M3 embedding retrieval). When unset, the agent uses
  // a local fallback over the same corpus so grounding still works.
  knowledge: {
    url: process.env.KNOWLEDGE_SERVICE_URL || null,
    authToken: process.env.SERVICE_AUTH_TOKEN || null
  }
};

// The LLM path is only attempted when a model key is present. Without it the
// runtime uses the deterministic planner, so preview mode keeps working.
function modelEnabled() {
  if (config.model.provider === 'vertex') return Boolean(config.vertex.projectId);
  return config.model.provider === 'anthropic' && Boolean(config.model.apiKey);
}

function langfuseEnabled() {
  return Boolean(config.langfuse.publicKey && config.langfuse.secretKey);
}

module.exports = { config, modelEnabled, langfuseEnabled };
