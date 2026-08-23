# GrowthOS

GrowthOS is the unified growth and marketplace intelligence layer for restaurant brands. It brings paid-media and delivery-marketplace performance into a single, operator-friendly analytics workspace—so marketing teams can understand how sales, payouts, spend, organic demand, and marketing-driven demand perform by location.

## Product experience

- Global analytics filters for marketplace, time range, and location.
- Unified reporting for net sales, payouts, paid-media spend, organic sales, and marketing-driven sales.
- Location-level sales composition and performance comparisons.
- A dedicated Setup & Connections workspace that keeps authorization and onboarding separate from day-to-day analytics.
- Read-only Meta and TikTok retrieval agents for campaign metadata, delivery, budgets, audiences, and attribution fields.
- Provider-specific connection flows for Meta, TikTok, Google Ads, DoorDash, and Uber Eats.

GrowthOS is intentionally read-only at this stage. It does not modify campaigns, budgets, menu configuration, or marketplace settings.

The agent runtime plans a request, selects a scoped retrieval tool, returns source freshness and findings, and refuses mutation requests before a provider call is made. The model, embeddings, evaluation, and safety roadmap is documented in [agentic capabilities](docs/agentic-capabilities.md).

## Data connections

| Provider | Connection model |
| --- | --- |
| Meta | OAuth with `ads_read`; optional business discovery access |
| TikTok | Read-only Marketing API reporting access |
| Google Ads | OAuth reporting with a GrowthOS-managed developer token |
| DoorDash | Business Admin or Business Group Admin portal invitation |
| Uber Eats | Manager invitation for each individual restaurant location |

Each connection remains pending until GrowthOS verifies access, selected scope, history, freshness, and store or account coverage.

## Provider service architecture

Provider access is split into independently deployable services: one integration service for consent and credential ownership, plus one ingestion service for historical and incremental retrieval, per provider. Meta, TikTok, Google Ads, DoorDash, and Uber Eats can therefore scale and fail independently without taking down Analytics.

The frontend/control plane remains on Vercel; provider workers are designed for Cloud Run, ECS/Fargate, or Kubernetes. See [the provider microservices architecture](docs/microservices-architecture.md) and use `docker compose -f docker-compose.microservices.yml up --build` to run the local service topology.

## Local development

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Operating notes

- Demo Mode provides clearly labelled synthetic data for product walkthroughs; it is isolated from customer connections.
- Production provider access requires GrowthOS-owned provider applications, reviewed access where applicable, approved redirect URIs, and encrypted server-side credential storage.
- Full provider onboarding and recovery procedures are documented in [the integration access SOP](docs/integration-access-sop.md).
