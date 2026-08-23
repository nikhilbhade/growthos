# GrowthOS integration access SOP

This MVP is read-only. No connector may create, edit, pause, or reallocate campaign budget.

## Shared onboarding sequence

1. **Pre-flight:** GrowthOS verifies its provider application, redirect URLs, review status, and encrypted server-side secret storage.
2. **Customer authorization:** A restaurant administrator or authorized media owner starts the provider OAuth flow; GrowthOS never asks for a password.
3. **Account selection:** The customer selects the individual ad accounts/advertisers available to GrowthOS.
4. **Historical sync:** GrowthOS retrieves campaign metadata, daily insights, budgets, and source attribution windows.
5. **Validation:** GrowthOS checks freshness, coverage, time zone, currency, and required fields. It shows the connection as *Pending review* until the check passes.

If authorization fails, the customer sees the provider, account, permission, and next recovery action. Their selected accounts and onboarding inputs remain intact.

## Meta Ads

### GrowthOS pre-flight

- Own a GrowthOS Meta Business Portfolio and a GrowthOS-owned Meta Developer App.
- Add the Marketing API product and request Advanced `ads_read` access before connecting customer ad accounts.
- Request `business_management` only when business/asset discovery is needed.
- Never request `ads_management` in this MVP.

### Customer handoff

- The customer signs in with a user who can view the selected Meta ad account(s).
- They approve `ads_read`, select their ad accounts, and confirm Facebook/Instagram placement coverage.
- GrowthOS validates campaign/ad set/ad metadata, Insights coverage, budgets, and attribution windows.

## TikTok Ads

### GrowthOS pre-flight

- Create a GrowthOS TikTok for Business developer app and configure its redirect URI.
- Request Marketing API Reporting / Consolidated Report access for the application.
- Limit server routes to advertiser, campaign, ad group, ad, and reporting reads.

### Customer handoff

- The customer authorizes with a TikTok Business Center user who can grant access to the relevant advertiser.
- They select advertiser ID(s) to share with GrowthOS.
- GrowthOS validates reporting dimensions, budgets, attribution fields, date coverage, and timezone.

## Google Ads

### GrowthOS pre-flight

- Create a GrowthOS Google Ads manager account (MCC) and obtain a GrowthOS developer token.
- Create a GrowthOS Google Cloud OAuth app with the production redirect URI.
- Apply for Basic Access with Reporting permissible use. Use Standard only after real volume requires it.

### Customer handoff

- The customer signs in with a user who can view the selected Google Ads customer account(s).
- GrowthOS lists accessible customers and the user selects the customer IDs to connect.
- Google Ads exposes a broad Ads API OAuth scope; GrowthOS enforces reporting-only requests in code and does not expose mutation endpoints.
- GrowthOS validates campaigns, ad groups, ads, daily metrics, budgets, and attribution/measurement coverage.

## DoorDash

### GrowthOS pre-flight

- Create a revocable GrowthOS integration identity for the restaurant to invite; do not request a restaurant owner’s password.
- Record the restaurant’s expected locations, store numbers, and which brands or business groups should be visible before requesting access.
- Prepare store discovery, location reconciliation, and a human review queue for missing or extra stores.

### Customer handoff

- In DoorDash Merchant Portal, open user management and invite the GrowthOS integration identity.
- Grant **Business Admin** for one brand, or **Business Group Admin** and select every relevant brand for a multi-brand group.
- One properly scoped grant usually exposes the selected brand/group’s stores. GrowthOS compares the returned store count to the expected count before ingestion.
- If returned stores are missing, re-grant the required brand/business-group scope or role, then retry. Extra stores are held for review and never automatically removed.

## Uber Eats

### GrowthOS pre-flight

- Create a revocable GrowthOS integration identity and collect the expected store count and location list.
- Prepare the store-by-store access checklist and keep every store mapping pending until the count has been reconciled.

### Customer handoff

- In Uber Eats Manager, open **Users**, select a restaurant in the store selector, and invite the GrowthOS integration identity as **Manager**.
- Repeat this step for **every restaurant location**. Uber Eats permissions are store-by-store; adding the user to one store does not grant the others.
- GrowthOS inventories accessible stores, compares them to the expected count, and asks for a retry or explicit human review whenever a store is missing or extra.
