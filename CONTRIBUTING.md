# Contributing to GradientOS

## Working principles

GradientOS handles sensitive restaurant, marketing, and financial information. Every change should make the product more trustworthy, not merely more capable.

- Keep provider credentials, customer PII, payment data, and raw payloads out of browser code, prompts, logs, and Git.
- Do not make an agent action executable merely because it sounds plausible. New provider mutations require a separate approval, audit, and rollback design.
- Preserve the distinction between financial truth, platform-reported outcomes, and modeled attribution in code and copy.
- Prefer small, reviewable pull requests with a clear customer or operational outcome.

## Local workflow

```bash
npm install
npm start
npm test
```

Use `?demo=1` for a safe product walkthrough. Demo data must remain visibly labelled and must never be mixed with connected customer data.

For the Python knowledge service:

```bash
python services/knowledge/app.py
cd services/knowledge && python -m unittest -v
```

## Before opening a pull request

1. Run the relevant test suite.
2. Test the affected UI at desktop and mobile widths.
3. Confirm no token, secret, customer identifier, raw report, or `.env` file is staged.
4. Update the relevant document when changing a provider contract, attribution definition, agent guardrail, or deployment requirement.
5. State whether the change affects preview data, production data, or both.

## Database changes

- Add append-only migrations under `supabase/migrations/`.
- Enable RLS on tenant-scoped tables and add a narrow read policy.
- Keep raw payloads in private object storage; modeled tables should retain only the necessary normalized fields and a pointer to the raw object.
- Never silently redefine a metric. Version the definition or add a migration path.

## Integration changes

- Treat OAuth scopes as product permissions. Request only the scope that the feature genuinely needs.
- Keep tokens in the integration service’s encrypted store. Never send them through the browser or an ingestion queue payload.
- Ensure ingestion is idempotent and records coverage, freshness, source, and error state.
- Add a provider-safe fallback for temporary provider failure and rate limiting.

## Agent changes

- Preserve the deterministic mutation guard before any model tool selection.
- Use structured tool inputs and allowlisted providers, dimensions, and metrics.
- Extend the evaluation dataset when adding a tool, metric, or refusal class.
- Never expose hidden reasoning. Customer responses may show a concise retrieval trace—source, data window, tool used, record count, and freshness—but not private chain-of-thought.
