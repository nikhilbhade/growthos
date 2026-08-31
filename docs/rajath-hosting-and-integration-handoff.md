# Rajath handoff: hosting and paid-media integrations

## Objective

Move GradientOS from a preview deployment into a production-ready, read-only analytics platform for Meta, TikTok, and Google Ads. The first live capability is data retrieval and reporting—not campaign execution.

## Non-negotiable product boundary

GradientOS may retrieve and explain account, campaign, ad set/ad group, creative, audience, budget, spend, impression, click, and provider-reported conversion data.

GradientOS must **not** create, edit, publish, pause, or reallocate any advertising object yet. Tokens, credentials, customer PII, and raw financial data must never reach browser code, logs, agent prompts, or Git.

## Target production architecture

```text
app.growthos.com       Cloudflare Pages
api.growthos.com       AWS ECS/Fargate API and OAuth callbacks
provider workers       AWS ECS/Fargate integration and ingestion services
database/auth          Supabase/Postgres initially
raw reports            private S3 bucket
jobs                   SQS + dead-letter queues
credentials            AWS Secrets Manager
cache/rate limits      ElastiCache Redis
observability          CloudWatch + structured audit events
```

The web workspace is the control plane. It requests a connection or ingestion; it does not own provider credentials. Existing Vercel deployments are preview-only.

## First hosting milestones

### 1. Accounts and environments

- [ ] Create or confirm the GradientOS Cloudflare account and production domain.
- [ ] Create or confirm the AWS production account.
- [ ] Create separate `development`, `staging`, and `production` environments.
- [ ] Create a Supabase production project; apply the repository migrations in order.
- [ ] Create AWS Secrets Manager secrets for every environment; do not use `.env` files in production.
- [ ] Create private S3 buckets for raw integration data and application backups.

### 2. Domains and deployment

- [ ] Deploy the web workspace to Cloudflare Pages at `app.growthos.com`.
- [ ] Deploy the Node API to Fargate behind an HTTPS load balancer at `api.growthos.com`.
- [ ] Deploy each provider service independently: Meta, TikTok, Google, DoorDash, Uber Eats, and knowledge service.
- [ ] Configure Cloudflare WAF, HTTPS redirects, and environment-specific domains.
- [ ] Set up GitHub Actions deployment credentials and staging preview deploys.

### 3. Data platform

- [ ] Configure SQS queues per provider and a dead-letter queue per integration type.
- [ ] Store raw payloads immutably; retain only modeled/necessary fields in Postgres.
- [ ] Add ingestion idempotency keys, provider rate limits, retries, and freshness/coverage tracking.
- [ ] Add monitoring for failed syncs, reauthentication needs, schema drift, and data-delay alerts.

## Meta integration: read-only MVP

### GradientOS setup

- [ ] Create and verify a GradientOS Meta Business Portfolio.
- [ ] Create a GradientOS Meta developer app.
- [ ] Add the Marketing API and Facebook Login for Business products.
- [ ] Configure the production callback: `https://api.growthos.com/oauth/meta/callback`.
- [ ] Request only `ads_read` for the first production release.
- [ ] Complete Meta advanced access/App Review required for external restaurant customers.
- [ ] Store `META_APP_ID`, `META_APP_SECRET`, and customer tokens in AWS Secrets Manager.

### Restaurant connection flow

1. The customer selects **Connect Meta** in GradientOS.
2. GradientOS redirects to Meta OAuth; the customer signs in directly with Meta.
3. The customer approves GradientOS and selects allowed ad accounts.
4. The callback exchanges the authorization code server-side and encrypts the token.
5. GradientOS validates account coverage and starts a historical read-only sync.

### Data to retrieve

- Account: ID, currency, timezone, reporting cutoff.
- Campaign: objective, status, budgets, buying type, schedule.
- Ad set: audience, location/radius, placement, bid strategy, budget, optimization goal.
- Ad/creative: format, asset references, CTA, destination, delivery status.
- Daily insights: spend, impressions, reach, frequency, clicks, CTR, CPM, CPC, results, and reported conversion metrics.

Do not request `ads_management` until a separate execution service, review record, audit log, hard constraint engine, and rollback design are approved.

## TikTok integration: read-only MVP

### GradientOS setup

- [ ] Create a GradientOS TikTok Business Center.
- [ ] Register GradientOS in TikTok API for Business.
- [ ] Create a developer app and securely record its App ID and App Secret.
- [ ] Configure `https://api.growthos.com/oauth/tiktok/callback` as an advertiser redirect URL.
- [ ] Select only advertiser/account reporting permissions required by the endpoints used.
- [ ] Submit the developer app for review.
- [ ] Store the app credentials and advertiser tokens in AWS Secrets Manager.

### Restaurant connection flow

1. The customer selects **Connect TikTok**.
2. GradientOS redirects to TikTok advertiser authorization.
3. The customer selects the permitted advertiser/ad accounts.
4. TikTok returns an `auth_code` to the GradientOS callback.
5. GradientOS exchanges it server-side for an access token, validates scope, and starts the first sync.

### Customer permissions

- **Analyst:** enough for ads and performance reporting.
- **Operator/Admin:** needed only for future create/edit capabilities.

### Data to retrieve

- Advertiser account, campaign, ad group, ad, and creative metadata.
- Targeting, placements, schedule, optimization goal, and budget metadata.
- Daily reporting: spend, impressions, clicks, reach, conversions, reported cost metrics, and creative performance.
- Spark-ad metadata and creator references only when separately authorized.

## Google Ads: next after Meta and TikTok

- [ ] Create a GradientOS Google Ads Manager Account (MCC).
- [ ] Apply for a Google Ads developer token through the MCC API Center.
- [ ] Create Google Cloud OAuth credentials and configure `https://api.growthos.com/oauth/google/callback`.
- [ ] Use the `adwords` OAuth scope and start with customer Read-only account access.
- [ ] Apply for Standard developer-token access before scaling to hundreds of locations.

## Acceptance criteria for the first live provider

- [ ] A customer can complete OAuth without sharing a password or token with GradientOS.
- [ ] Tokens are encrypted, tenant-scoped, revocable, and absent from browser requests/logs.
- [ ] The customer can choose the authorized accounts and locations.
- [ ] A backfill runs idempotently, records its coverage and reporting freshness, and gracefully retries provider limits.
- [ ] Dashboard data is labelled as provider-reported and does not claim financial truth.
- [ ] The retrieval agent reports its source, time range, record count, and data freshness.
- [ ] A mutation request is refused and produces an auditable refusal event.

## Working agreement

- Use a dedicated branch per change and open a pull request into `main`.
- Do not push directly to `main`.
- Run `npm test` and the Python knowledge-service tests when agent or service code changes.
- Update the relevant implementation and operations document with every provider or infrastructure change.

## Reference documents

- [Production readiness](production-readiness.md)
- [Provider microservices architecture](microservices-architecture.md)
- [Integration access SOP](integration-access-sop.md)
- [Agent data ingestion](agent-data-ingestion.md)
- [SFTP data contract](sftp-data-contract.md)
