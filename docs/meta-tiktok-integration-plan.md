# Meta & TikTok live integration — implementation plan

This is a planning artifact for the **live** Meta and TikTok integrations: the
OAuth connect flow, encrypted token storage, and data ingestion that the
[agent-scope doc](meta-tiktok-agent-scope.md) explicitly deferred ("Live
provider integration — OAuth, token storage, real Marketing API calls, and
ingestion remain stubbed"). It defines the target, the boundaries, the data
contracts, and an executable milestone sequence so the work can be built and
reviewed against a fixed plan.

It follows the two decisions made for this phase:

- **Read-only MVP** — no connector creates, edits, pauses, or reallocates
  budget. Meta uses **ad sets**, TikTok uses **ad groups** and additionally an
  **advertiser** object.
- **Separate microservices** — credentials, OAuth callbacks, and scheduled
  retrieval do **not** run in the web control plane, per
  [microservices-architecture.md](microservices-architecture.md).

## 1. Where we are today

| Layer | File / object | State |
| --- | --- | --- |
| Data model | `supabase/migrations/001_initial.sql` | **Ready.** `integration_connections` (with `credential_ref`, `configuration` jsonb, `ad_account_count`, `last_successful_sync_at`), `sync_runs`, `campaigns`, `campaign_daily_metrics`, `campaign_budget_changes`, and a private `raw-integration-data` storage bucket. RLS by brand owner. |
| Control-plane status | `lib/integrations.js` | Reads/writes connection **status** only. `requestIntegrationSetup` flips a row to `review`. No token, no provider call. |
| Provider services | `services/service.js`, `services/providers.js` | HTTP stubs. `POST /v1/connection-intents` and `POST /v1/ingestions` return `pending`/`queued` envelopes but **do not call a provider or store a token**. |
| Agents | `lib/agents/*-retrieval-agent.js` | Return **demo** records or `pending:true`. Read-only by design; never read the warehouse yet. |
| Frontend | `web/` (Setup & connections) | Lists providers and shows a static setup SOP dialog. No real OAuth handoff. |

The schema and service seams exist end to end; nothing between "customer clicks
connect" and "agent reads real rows" is implemented.

## 2. Goal of this phase

Stand up, for **Meta first, then TikTok** (identical shape):

1. A **`<provider>-integration`** service that runs the OAuth consent flow,
   exchanges the code for a long-lived token, discovers ad accounts/advertisers,
   and writes an encrypted credential + a `connected` row.
2. A **`<provider>-ingestion`** service that backfills history and runs
   incremental syncs into `campaigns` + `campaign_daily_metrics`, tracked in
   `sync_runs`.
3. The wiring that lets the **retrieval agents and dashboard read live rows** for
   a connected brand while preserving the demo/`pending` contract for everyone
   else.

Non-goals (unchanged from the agent-scope doc): any mutation capability,
anomaly/forecasting, and new providers beyond Meta/TikTok in this phase.

## 3. Prerequisites — provider apps (external, gating)

No code can substitute for these. They have review lead times, so start them in
parallel with M1–M2.

### Meta
- A GrowthOS **Meta Business Portfolio** and a **GrowthOS-owned Meta Developer
  App** (type: Business).
- Add the **Marketing API** product.
- **App Review for Advanced Access to `ads_read`** — required to read customer ad
  accounts outside the app's own dev users. `business_management` only if
  account discovery beyond `/me/adaccounts` is needed. **Never** request
  `ads_management` in this MVP.
- Business verification on the portfolio.
- Register the production **OAuth redirect URI**:
  `https://meta-integration.<domain>/oauth/callback`.
- Before review completes, everything is testable against the app's **dev-mode**
  users and a sandbox ad account.

### TikTok
- A **TikTok for Business developer app** (TikTok Marketing API).
- Request **Reporting / Consolidated Report** + campaign/ad-group/ad read scopes;
  submit the app for **audit**.
- Register the **redirect URI**:
  `https://tiktok-integration.<domain>/oauth/callback`.
- Sandbox advertiser available before audit completes.

**Deliverable of this step:** a filled-in credential checklist (App IDs, secrets,
redirect URIs, API versions, review status) handed to whoever holds the GrowthOS
provider accounts. Track it in a private location — never commit secrets.

## 4. Service topology & deployment

Four new services (two per provider), each with its own service account, secret
set, and rate limiter — the shape `services/service.js` already anticipates via
`PROVIDER` + `ROLE`:

```
meta-integration      tiktok-integration      (OAuth + token custody)
meta-ingestion        tiktok-ingestion        (backfill + incremental sync)
```

**Deployment target.** `microservices-architecture.md` names AWS/Cloudflare, but
GrowthOS actually runs on **Google Cloud Run + Supabase** today. To avoid a
second cloud, deploy each microservice as its **own Cloud Run service** (still
fully separate from the control plane), and use GCP-native primitives for the
rest. This divergence from the doc is called out in §12 as a decision to ratify.

```
Browser ──"Connect Meta"──▶ control plane (server.js)
                              │  POST /v1/connection-intents (SERVICE_AUTH_TOKEN)
                              ▼
                        meta-integration ──OAuth redirect──▶ Meta consent
                              ▲                                    │
                              └──────── /oauth/callback ◀──────────┘
                              │  exchange code, long-lived token
                              │  encrypt → Secret Manager (credential_ref)
                              │  discover ad accounts, write connected row
                              ▼
              Cloud Scheduler → Cloud Tasks (durable queue)
                              │  {workspaceId, connectionId, range, idempotencyKey}
                              ▼
                        meta-ingestion ── Marketing API ──▶ campaigns + daily insights
                              │  normalize → campaigns / campaign_daily_metrics
                              │  raw payload → raw-integration-data bucket
                              ▼
                        Supabase (warehouse) ──▶ agents + dashboard read live rows
```

The queue carries only `{workspaceId, connectionId, requestedRange,
idempotencyKey}` — never a token — matching the architecture doc's rule.

## 5. OAuth connect flow (per provider)

State is a signed, single-use value binding the callback to a `brand_id` +
`provider` + `nonce` (short TTL). The control plane starts the flow; the
integration service owns the callback and the token.

### Meta
1. Control plane calls `POST /v1/connection-intents` on `meta-integration` with
   `{ workspaceId }`. Service returns an authorize URL:
   `https://www.facebook.com/v20.0/dialog/oauth?client_id=…&redirect_uri=…&state=…&scope=ads_read&response_type=code`.
2. Customer consents; Meta redirects to
   `GET /oauth/callback?code=…&state=…`.
3. Service exchanges the code:
   `GET https://graph.facebook.com/v20.0/oauth/access_token?client_id=…&client_secret=…&redirect_uri=…&code=…`
   → short-lived user token.
4. Upgrade to a **long-lived** token:
   `GET …/oauth/access_token?grant_type=fb_exchange_token&fb_exchange_token=…`
   (~60-day expiry; schedule refresh before expiry).
5. Discover ad accounts: `GET /v20.0/me/adaccounts?fields=account_id,name,currency,timezone_name`.
6. Encrypt the token (§6), store the `credential_ref`, write the selected account
   ids into `configuration`, set `ad_account_count`, status → `connected`.

### TikTok
1. Authorize URL:
   `https://business-api.tiktok.com/portal/auth?app_id=…&redirect_uri=…&state=…`.
2. Callback → exchange:
   `POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/`
   with `{ app_id, secret, auth_code }` → access token (+ refresh token on the
   newer API).
3. Discover advertisers:
   `GET /open_api/v1.3/oauth2/advertiser/get/` (header `Access-Token`).
4. Encrypt + store as above; store selected `advertiser_id`s in `configuration`.

**Account/advertiser selection** is a second control-plane step: after `connected`
the dashboard lists discovered accounts and the customer confirms which to sync;
the chosen ids live in `integration_connections.configuration`.

## 6. Token storage & encryption

`integration_connections.credential_ref` is a **pointer**, never the token
(the column comment already mandates this).

- Store the ciphertext in **GCP Secret Manager**, one secret per connection:
  `growthos-cred-<connectionId>`. `credential_ref` holds the secret resource name
  + version.
- **Envelope encryption**: a per-connection data key wrapped by **Cloud KMS**;
  ciphertext + wrapped key live in the secret payload. Only the owning
  integration/ingestion service accounts get `secretmanager.secretAccessor` +
  `cloudkms.cryptoKeyDecrypter` on that key.
- Refresh path: a scheduled job re-exchanges tokens before expiry (Meta ~60 days;
  TikTok via refresh token) and writes a new secret version.
- The token never enters the browser, a prompt, an event payload, or the
  `configuration` jsonb. RLS already denies clients access to these rows for
  writes; keep all writes on the service role.

## 7. Data model — deltas

The core schema is sufficient for the MVP (campaigns + daily metrics). Additions:

- **`provider_credentials` is *not* a new table** — use Secret Manager per §6, so
  no secret material sits in Postgres.
- **Ad-set / ad-group / creative granularity.** The dashboard drill-down shows
  ad sets and creatives. The MVP warehouse only has `campaigns` +
  `campaign_daily_metrics`. **Decision (§12):** either (a) MVP ingests campaign +
  daily metrics only and the drill-down stays demo until phase 2, or (b) add
  `ad_sets`, `ads`, and matching daily-metric tables now. Recommendation: **(a)**
  to ship live campaign truth first; raw payloads are retained so back-filling
  granularity later needs no re-fetch.
- **Migration `006_integration_sync.sql`** (small): add
  `integration_connections.token_expires_at timestamptz`,
  `sync_runs.idempotency_key text unique`, and helpful indexes
  (`campaign_daily_metrics(metric_date)`, `campaigns(integration_connection_id)`).

## 8. Ingestion design

- **Trigger.** Cloud Scheduler enqueues an incremental sync per connected brand
  (e.g. every 6h); a one-shot backfill task is enqueued on first `connected`.
- **Idempotency.** Each task carries an `idempotencyKey`; `sync_runs` rejects a
  duplicate key. Upserts use the existing unique keys
  (`campaigns(integration_connection_id, external_id)`,
  `campaign_daily_metrics(campaign_id, metric_date, attribution_window)`).
- **Backfill vs incremental.** Backfill walks history in windowed pages;
  incremental resumes from `sync_runs.cursor` (last complete metric_date, minus a
  small re-statement lookback because providers restate recent days).
- **Fetch + normalize.**
  - Meta: `GET /v20.0/act_<id>/campaigns` for metadata, then
    `.../insights?level=campaign&time_increment=1&fields=spend,impressions,clicks,actions,action_values&time_range=…`.
  - TikTok: `POST /open_api/v1.3/report/integrated/get/` with
    `report_type=BASIC`, `dimensions=[campaign_id,stat_time_day]`, the metric
    list, and the date range.
  - Map to `campaign_daily_metrics`: `spend_cents` (currency-normalized),
    `impressions`, `clicks`, provider results into `conversions` jsonb keyed by
    the **semantic metric registry** version (`lib/agents/memory/semantic-memory.js`).
- **Raw retention.** Write each raw provider page to
  `raw-integration-data/<connectionId>/<runId>/…` and record `raw_payload_path`;
  the payload is immutable and is the source of truth for re-normalization.
- **Resilience.** Per-provider rate limiter, exponential backoff on 429/5xx,
  a dead-letter queue for tasks that exhaust retries, and `sync_runs.status`
  set to `partial`/`failed` with `error_message`.
- **Validation gate.** Mirror the SOP: after the first backfill, check freshness,
  currency, timezone, and required fields before flipping the dashboard from
  "pending review" to fully live; write `last_successful_sync_at`.

## 9. Wiring agents + dashboard to live data

- Add a `warehouse` read path so `agent.retrieve({ brandId, range, dimension })`
  returns live `campaigns`/`campaign_daily_metrics` rows when the brand's
  connection is `connected`, and falls back to demo/`pending` otherwise — the
  retrieval **contract is unchanged**, so the LLM planner, guardrails, and eval
  harness are untouched.
- The dashboard's Setup & connections and platform views read real status
  (`ad_account_count`, `last_successful_sync_at`) from `/api/integrations`; demo
  mode still works with the toggle off.
- Metric definitions surfaced in prose continue to cite the semantic registry
  version, now backed by real fields.

## 10. Security & guardrails (must hold)

- Request **only read scopes** (`ads_read`; TikTok reporting/read). No mutation
  scope is ever requested; the services expose no write endpoint.
- Tokens live only in Secret Manager, decrypted in-service; never in the browser,
  prompt, event payload, logs, or `configuration`.
- Control-plane ↔ service calls carry `SERVICE_AUTH_TOKEN` (already in
  `service.js`); each service has its own GCP service account and least-privilege
  IAM.
- Every sync writes a `sync_runs` row; every agent retrieval writes
  `agent_retrieval_runs` (M5) — full audit trail.
- Store campaign/metric data only; no customer PII or payment data in the vector
  store or logs.

## 11. Configuration (new env, server-side only)

Add to `.env.example` (values in Secret Manager in production):

```
META_APP_ID=              META_APP_SECRET=
META_REDIRECT_URI=https://meta-integration.<domain>/oauth/callback
META_API_VERSION=v20.0
TIKTOK_APP_ID=            TIKTOK_APP_SECRET=
TIKTOK_REDIRECT_URI=https://tiktok-integration.<domain>/oauth/callback
OAUTH_STATE_SIGNING_KEY=  # signs the single-use OAuth state
CREDENTIAL_KMS_KEY=       # Cloud KMS key resource for envelope encryption
```

## 12. Milestones & sequence

| # | Milestone | Acceptance |
| --- | --- | --- |
| **I0** | Provider apps + pre-flight (external) | App IDs/secrets, redirect URIs registered, review submitted; sandbox account usable. |
| **I1** | Migration `006` + token-custody lib (Secret Manager + KMS envelope) | A token can be encrypted, stored by `credential_ref`, and decrypted only by the service SA. Unit-tested with a fake KMS. |
| **I2** | `meta-integration` OAuth (dev-mode) | A dev user completes consent; a `connected` row + encrypted credential + discovered accounts are written. |
| **I3** | `meta-ingestion` backfill + incremental | A sandbox account's campaigns + daily insights land in the warehouse; `sync_runs` green; raw payloads retained; re-run is idempotent. |
| **I4** | Wire agents + dashboard to live Meta | With a connected brand, the Meta view and retrieval agent show real rows; demo mode still works. Eval harness green. |
| **I5** | Repeat I2–I4 for TikTok | Same acceptance against a sandbox advertiser. |
| **I6** | Scheduler + queue + refresh + DLQ | Scheduled incremental syncs, token refresh before expiry, dead-letter on exhausted retries, alerting on `failed`. |
| **I7** | Production hardening + go-live checklist | App review approved, business verification done, rate limits tuned, runbook written, first real customer account validated. |

Sequence rationale: token custody (I1) before any token exists; one provider end
to end (I2–I4) before duplicating (I5); scheduling/refresh (I6) once a real sync
works; production only after external review (I7). Meta leads because its App
Review for `ads_read` is typically the longer pole.

## 13. Risks & external dependencies

- **App review timelines.** Meta Advanced `ads_read` and TikTok audit gate real
  customer data; plan for weeks and keep the dev/sandbox path working meanwhile.
- **Token lifecycle.** Meta long-lived tokens expire (~60d) and can be
  invalidated by password changes; TikTok tokens refresh differently. I6's
  refresh + a clear re-consent UX are required, not optional.
- **Provider restatement & rate limits.** Recent days' metrics change after the
  fact (the incremental lookback handles this); rate limits require per-provider
  throttling and backfill windowing.
- **Deployment divergence.** Running the services on Cloud Run instead of the
  doc's AWS target (§4) should be ratified or the doc updated.
- **Currency/timezone.** Normalize `spend_cents` and align `metric_date` to the
  account timezone at ingest, not at read time.

## 14. Testing

- **Contract tests** against recorded Meta/TikTok fixtures (no live calls in CI).
- **Idempotency test**: re-running a sync produces no duplicate rows and no
  double-counted spend.
- **Encryption test**: a stored credential is unreadable without the KMS key and
  round-trips through the service.
- **Agent evals** (`npm test`) stay green — the live path reuses the existing
  retrieval contract, so refusal/dimension/metric evals must not regress.

## 15. Open decisions

1. **Deployment target** — Cloud Run (recommended, consistent) vs. the doc's AWS.
2. **Granularity now** — campaign-only MVP (recommended) vs. add ad-set/ad-group
   + creative tables in this phase.
3. **Queue tech** — Cloud Tasks vs. Pub/Sub for the ingestion queue.
4. **Sync cadence** — fixed schedule vs. on-demand-plus-schedule for the MVP.
5. **Multi-account** — one connection per ad account vs. one connection with
   many accounts in `configuration` (schema currently implies one row per
   `(brand, provider)`; multi-account fans out under it).
