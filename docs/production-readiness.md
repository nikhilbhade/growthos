# Production readiness

## Purpose

This checklist separates the deployed GrowthOS workspace from a production service that can safely ingest and explain customer data. A UI deployment alone is not a live data product.

## Implemented in the repository

- Read-only product workspace and isolated demo mode.
- Provider connection and ingestion service contracts.
- Tenant-oriented Supabase schema, RLS policies, connection status, raw-payload references, campaign metrics, order records, and attribution-match tables.
- Deterministic read-only agent guardrail, structured retrieval tools, retrieval traces, and evaluation harness.
- Knowledge service with offline fallback and optional real embedding/pgvector paths.
- Documentation for integration access, provider data boundaries, and SFTP fallback data contracts.

## Required before handling a customer’s live data

### Identity and tenancy

- Production authentication, workspace membership, and role model.
- Enforced tenant authorization on every API and service request.
- Server-side secret manager and encrypted credential/token store.
- Audit logging for connection, retrieval, export, and administrative events.

### Provider access

- GrowthOS-owned approved provider applications and production redirect URIs.
- Approved provider scopes, app review where required, and documented re-authentication paths.
- Token rotation, revocation, connection health checks, and account/location scope selection.
- A provider-specific rate-limit, retry, backoff, and dead-letter strategy.

### Data platform

- Private raw-object storage and lifecycle/retention policy.
- Durable queue between control plane and ingestion services.
- Idempotent backfill/incremental ingestion with source freshness and completeness tracking.
- Observability for failed jobs, delayed data, schema drift, reconciliation variance, and data coverage.
- A tested restore and reprocessing procedure.

### Financial and attribution correctness

- A finance/POS or SFTP source for payouts, sales, commissions, discounts, promotions, and order-level outcomes.
- Explicit metric definitions, timezone policy, reporting cutoffs, and currency handling.
- Attribution labels that distinguish verified, platform-reported, and directional results.
- Human review before any recommendation can initiate future execution.

### Security and operational readiness

- Threat model, least-privilege IAM, network policy, encryption at rest/in transit, and secrets rotation.
- Incident response, customer support escalation, uptime/latency targets, and runbooks.
- Privacy review, data-processing agreement, and retention/deletion procedures appropriate to the customer data processed.
- Backup, disaster-recovery, and deployment rollback tests.

## Launch gates

| Gate | Minimum evidence |
| --- | --- |
| Demo | Isolated preview data and no production credentials. |
| Design partner | Signed data terms, one approved provider connection, freshness monitoring, and manual reconciliation. |
| Live analytics | Tenant authorization, encrypted tokens, durable ingestion, financial source of truth, alerting, and incident ownership. |
| Recommendations | Historical backtesting, confidence/disclaimer policy, hard constraints, and human approval record. |
| Execution | Separate authorization, immutable audit log, rollback capability, change limits, and provider-approved write access. |

Until the execution gate is met, GrowthOS remains a read-only intelligence product.
