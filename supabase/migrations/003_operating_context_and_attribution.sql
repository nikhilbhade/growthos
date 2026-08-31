-- GradientOS operating assumptions and order-outcome reconciliation.
-- V1 intentionally stores platform attribution separately from POS order truth.
-- A record-level order match is optional and only created when a persistent identifier bridge is verified.

alter table public.integration_connections
  drop constraint if exists integration_connections_provider_check;

alter table public.integration_connections
  add constraint integration_connections_provider_check
  check (provider in ('meta', 'tiktok', 'google', 'doordash', 'ubereats', 'toast', 'pos'));

create table public.brand_operating_context (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  target_monthly_sales_growth_pct numeric(5,2),
  maximum_weekly_paid_media_change_pct numeric(5,2),
  primary_growth_objective text,
  cogs_pct numeric(5,2),
  labor_pct numeric(5,2),
  marketplace_commission_pct numeric(5,2),
  incremental_capacity_pct numeric(5,2),
  updated_at timestamptz not null default now()
);

create table public.order_records (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  integration_connection_id uuid not null references public.integration_connections(id) on delete cascade,
  external_order_id text not null,
  ordered_at timestamptz not null,
  location_external_id text,
  order_channel text,
  net_sales_cents bigint not null default 0,
  discounts_cents bigint not null default 0,
  fees_cents bigint not null default 0,
  customer_reference_hash text,
  verified_identifiers jsonb not null default '{}'::jsonb,
  source_payload_path text,
  created_at timestamptz not null default now(),
  unique (integration_connection_id, external_order_id)
);

create table public.platform_attribution_daily (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  integration_connection_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null check (provider in ('meta', 'tiktok', 'google')),
  metric_date date not null,
  location_external_id text,
  campaign_external_id text,
  ad_group_external_id text,
  attribution_window text not null,
  attributed_orders integer,
  attributed_revenue_cents bigint,
  spend_cents bigint not null default 0,
  source_payload_path text
);

create unique index platform_attribution_daily_grain
  on public.platform_attribution_daily (
    integration_connection_id,
    metric_date,
    coalesce(location_external_id, ''),
    coalesce(campaign_external_id, ''),
    coalesce(ad_group_external_id, ''),
    attribution_window
  );

-- Only populated after we prove a safe persistent bridge (for example a server-side
-- session or click identifier that survives through checkout). Platform-reported
-- attribution alone does not create an order-level record here.
create table public.order_attribution_matches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  order_record_id uuid not null references public.order_records(id) on delete cascade,
  provider text not null check (provider in ('meta', 'tiktok', 'google')),
  campaign_external_id text,
  ad_group_external_id text,
  match_method text not null check (match_method in ('verified_session_id', 'verified_click_id', 'verified_utm', 'approved_promo_code')),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  verified_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  unique (order_record_id, provider, match_method)
);

alter table public.brand_operating_context enable row level security;
alter table public.order_records enable row level security;
alter table public.platform_attribution_daily enable row level security;
alter table public.order_attribution_matches enable row level security;

create policy "members can read operating context" on public.brand_operating_context
  for select using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "members can read order records" on public.order_records
  for select using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "members can read platform attribution" on public.platform_attribution_daily
  for select using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "members can read verified attribution matches" on public.order_attribution_matches
  for select using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
