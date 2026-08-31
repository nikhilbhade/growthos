# Agentic retrieval roadmap

GradientOS agents are retrieval agents first. They may inspect provider data and explain what was retrieved, but they cannot create, edit, pause, publish, or reallocate anything in an ad platform.

## What is live in the application scaffold

Each Meta and TikTok chatbot now follows a small, auditable agent loop:

1. Classify the request into campaigns, ad sets/ad groups, creatives, or performance.
2. Select only the corresponding read-only retrieval tool.
3. Retrieve the selected provider objects for the requested reporting window.
4. Return structured findings, freshness, the tool plan, and a run ID.
5. Refuse requests to modify platform objects before any provider call is made.

This deterministic planning layer is intentionally used before an LLM. It makes retrieval predictable, testable, and safe while connections are still being rolled out.

## ML capabilities to add next

| Capability | Purpose | Data boundary |
| --- | --- | --- |
| Tool-calling language model | Turn natural language into a structured, validated retrieval plan | Receives only the user question and approved, minimized tool results |
| Embedding retrieval | Search the provider data dictionary, integration SOPs, and campaign naming taxonomy | Store documents and metadata in pgvector; exclude raw customer PII and payment data |
| Metric semantic layer | Resolve terms such as “sales”, “conversion”, or “ROAS” to the source-specific definition | Version every metric definition and reporting window |
| Anomaly detection | Surface delivery or spend changes after enough clean history exists | Use aggregated daily series, not order-level customer data |
| Forecasting | Estimate likely spend, conversion, and sales ranges | Require stable history, backtesting, and confidence intervals |

## Production guardrails

- Use structured tool schemas and server-side authorization; never let a model construct provider API requests directly.
- Keep provider tokens in the owning integration service, not in the browser, prompt, or event payload.
- Log the user request, selected tool, parameters, source freshness, record count, and refusal reason in the agent audit trail.
- Run evaluation sets for false retrieval, metric-definition errors, unsafe-action refusals, and hallucinated citations before enabling model-generated prose.
- Keep budget or campaign execution out of scope until a separate approval workflow is explicitly built.
