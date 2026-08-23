# Agent data ingestion — Meta & TikTok

Research on the data the Meta and TikTok agents read, how it is shaped, and where
its boundaries are. This is reference for the semantic memory (data dictionary +
metric registry) and for the ingestion services that will land the real data.
Everything here is **read-only reporting data**; nothing in this document implies
a write scope.

## 1. Object hierarchy

Both providers expose a similar tree; the middle level is named differently and
TikTok adds an advertiser wrapper.

| Level | Meta (Marketing API) | TikTok (Marketing API) |
| --- | --- | --- |
| Account | Ad Account (`act_<id>`) | Advertiser (`advertiser_id`) |
| Campaign | Campaign (objective, budget) | Campaign (objective, budget) |
| Middle | **Ad Set** (audience, placement, schedule, budget) | **Ad Group** (audience, placement, schedule, budget) |
| Leaf | Ad → Creative | Ad → Creative (incl. Spark Ads w/ creator handle) |

The agent must speak the right dialect per provider — "ad set" for Meta, "ad
group" for TikTok — which is encoded in `semantic-memory.js` (`structure`).

## 2. Entity metadata (dimensions)

Slow-changing descriptive fields, retrieved per object:

- **Campaign** — id, name, objective, status, buying type, daily/lifetime budget,
  bid strategy, start/stop time.
- **Ad set / ad group** — id, name, parent campaign, status, budget, optimization
  goal, bid, audience definition (interests, custom/lookalike audiences,
  geo/radius, age, gender), placement, schedule.
- **Ad / creative** — id, name, parent, status, format (video, image, carousel,
  Spark Ad), asset references, landing URL, call-to-action.

These map to the `dataDictionary` in semantic memory. They are the "structure"
questions ("what audiences am I targeting?") and change rarely, so they are
cheap to cache.

## 3. Metrics (facts / insights)

Time-series measures, pulled from the Insights (Meta) / Reporting (TikTok)
endpoints for a date range and grain (usually daily):

- **Base**: spend, impressions, clicks, reach, frequency.
- **Outcome**: conversions (Meta "results" per objective; TikTok "conversions"),
  cost per result, conversion value *as reported by the platform pixel*.
- **Derived** (computed, never stored): CTR, CPC, CPM, CVR, CPA.

Registered with definitions and provider field names in
`semantic-memory.js` (`metrics`). Derived metrics are computed from base fields so
their definition is auditable and consistent across providers.

### Metrics we deliberately do NOT ingest as truth

Platform-reported conversion **value** is pixel-attributed, not verified revenue.
The registry marks `roas`, `revenue`, `sales`, `profit`, and `ltv` as
**unavailable** from ad-platform reads (`unavailableMetrics`): they require a
POS/attribution join (Toast or another order system). This is the guardrail
against the classic failure of multiplying conversions by an assumed order value
to fabricate ROAS.

## 4. Attribution & measurement

The single most error-prone dimension, so it is first-class:

- Every metric carries an **attribution window** (default in demo data:
  `7-day click / 1-day view`). Meta and TikTok can report the *same* campaign
  differently depending on the window, so the window is recorded on every run and
  stated in the answer basis.
- Attribution setting is per-account/per-report; the semantic layer versions the
  definition so a change is a reviewable diff.
- Cross-provider comparison is only valid when the window and conversion
  definition match — the agent should say so rather than compare naively.

## 5. Breakdowns

Reporting can be sliced by breakdown dimensions the agents will eventually
expose: time (day/week), placement (Facebook Feed, Instagram Reels, TikTok For
You), device/platform, geography, and demographic (age, gender). Breakdowns
multiply row volume, so ingestion requests them narrowly and the agent asks for
one breakdown at a time.

## 6. Ingestion metadata (validation)

Beyond the data itself, each sync records the context needed to trust it — this
is what the integration SOP validates and what episodic memory surfaces as
"freshness":

- **Currency** and **timezone** of the ad account (spend and day boundaries are
  meaningless without them).
- **Freshness / reporting cutoff** — provider data lags and restates; the agent
  reports the completeness date, never implies live-to-the-minute numbers.
- **Coverage** — which accounts/advertisers and date range the sync covers.

## 7. API & operational boundaries

- **Meta**: Marketing API, Advanced `ads_read` (see `integration-access-sop.md`).
  Rate limited per app/account; Insights is async for large pulls. Never request
  `ads_management` in this MVP.
- **TikTok**: Marketing API reporting (Consolidated Report); routes limited to
  advertiser/campaign/ad group/ad + reporting reads.
- Ingestion runs in the provider microservices (`services/`), not the web app.
  Tokens stay in the owning integration service's encrypted store and never reach
  the browser, the prompt, or an event payload.

## 8. Data-protection boundaries

- **Ingest**: aggregated reporting metrics, object metadata, audience *definitions*
  (interest/geo/segment names) — not individual user records.
- **Do not ingest into agent memory**: raw customer PII, hashed audience match
  data, or payment/billing details. The embedding store (semantic memory / M3)
  holds documentation and taxonomy only — never raw customer data.
- **Episodic memory** stores *what was asked and retrieved* (question, tool,
  record count, freshness) — not the customer rows themselves — so history is
  useful without becoming a second copy of account data.

## 9. How the data maps to the three memories

| Data | Memory | Use |
| --- | --- | --- |
| Object metadata, metric definitions, attribution rules, naming taxonomy, provider structure | **Semantic** | Resolve terms, ground answers, know the hierarchy |
| Role, retrieval playbooks, refusal policy | **Procedural** | Decide *how* to retrieve and answer safely |
| Past retrieval runs (question, tool, records, freshness) per brand | **Episodic** | Recall prior questions, feed the eval harness |

Live metrics and metadata themselves are **retrieved per turn** through the
read-only tools, not stored in agent memory — memory holds knowledge and history,
the tools fetch the current numbers.
