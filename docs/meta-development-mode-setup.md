# Meta Development Mode setup (Track A — Meta)

This is the fastest path to building and testing the full GrowthOS Meta
integration — including **write access and creative deployment** — **without
waiting for App Review**. In Development mode a Meta app can read and mutate any
ad account that the authorizing user (who must hold a role on the app) can
access. App Review and Business Verification are only required later, to point
the same code at *customer* ad accounts in production.

> Scope of this document: the external, provider-side steps (Track A). It gets
> you a working App ID, App Secret, redirect URI, and an access token with the
> right scopes, verified against your own ad account. The in-app OAuth callback,
> token storage, and the creative-deploy service (Track B) are built separately.

## What Development mode gives you

- Full **read + write** against ad accounts your app-role users can access,
  using **Standard Access** to `ads_management` — **no App Review required**.
- The complete create-creative-and-publish flow, testable end to end.

## What it does *not* give you (yet)

- Access to **customer** ad accounts, or to anyone without an app role. That
  needs **App Review + Business Verification + Advanced Access** to
  `ads_management` (the production step at the bottom of this doc).
- A live consumer-facing "Log in with Facebook" button. In Development mode only
  Admins/Developers/Testers of the app can complete the flow.

---

## Prerequisites

- A **Meta Business Portfolio** (Business Manager). Create one at
  <https://business.facebook.com> if you don't have one.
- A **Facebook Page** for the brand, and (for Instagram placements) an
  **Instagram professional account linked to that Page**. Creative runs under
  this Page/IG identity — you cannot publish an ad without it.
- An **ad account** you can administer, ideally a dedicated **sandbox ad
  account** for first tests (Business Settings → Accounts → Ad Accounts →
  Add → Create a sandbox ad account). Sandbox accounts never spend real money.

---

## Step 1 — Create the app

1. Go to <https://developers.facebook.com/apps> → **Create App**.
2. App type: **Business**. Attach it to your Business Portfolio.
3. Confirm the app header shows **In development** (top of the dashboard). Leave
   it there for all of Track A.

## Step 2 — Add the Marketing API

1. In the app dashboard, **Add Product** → **Marketing API** → Set up.
2. Under **Marketing API → Tools**, note that you can generate a token with
   `ads_read` and `ads_management` directly for quick tests — but prefer the
   scoped token in Step 5 so it matches what the app will request.

## Step 3 — Add Facebook Login for Business (for the OAuth redirect)

1. **Add Product** → **Facebook Login for Business** → Set up.
2. **Facebook Login for Business → Settings** → **Valid OAuth Redirect URIs**:
   add the GrowthOS callback URL, e.g.
   - `http://localhost:3000/api/integrations/meta/callback` (local dev)
   - `https://<your-domain>/api/integrations/meta/callback` (deployed)
3. Save. These must match the `redirect_uri` your OAuth code sends exactly.

## Step 4 — Give yourself (and teammates) an app role

Business → App Roles → **Roles**: add the people who will test as
**Administrator**, **Developer**, or **Tester**. In Development mode only these
users can authorize the app and only their accessible ad accounts are reachable.

## Step 5 — Get App ID, App Secret, and a scoped token

1. **App ID** and **App Secret**: **Settings → Basic**. Copy both into your
   server-side secrets (see `.env.example` keys below). **Never** expose the
   secret to the browser.
2. Generate a **User access token** with the scopes GrowthOS needs. Quickest for
   testing: **Tools → Graph API Explorer**, select your app, **Add Permissions**:
   - `ads_read` — read campaigns, insights
   - `ads_management` — create/update campaigns, ad sets, ads, creatives
   - `business_management` — asset/account discovery
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_ads` — publish
     ads under the Page
   - `instagram_basic` — Instagram placement identity
3. Click **Generate Access Token** and approve. This is a short-lived token.

## Step 6 — Upgrade to a durable token

Short-lived tokens expire in ~1 hour. For ongoing testing use one of:

- **Long-lived user token** (~60 days): exchange the short-lived token —
  `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<SHORT_TOKEN>`
- **System User token** (preferred for a server): Business Settings → Users →
  **System Users** → Add → assign the app and the ad account/Page assets →
  **Generate token** with the scopes above. System-user tokens don't expire on a
  user session and are the right model for GrowthOS's server-side sync/deploy.

## Step 7 — Collect the IDs the code needs

- **Ad account ID**: Business Settings → Accounts → Ad Accounts. The API form is
  `act_<AD_ACCOUNT_ID>`.
- **Page ID**: the Page's About/Settings, or `GET /me/accounts`.
- **Instagram account ID** (for IG placements): `GET /<PAGE_ID>?fields=instagram_business_account`.

## Step 8 — Verify READ works

```
GET /v21.0/act_<AD_ACCOUNT_ID>/insights?fields=spend,impressions,clicks,actions&date_preset=last_14d&access_token=<TOKEN>
```

(Use the current Graph API version; `v21.0` shown as an example.) A 200 with rows
(or an empty set on a fresh account) confirms read access.

## Step 9 — Verify WRITE + creative deployment works

Do this **against the sandbox ad account** and create everything **PAUSED**.
The publish sequence is:

1. **Campaign** — `POST /act_<id>/campaigns`
   `name`, `objective` (e.g. `OUTCOME_SALES`), `status=PAUSED`,
   `special_ad_categories=[]`
2. **Ad set** — `POST /act_<id>/adsets`
   targeting, budget, `status=PAUSED`, `campaign_id`
3. **Upload creative asset**
   - Image: `POST /act_<id>/adimages` → returns an `image_hash`
   - Video: `POST /act_<id>/advideos` → returns a `video_id`
4. **Ad creative** — `POST /act_<id>/adcreatives` with an `object_story_spec`
   that names the `page_id` (and `instagram_user_id` for IG placements) plus the
   image_hash/video_id. This is where the Page/IG identity binds to the ad.
5. **Ad** — `POST /act_<id>/ads` referencing the ad set and creative,
   `status=PAUSED`.

A created **PAUSED** ad you can see in Ads Manager confirms the full write +
creative path works. Nothing spends while paused.

---

## Safety rules for Track A testing

- Prefer a **sandbox ad account**; if you must use a real one, create everything
  **PAUSED** and delete test objects afterward.
- Keep the App Secret and all tokens **server-side only**.
- Request the **minimum scopes** that make each test pass.

## Meta credentials → GrowthOS config

Add these to your server environment (see `.env.example`):

```
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:3000/api/integrations/meta/callback
META_GRAPH_API_VERSION=v21.0
# Optional for early server-side testing before the OAuth flow is built:
META_SYSTEM_USER_TOKEN=
META_TEST_AD_ACCOUNT_ID=
META_TEST_PAGE_ID=
META_TEST_IG_ACCOUNT_ID=
```

---

## Transition to production (later — the App Review gate)

When you're ready to connect real customer ad accounts, Development mode is no
longer enough. Complete, in order:

1. **Business Verification** of your Business Portfolio.
2. **App Review** requesting **Advanced Access** to `ads_management` (and
   `business_management` if you do account discovery). This requires a screencast
   demonstrating the read + create/publish flows and a clear use-case write-up.
3. Switch the app to **Live** mode.
4. Each customer grants GrowthOS an **Advertiser or Admin** role on their ad
   account (Analyst is read-only and cannot deploy creative).
5. Only then does the same code, unchanged, work against customer accounts.
