# SFTP data contract

## Purpose

This contract defines the preferred fallback for brands that cannot yet provide a POS API connection. It supports daily financial reconciliation, marketplace campaign reporting, customer-retention cohorts, and directional attribution without claiming an unsupported person-level paid-media match.

SFTP is a transport mechanism. It does not generate attribution metadata; GradientOS can only model what the delivered source files contain.

## Delivery standard

| Requirement | Standard |
| --- | --- |
| Transport | SFTP using SSH key authentication; no shared passwords. |
| Delivery cadence | Daily by 08:00 in the brand’s reporting timezone. |
| Reporting period | Month-to-date, including corrections to prior dates. |
| Format | UTF-8 CSV, gzip permitted. Use ISO 8601 timestamps and dates. |
| File naming | `<brand>_<dataset>_<YYYY-MM-DD>_<sequence>.csv.gz` |
| Idempotency | A file must have a deterministic content checksum. Re-delivery must not create duplicate business records. |
| Security | One isolated folder per brand; optional PGP encryption for files with customer identifiers. |
| Freshness | Files are treated as provisional until the configured reporting cutoff. GradientOS shows the last complete business date. |

## Required datasets

### Orders

One record per completed, refunded, or cancelled order.

| Field | Required | Notes |
| --- | --- | --- |
| `external_order_id` | Yes | Stable identifier within the source system. |
| `location_external_id` | Yes | Must map to a GradientOS location. |
| `ordered_at` | Yes | Timestamp with timezone or a documented local timezone. |
| `business_date` | Yes | Restaurant reporting day. |
| `order_channel` | Yes | Examples: `walk_in`, `direct_online`, `doordash`, `ubereats`. |
| `order_status` | Yes | Completed, refunded, cancelled, etc. |
| `gross_sales` | Yes | Before discounts, taxes, tips, and fees; include currency. |
| `discount_amount` | Yes | Use zero when absent. |
| `commission_amount` | Yes | Use zero where not applicable. |
| `marketing_fee_amount` | Yes | Marketplace ads, promotions, or credits when reported. |
| `net_payout` | Preferred | Needed for payout reconciliation. |
| `customer_reference_hash` | Optional | Stable one-way hash only; no raw email, phone, or name needed for retention. |
| `promotion_id` | Optional | Marketplace promotion or campaign identifier. |
| `promo_code` | Optional | May support a verified attribution bridge when approved. |

### Payouts and settlements

One record per marketplace settlement or accounting payout. Required fields: `payout_id`, `location_external_id`, `provider`, `settlement_start_date`, `settlement_end_date`, `payout_date`, `gross_sales`, `refunds`, `commissions`, `marketing_fees`, `adjustments`, `net_payout`, and `currency`.

### Marketplace promotions and campaign outcomes

One record per marketplace promotion, offer, or campaign and reporting period. Required fields: `provider`, `location_external_id`, `campaign_or_promotion_id`, `campaign_or_promotion_name`, `start_date`, `end_date`, `offer_type`, `funding_source`, `budget`, `spend`, `reported_orders`, `reported_sales`, `reported_roi`, and `currency`.

`funding_source` distinguishes merchant-funded, marketplace-funded, and co-funded offers. Marketplace-reported attributed outcomes remain labelled as platform-reported.

### Locations

One record per active or historical location: `location_external_id`, `location_name`, `address`, `city`, `state`, `postal_code`, `timezone`, `provider_store_id`, `active_from`, and `active_to`.

## Optional enrichment datasets

- **Labor:** location/date, paid hours, labor dollars, job group.
- **COGS:** location/date or location/menu category, food cost dollars or percentage.
- **Menu items:** order ID, item ID, category, quantity, gross sales, discounts.
- **Customer cohorts:** hashed customer ID, first order date, latest order date, order count, lifetime sales.

## Attribution confidence

| Claim | Confidence | Requirement |
| --- | --- | --- |
| Marketplace direct sales and payouts | High | Orders and settlement records. |
| Marketplace campaign results | Platform-reported | Promotion/campaign export from DoorDash or Uber Eats. |
| Meta/Google/TikTok order attribution | Verified | Persistent click/session ID, approved UTM, promo code, or equivalent bridge. |
| Cross-channel budget impact | Directional/modelled | Location, timing, spend, campaign, and order-series evidence; clearly labelled. |

GradientOS must never infer an exact order-level paid-media match from timing alone.

## Validation and rejection rules

An import is rejected or marked partial when it has an unknown location, duplicate business key, invalid currency, invalid date/timezone, unparseable numeric field, missing required column, or an unexpected reporting window. Every import records the file checksum, row count, schema version, reporting coverage, and last complete business date.

## Retention and privacy

Store raw deliveries in a private immutable bucket with limited access. Use hashed customer references for retention wherever possible. Do not send raw order payloads, PII, or payment details to agent prompts or embedding indexes.
