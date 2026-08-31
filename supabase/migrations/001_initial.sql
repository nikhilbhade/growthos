-- GradientOS's multi-tenant core. Apply this in the Supabase SQL editor or via the Supabase CLI.
create extension if not exists pgcrypto;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now()
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  provider text not null check (provider in ('meta', 'tiktok', 'google', 'doordash', 'ubereats')),
  status text not null check (status in ('needs_setup', 'review', 'connected', 'error', 'paused')) default 'needs_setup',
  credential_ref text, -- Pointer to an encrypted server-side secret; never store a token in browser-visible rows.
  ad_account_count integer not null default 0,
  last_successful_sync_at timestamptz,
  last_error text,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, provider)
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  integration_connection_id uuid not null references public.integration_connections(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'failed', 'partial')),
  cursor text,
  records_received integer not null default 0,
  raw_payload_path text, -- Private Storage object path; the payload is immutable.
  error_message text
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  integration_connection_id uuid not null references public.integration_connections(id) on delete cascade,
  external_id text not null,
  name text not null,
  platform text not null check (platform in ('facebook', 'instagram', 'tiktok')),
  objective text,
  status text,
  currency text not null default 'USD',
  source_updated_at timestamptz,
  raw_payload_path text,
  unique (integration_connection_id, external_id)
);

create table public.campaign_daily_metrics (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  metric_date date not null,
  attribution_window text not null,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  spend_cents bigint not null default 0,
  online_orders integer,
  first_time_customers integer,
  store_visits integer,
  conversions jsonb not null default '{}'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  source_payload_path text,
  primary key (campaign_id, metric_date, attribution_window)
);

create table public.campaign_budget_changes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  occurred_at timestamptz not null,
  prior_budget_cents bigint,
  new_budget_cents bigint,
  source_payload_path text
);

alter table public.brands enable row level security;
alter table public.integration_connections enable row level security;
alter table public.sync_runs enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_daily_metrics enable row level security;
alter table public.campaign_budget_changes enable row level security;

create policy "members can read their brands" on public.brands for select using (owner_id = auth.uid());
create policy "members can read brand connections" on public.integration_connections for select using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "members can read brand campaigns" on public.campaigns for select using (exists (select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()));
create policy "members can read campaign metrics" on public.campaign_daily_metrics for select using (exists (select 1 from public.campaigns c join public.brands b on b.id = c.brand_id where c.id = campaign_id and b.owner_id = auth.uid()));
create policy "members can read budget changes" on public.campaign_budget_changes for select using (exists (select 1 from public.campaigns c join public.brands b on b.id = c.brand_id where c.id = campaign_id and b.owner_id = auth.uid()));

-- Keep the raw-data bucket private. Server code accesses it with the service role only.
insert into storage.buckets (id, name, public) values ('raw-integration-data', 'raw-integration-data', false)
on conflict (id) do nothing;
