# Provider microservices

GrowthOS keeps the web application as a control plane. It owns the customer experience, workspace setup status, and permission to start a provider workflow. Provider credentials, OAuth callbacks, and scheduled data retrieval do not run in the web application.

Each marketplace has two independent services:

| Service | Responsibility | Scales on |
| --- | --- | --- |
| `<provider>-integration` | Creates a connection intent, owns consent or invite handling, encrypts and rotates that provider’s credentials | Customer setup volume and OAuth callback traffic |
| `<provider>-ingestion` | Runs historical backfills and incremental data retrieval, normalizes provider objects, and publishes ingestion results | Provider API rate limits, account count, and history depth |

The current repository contains provider services for Meta, TikTok, Google Ads, DoorDash, and Uber Eats, plus a **knowledge** service (`services/knowledge/`, Python) that provides read-only embedding retrieval over the agents' grounding corpus — the first Python service in GrowthOS. Each provider service has a narrowly scoped HTTP surface:

```text
GET  /health
GET  /v1/capabilities
POST /v1/connection-intents   # integration services only
POST /v1/ingestions           # ingestion services only
```

The endpoints are control-plane contracts. They do not yet call a provider or store a customer token; that wiring happens only after GrowthOS owns approved provider applications and encrypted credential storage.

## Local run

```bash
docker compose -f docker-compose.microservices.yml up --build
```

For one service without Docker:

```bash
PROVIDER=meta ROLE=integration PORT=4101 node services/service.js
```

## Production deployment

Deploy the frontend/control plane on Vercel. Deploy each provider service as a separate Cloud Run, ECS/Fargate, or Kubernetes deployment. Give every service its own service account, secret set, autoscaling rule, dead-letter queue, and provider rate limiter.

The next production step is to place a durable queue between the control plane and ingestion services. An ingestion request should contain only a workspace ID, connection ID, requested range, and idempotency key. Provider tokens remain in the owning integration service’s encrypted store and are never sent to the browser or event payload.
