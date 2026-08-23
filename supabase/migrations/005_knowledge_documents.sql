-- Knowledge store for agent grounding (milestone M3 persistence).
-- Read-only documentation embeddings only — metric definitions, data dictionary,
-- naming taxonomy, integration SOP. No customer PII or account data lives here.
--
-- vector(1024) matches the default embedder width (services/knowledge/retriever.py
-- LOCAL_DIMS). If you switch to a real embedding model with a different width,
-- change this dimension and re-run services/knowledge/ingest.py.

create extension if not exists vector;

create table if not exists public.knowledge_documents (
  id text primary key,
  provider text not null check (provider in ('all', 'meta', 'tiktok', 'google')),
  source text not null,
  title text not null,
  body text not null,
  embedding vector(1024) not null,
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_documents_embedding_idx
  on public.knowledge_documents using hnsw (embedding vector_cosine_ops);
create index if not exists knowledge_documents_provider_idx
  on public.knowledge_documents (provider);

-- Server-side only: the knowledge service connects with the service role, which
-- bypasses RLS. Enabling RLS with no public policy keeps it unreadable by anon
-- or authenticated browser clients.
alter table public.knowledge_documents enable row level security;
