-- Loop campaign training data ingestion.
--
-- Raw DoorDash / Uber Eats "Loop campaign" exports are bulk-loaded into an
-- all-TEXT staging table via Postgres COPY (see scripts/ingest-loop-data.mjs),
-- then transformed into typed, modeled tables once the source schema is
-- confirmed. This mirrors GradientOS's existing raw -> modeled pattern
-- (raw_payload_path on campaigns / campaign_daily_metrics).
--
-- Apply in the Supabase SQL editor or via the Supabase CLI.

-- Staging lives in its own schema so it is never confused with product tables
-- and is easy to drop wholesale after a transform. The per-file staging tables
-- (e.g. staging.loop_run_a, staging.merchant_run_b) are created dynamically by
-- the ingest script because their columns are not known until the CSV header is
-- read. Every column is created as text so a single malformed value can never
-- abort a multi-million-row load.
create schema if not exists staging;

comment on schema staging is
  'All-TEXT landing zone for bulk CSV loads (Loop campaign exports). Server/service-role only; transform into modeled tables, then drop.';

-- Bookkeeping for each bulk load, in the spirit of public.sync_runs. One row
-- per invocation of the ingest script so loads are auditable and resumable.
create table if not exists public.data_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,          -- Original file name, e.g. loop_campaign_dataset_A_loop_run.csv.gz
  target_table text not null,         -- Fully-qualified staging table, e.g. staging.loop_run_a
  status text not null check (status in ('running', 'succeeded', 'failed')) default 'running',
  max_bytes bigint,                   -- Uncompressed byte budget for this run (null = no cap)
  rows_loaded bigint not null default 0,
  bytes_loaded bigint not null default 0,
  truncated boolean not null default false,
  capped boolean not null default false, -- True if the byte budget stopped the load before EOF
  columns jsonb,                      -- Ordered list of derived column identifiers
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- This table is operational metadata, not brand-scoped customer data. Enable
-- RLS with no policy so it is readable only by the service role (which bypasses
-- RLS); it is never exposed to browser clients.
alter table public.data_ingestion_runs enable row level security;
