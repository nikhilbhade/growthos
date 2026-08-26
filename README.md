# GrowthOS

GrowthOS is the growth intelligence workspace for multi-location restaurant brands. It brings paid-media delivery, marketplace outcomes, operating context, and decision-ready workflows into one controlled workspace.

The product is designed for restaurant marketers and operators who need to understand what changed, where it changed, and what action merits review. GrowthOS is **read-only by default**: it retrieves and explains data but does not edit ad accounts, publish creatives, change budgets, or modify marketplace settings.

## What is in the product today

- Unified analytics with location, marketplace, channel, and date-range filters.
- Period-over-period and year-over-year comparison views for payouts, sales, spend, organic sales, marketing-driven sales, and AOV.
- Separate workspaces for Meta, TikTok, Google, delivery marketplaces, market intelligence, operating context, customer retention, and variance explanation.
- Setup & Connections workflow for Meta, TikTok, Google Ads, DoorDash, Uber Eats, and future POS/SFTP data sources.
- Campaign-to-ad-set/ad-group-to-creative drill-down views using clearly labelled preview data until a provider is connected.
- Read-only retrieval agents with deterministic safety controls, optional LLM planning, documentation retrieval, retrieval traces, and evaluation coverage.
- Visual recommendation workflows that require human review before any future execution capability is considered.

## Product boundaries

| Area | Current position |
| --- | --- |
| Provider connections | Product and service contracts are scaffolded; live OAuth, token storage, and provider API retrieval require approved provider applications and production credentials. |
| Data | Demo data is isolated from customer connections. Provider-reported metrics are directional until reconciled with finance or order data. |
| Agent actions | Retrieval and explanation only. The agent refuses mutations before a provider call. |
| Financial truth | Order, payout, and accounting/POS data are the financial source of truth; ad-platform results are reporting signals. |
| Attribution | Exact order-level attribution requires a verified identifier bridge. Otherwise GrowthOS labels results as platform-reported or directional. |

## Architecture at a glance

```text
Web workspace / control plane
        │
        ├── setup, policy, analytics, review workflows
        ├── read-only agent chat API
        │
        ├── provider integration services  ── consent and credential ownership
        ├── provider ingestion services    ── backfills and incremental retrieval
        └── knowledge service               ── grounded documentation retrieval

Supabase/Postgres + object storage
        ├── tenant and connection metadata
        ├── modeled campaign, order, and attribution records
        ├── raw immutable payload references
        └── optional pgvector knowledge index
```

The web application is the control plane. Provider OAuth callbacks, credentials, and scheduled ingestion belong in provider-owned services—not in the browser. See [the architecture guide](docs/microservices-architecture.md).

## Quick start

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- Docker Desktop only if you want to run the service topology
- Python 3.11+ only if you want to run the knowledge service directly

### Run the workspace

```bash
npm install
npm start
```

Open <http://localhost:3000>. Add `?demo=1` to use explicitly labelled preview data.

The root URL is the public GrowthOS landing page. The application workspace is
at <http://localhost:3000/app.html>. Google sign-in becomes active once the
Supabase variables and provider configuration described in
[Google login setup](docs/google-login-setup.md) are complete.

### Run agent evaluations

```bash
npm test
```

### Run the knowledge service

```bash
python services/knowledge/app.py
```

Or run the local service topology:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

## Configuration

Copy `.env.example` to `.env` and set only the values needed for the capability you are enabling. All values in `.env` are server-side secrets and must never be exposed to browser code.

| Variable group | Purpose |
| --- | --- |
| `SUPABASE_*` | Tenant data, connection metadata, raw payload storage, and optional service-side persistence. |
| `SERVICE_AUTH_TOKEN` | Authenticates service-to-service requests. Use a different production secret per environment. |
| `AGENT_MODEL_*` | Optional model-backed agent planner. Without a key, the deterministic read-only planner remains available. |
| `AGENT_EMBEDDING_*`, `KNOWLEDGE_DATABASE_URL` | Optional real embeddings and pgvector knowledge retrieval. The local fallback requires no external key. |
| `KNOWLEDGE_SERVICE_URL` | Optional Python knowledge-service endpoint. |

## Data and integration model

GrowthOS uses the following trust hierarchy:

1. Order/POS/accounting or marketplace payout data for financial outcomes.
2. Ad-platform metadata and delivery metrics for campaign structure, spend, impressions, clicks, and reported conversions.
3. A verified click, session, UTM, or promo-code bridge for exact order attribution.
4. Location/time/channel models for directional attribution when a verified bridge is unavailable.

Where direct POS access is unavailable, a daily, month-to-date SFTP export is the preferred fallback. The proposed delivery contract is documented in [SFTP data contract](docs/sftp-data-contract.md).

## Documentation

- [Integration access SOP](docs/integration-access-sop.md) — customer-facing connection requirements and recovery steps.
- [Provider microservices architecture](docs/microservices-architecture.md) — service responsibilities and deployment boundary.
- [Agent capabilities](docs/agentic-capabilities.md) — safety model, retrieval loop, and future ML work.
- [Meta and TikTok agent scope](docs/meta-tiktok-agent-scope.md) — tool, memory, evaluation, and grounding design.
- [Agent data ingestion](docs/agent-data-ingestion.md) — data dictionary and attribution boundaries for Meta and TikTok.
- [SFTP data contract](docs/sftp-data-contract.md) — fallback financial and marketplace ingestion specification.
- [Production readiness](docs/production-readiness.md) — what is implemented, what remains before live customer data, and release gates.
- [Google login setup](docs/google-login-setup.md) — Google OAuth, Supabase Auth, redirect URLs, and production access-gate checklist.
- [Cloud Run deployment](docs/cloud-run-web-deployment.md) — the single GCP build, routing, secrets, and sign-in rollout path.
- [Contributing](CONTRIBUTING.md) — local workflow and quality standards.

## Deployment posture

The production target is a single Cloud Run service built and deployed by Cloud Build. It hosts the landing page, authenticated workspace, and the Node API under one origin, so Google OAuth routing remains deterministic. Vercel is not part of the production path. A production launch with customer data still requires provider approval, encrypted credential storage, durable ingestion queues, tenant authorization, database migrations, observability, and a documented incident process. The exact launch gates are in [production readiness](docs/production-readiness.md).

## License

Private and proprietary. Do not redistribute without written authorization from GrowthOS.
