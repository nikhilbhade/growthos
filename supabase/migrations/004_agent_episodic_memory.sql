-- Episodic memory enrichment for agent_retrieval_runs (milestone M5).
-- Records enough of each run to power the recall_recent_activity tool and to
-- give the evaluation harness ground-truth logs. Still read-only history: a run
-- describes a retrieval or a refusal, never a campaign-management action.

alter table public.agent_retrieval_runs
  add column if not exists question text,
  add column if not exists selected_tool text,
  add column if not exists metric_version text,
  add column if not exists refusal_reason text;

-- Recall reads newest-first per brand + provider.
create index if not exists agent_retrieval_runs_recall_idx
  on public.agent_retrieval_runs (brand_id, provider, created_at desc);
