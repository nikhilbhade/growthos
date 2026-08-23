-- Read-only agent audit trail. Each provider agent records what it retrieved,
-- never a campaign-management action.
create table public.agent_retrieval_runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  provider text not null check (provider in ('meta', 'tiktok')),
  requested_range text not null,
  requested_dimension text not null,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  records_returned integer not null default 0,
  freshness_at timestamptz,
  raw_payload_path text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.agent_retrieval_runs enable row level security;

create policy "members can read agent retrieval runs" on public.agent_retrieval_runs
  for select using (exists (
    select 1 from public.brands b where b.id = brand_id and b.owner_id = auth.uid()
  ));
