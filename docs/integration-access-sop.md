# GradientOS integration access SOP

This MVP is read-only. No connector may create, edit, pause, or reallocate campaign budget.

## Shared onboarding sequence

1. **Pre-flight:** GradientOS verifies its provider application, redirect URLs, review status, and encrypted server-side secret storage.
2. **Customer authorization:** A restaurant administrator or authorized media owner starts the provider OAuth flow; GradientOS never asks for a password.
3. **Account selection:** The customer selects the individual ad accounts/advertisers available to GradientOS.
4. **Historical sync:** GradientOS retrieves campaign metadata, daily insights, budgets, and source attribution windows.
5. **Validation:** GradientOS checks freshness, coverage, time zone, currency, and required fields. It shows the connection as *Pending review* until the check passes.

If authorization fails, the customer sees the provider, account, permission, and next recovery action. Their selected accounts and onboarding inputs remain intact.

## Meta Ads

### GradientOS pre-flight

- Own a GradientOS Meta Business Portfolio and a GradientOS-owned Meta Developer App.
- Add the Marketing API product and request Advanced `ads_read` access before connecting customer ad accounts.
- Request `business_management` only when business/asset discovery is needed.
- Never request `ads_management` in this MVP.

### Customer handoff

- The customer signs in with a user who can view the selected Meta ad account(s).
- They approve `ads_read`, select their ad accounts, and confirm Facebook/Instagram placement coverage.
- GradientOS validates campaign/ad set/ad metadata, Insights coverage, budgets, and attribution windows.

## TikTok Ads

### GradientOS pre-flight

- Create a GradientOS TikTok for Business developer app and configure its redirect URI.
- Request Marketing API Reporting / Consolidated Report access for the application.
- Limit server routes to advertiser, campaign, ad group, ad, and reporting reads.

### Customer handoff

- The customer authorizes with a TikTok Business Center user who can grant access to the relevant advertiser.
- They select advertiser ID(s) to share with GradientOS.
- GradientOS validates reporting dimensions, budgets, attribution fields, date coverage, and timezone.

## Google Ads

### GradientOS pre-flight

- Create a GradientOS Google Ads manager account (MCC) and obtain a GradientOS developer token.
- Create a GradientOS Google Cloud OAuth app with the production redirect URI.
- Apply for Basic Access with Reporting permissible use. Use Standard only after real volume requires it.

### Customer handoff

- The customer signs in with a user who can view the selected Google Ads customer account(s).
- GradientOS lists accessible customers and the user selects the customer IDs to connect.
- Google Ads exposes a broad Ads API OAuth scope; GradientOS enforces reporting-only requests in code and does not expose mutation endpoints.
- GradientOS validates campaigns, ad groups, ads, daily metrics, budgets, and attribution/measurement coverage.

## DoorDash

### GradientOS pre-flight

- Create a revocable GradientOS integration identity for the restaurant to invite; do not request a restaurant owner’s password.
- Record the restaurant’s expected locations, store numbers, and which brands or business groups should be visible before requesting access.
- Prepare store discovery, location reconciliation, and a human review queue for missing or extra stores.

### Customer handoff

- In DoorDash Merchant Portal, open user management and invite the GradientOS integration identity.
- Grant **Business Admin** for one brand, or **Business Group Admin** and select every relevant brand for a multi-brand group.
- One properly scoped grant usually exposes the selected brand/group’s stores. GradientOS compares the returned store count to the expected count before ingestion.
- If returned stores are missing, re-grant the required brand/business-group scope or role, then retry. Extra stores are held for review and never automatically removed.

## Uber Eats

### GradientOS pre-flight

- Create a revocable GradientOS integration identity and collect the expected store count and location list.
- Prepare the store-by-store access checklist and keep every store mapping pending until the count has been reconciled.

### Customer handoff

- In Uber Eats Manager, open **Users**, select a restaurant in the store selector, and invite the GradientOS integration identity as **Manager**.
- Repeat this step for **every restaurant location**. Uber Eats permissions are store-by-store; adding the user to one store does not grant the others.
- GradientOS inventories accessible stores, compares them to the expected count, and asks for a retry or explicit human review whenever a store is missing or extra.
