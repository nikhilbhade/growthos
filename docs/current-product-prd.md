# GradientOS — Current Product PRD

**Version:** 0.1 · **Status:** design-partner product scaffold · **Last updated:** August 25, 2026

## 1. Product summary

GradientOS is the read-only growth intelligence workspace for multi-location
restaurant brands. It puts paid-media delivery, delivery-marketplace signals,
restaurant financial outcomes, local-market position, and operating context in
one place so a marketer can understand performance before deciding what to do.

The near-term product is a **unified analytics and decision-preparation
system**. It does not yet make changes to Meta, TikTok, Google, DoorDash, Uber
Eats, or any point-of-sale system.

## 2. User and problem

### Primary user

A restaurant growth or performance marketer responsible for multiple locations
and several paid-media or marketplace channels.

### Supporting users

- Operations and finance leaders who provide cost and financial context.
- The owner of the highest-sales restaurant channel, who is the required
  reviewer for any future high-impact recommendation.
- Agency or channel partners who hold provider access.

### Problem to solve

Restaurant teams currently assemble platform reporting, marketplace results,
and financial outcomes manually. Definitions and reporting windows differ,
location coverage is unclear, and campaign-level performance is hard to
connect to the wider operating picture. GradientOS makes the evidence, data
freshness, and qualification of each result visible before a person acts.

## 3. Product principles

1. **Read-only before write.** The product retrieves, normalizes, and explains;
   it does not edit campaigns, budgets, creatives, or marketplace settings.
2. **Financial data outranks platform reporting.** POS, accounting, order, and
   payout data are the source of truth for financial outcomes. Platform
   attribution is labelled as reported, verified, or directional.
3. **A person owns consequential decisions.** Future recommendations remain
   advisory and require a defined reviewer before execution can exist.
4. **Show the basis.** Every data view and agent answer should state source,
   reporting window, scope, freshness, and known limitations.
5. **Start simple for the customer.** Connection setup explains who should act,
   what they do, and expected timing without asking for passwords.

## 4. Current product surface

### 4.1 Public landing page

The public page introduces GradientOS, its product value, anonymized illustrative
case-study format, a request-access route, and Google login for existing users.
The application workspace lives separately at `/app.html`.

### 4.2 Setup and Connections

One setup workspace shows source status and guides a customer through provider
access.

| Source | Current product behavior | Intended data |
| --- | --- | --- |
| Meta | Customer-facing read-access SOP and connection flow | Campaigns, ad sets, creatives, delivery, attribution metrics |
| TikTok | Customer-facing read-access SOP and connection flow | Campaigns, ad groups, creatives, delivery, attribution metrics |
| Google Ads | Connection card and onboarding path | Campaign, ad group, creative, and performance reporting |
| DoorDash + Uber Eats | Connection guidance and delivery analytics workspace | Campaign, promotion, spend, sales, payout, and marketplace metrics |
| Toast / POS / SFTP | Placeholder connection and attribution model | Orders, payouts, sales, discounts, labor and food-cost context |

Live OAuth, secure token storage, provider app approvals, and real ingestion are
not complete in the current scaffold.

### 4.3 Unified Analytics

The main dashboard supports location, marketplace, and channel views, dynamic
time comparisons, and a labelled demo mode. The working metric set includes:

- Payouts
- Sales
- Spend
- Marketing-driven sales
- Organic sales
- Average order value

Period-over-period compares the chosen range with the immediately preceding
range of equal length. Year-over-year can use calendar-year or 364-day
weekday-aligned comparison, depending on the metric definition.

### 4.4 Provider analytics workspaces

Separate workspaces exist for Meta, TikTok, Google, and delivery marketplaces.
They start at campaigns and drill down into ad sets/ad groups and creatives.
Preview data includes performance, status, budget, targeting, demographic, and
creative-delivery fields such as 3-second views and fall-off where relevant.

DoorDash and Uber Eats share a delivery analytics workspace with campaign and
promotion metrics.

### 4.5 Retrieval agents

Meta, TikTok, Google, and delivery retrieval agents answer natural-language
questions against the selected workspace. They are explicitly read-only.

For every response, the product is designed to show a concise retrieval trace:
the selected scope, tool/action, reporting window, freshness, and record count.
It does not expose private model reasoning or claim an unsupported conclusion.

### 4.6 Market intelligence

Market Intelligence has distinct Ranking and Pricing subsections. It supports
dummy-data filtering by marketplace, location, and time. The intended future
method is to infer cuisine tags from approved restaurant/menu context, compare
local competitors in each ZIP code, and show ranking and price position as a
change over time.

### 4.7 Operating context and decision workflows

Operating Context captures the business conditions that change what “good”
growth means: goals, labor cost, COGS/food cost, free-text context, guardrails,
and location constraints.

Workflows turn a performance pattern into a visual, review-ready budget move.
Suggested playbooks and a custom drag-and-drop builder can express a trigger,
source channel, allocation, destination, review route, and reset condition.
There is no execution action in scope today.

### 4.8 Customer retention and variance explainer

Customer Retention provides aggregate, directional repeat-demand cohorts once a
compatible order source is connected. It should not expose individual customer
profiles.

Variance Explainer compares POS/Toast financial outcomes with platform or
marketplace reporting and explains expected gaps from attribution windows,
timing, timezone, source definitions, and coverage.

## 5. Data model and attribution rules

### Financial outcomes

Contribution profit is computed from net sales after configured food cost,
delivery commissions, discounts, promotions, and labor. In early onboarding,
food and labor can be captured as brand-wide or location-level percentages.

### Required history and freshness

- Target minimum history: 12 months.
- Conservative default freshness: data complete through T–3 days.
- The product always retains the provider’s reporting window next to a metric.

### Attribution labels

| Label | Meaning |
| --- | --- |
| Verified | An order is connected through a validated click, session, UTM, promotion, or other identifier bridge. |
| Platform-reported | The provider’s own conversion/revenue reporting window and rules. |
| Directional | A modeled or reconciled signal without an order-level matching bridge. |

## 6. Authentication and access

The landing page includes Google login through Supabase Auth. A user signs in
with a Google Workspace account and is returned to the product workspace.

Before live customer data is enabled, GradientOS must enforce server-side session
verification, workspace membership, tenant-scoped row-level security, and API
authorization. The landing-page redirect alone is not a complete production
data-access control.

## 7. Non-goals for the current release

- Automatic campaign, budget, creative, or marketplace changes.
- Claiming exact order-level attribution where no verified bridge exists.
- Presenting demo values as customer reporting.
- Asking customers for provider passwords.
- Exposing customer PII to agents or using it as a default agent input.

## 8. Implementation roadmap

### Phase 1 — design-partner analytics

- Finish Google sign-in, tenancy, and production dashboard hosting.
- Obtain Meta, TikTok, and Google provider application approval and read scopes.
- Store tokens in a secrets manager; build provider-specific OAuth callbacks.
- Ingest campaign hierarchy and daily performance with source freshness.
- Onboard a financial source through POS integration or daily SFTP exports.

### Phase 2 — trusted decision preparation

- Normalize metrics and implement financial reconciliation.
- Add location/account mappings and coverage checks.
- Backtest recommendation logic against 12 months of data.
- Route suggested workflows to the designated human reviewer.

### Phase 3 — controlled execution (future)

- Separate write authorization and provider-approved write scopes.
- Add policy enforcement, immutable audit logs, budget caps, approval records,
  idempotency, and rollback.
- Launch execution only after provider testing and customer consent.

## 9. Success criteria for the design-partner release

1. A marketer can connect an approved source without sharing credentials.
2. GradientOS ingests a validated, fresh campaign hierarchy and daily metrics.
3. Every dashboard metric identifies source, timeframe, location coverage, and
   demo/production state.
4. A user can compare a selected time range with an equal-length prior period
   or an approved year-over-year basis.
5. A provider agent produces a grounded, read-only answer with retrieval basis.
6. Finance/POS or SFTP data can reconcile top-line outcomes without claiming
   unverified direct attribution.
7. No recommendation changes a customer account without a future,
   separately-approved execution capability.

## 10. Open decisions

- Final customer pricing, implementation fee, and contract terms.
- Exact design-partner support and intelligence-team operating model.
- The first provider write capabilities, if any, and their authorization model.
- Final POS priority after the SFTP ingestion path is operating.
- Whether local ranking/pricing uses licensed data providers, approved public
  sources, or a combination.
