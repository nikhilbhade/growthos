# Loop campaign training-data ingestion

DoorDash and Uber Eats "Loop campaign" exports are the training corpus for the
workflow-recommendation model. They arrive as large gzipped CSVs
(~100–200 MB uncompressed each), which is far too big to pull through the app
or a connector. This pipeline loads them **straight into Supabase Postgres**.

## Design: raw → staging → modeled

The load is deliberately staged, mirroring GradientOS's existing
`raw_payload_path` convention:

1. **Staging (all TEXT).** Every column lands as `text` in the `staging` schema.
   Nothing is cast on load, so a single malformed value can never abort a
   multi-million-row `COPY`.
2. **Modeled (typed).** Once the source columns are confirmed, transform staging
   into typed tables with `INSERT ... SELECT ...::type`, and build the feature
   tables the model trains on.

`COPY` is used rather than row-by-row `insert()` through `supabase-js`: for
files this size it is one to two orders of magnitude faster and streams
directly from the `.gz` (no full decompress to disk).

Each run is logged to `public.data_ingestion_runs` (rows loaded, bytes,
whether the byte budget capped it, status) for auditability.

## One-time setup

1. Apply the migration `supabase/migrations/004_loop_training_data.sql`
   (Supabase SQL editor or CLI). It creates the `staging` schema and
   `public.data_ingestion_runs`.
2. `npm install` (adds `pg` and `pg-copy-streams`).
3. Set `SUPABASE_DB_URL` (see `.env.example`). Use the direct connection or the
   **session** pooler on port `5432` — the transaction pooler (`6543`) does not
   support `COPY`.

## Loading a file

The `--max-mb` budget stops the load on a clean row boundary. We start at
**100 MB** so the first pass stays small and within capacity.

```bash
SUPABASE_DB_URL='postgresql://postgres:...@...:5432/postgres' \
node scripts/ingest-loop-data.mjs \
  --file ./loop_campaign_dataset_A_loop_run.csv.gz \
  --table loop_run_a \
  --max-mb 100 --truncate

SUPABASE_DB_URL='postgresql://postgres:...@...:5432/postgres' \
node scripts/ingest-loop-data.mjs \
  --file ./loop_campaign_dataset_B_merchant_run.csv.gz \
  --table merchant_run_b \
  --max-mb 100 --truncate
```

The staging table is created automatically from the CSV header, so no column
list is needed up front.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--file` | — | Path to the local `.csv.gz` |
| `--table` | — | Staging table name (created if absent) |
| `--schema` | `staging` | Schema for the staging table |
| `--max-mb` | `100` | Uncompressed byte budget; stops on a row boundary |
| `--truncate` | off | Empty the staging table before loading |

## Capacity note

Two files at full size plus a denormalized feature table can exceed the 500 MB
Supabase free-tier database limit. Keep the raw `.gz` in Storage, stage only
long enough to transform, then `drop` the staging tables and keep the modeled +
feature rows.

## Next step

Once the first 100 MB is staged, inspect the real columns:

```sql
select * from staging.loop_run_a limit 20;
select column_name from information_schema.columns
  where table_schema = 'staging' and table_name = 'loop_run_a';
```

From there we finalize the typed modeled tables, the join between the
`loop_run` (action) and `merchant_run` (outcome) datasets, and the feature
tables the recommendation model trains on.
