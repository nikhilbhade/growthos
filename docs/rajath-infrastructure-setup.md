# GradientOS infrastructure setup guide

This guide sets up a production-ready foundation without Kubernetes. It uses Cloudflare for the public web experience and AWS for the application, data, and background processing.

## The simple model

| Service | What it does |
| --- | --- |
| Cloudflare | Domain, DNS, SSL, CDN, WAF, and the static frontend |
| AWS ECS Fargate | Runs the GradientOS API and background workers as containers |
| RDS PostgreSQL | The product's live source of truth |
| S3 | Raw copies of Meta, TikTok, Google, SFTP, and email report data |
| SQS | Reliable queues for scheduled data pulls and retries |
| Redis / ElastiCache | Caching and rate limits; add after the first production workload exists |
| BigQuery | Long-horizon reporting and ML; add after the operational database is stable |

## Step 1 — Create the environments

1. Create separate AWS environments for `dev`, `staging`, and `production`.
2. Pick one primary US region for the initial production system, such as `us-east-1`.
3. Turn on MFA for every administrator and create individual IAM users or SSO roles. Do not share the root account.
4. Create a Cloudflare account and add the GradientOS domain. Point the registrar nameservers to Cloudflare.

## Step 2 — Put the customer-facing site behind Cloudflare

1. Create a Cloudflare Pages project from the GitHub repository.
2. Use the static frontend build as the Pages deployment output.
3. Point `growthos.com` and `www.growthos.com` to Cloudflare Pages.
4. Point `api.growthos.com` to the AWS Application Load Balancer created in Step 4.
5. Enable Cloudflare SSL, WAF managed rules, bot protection, and basic rate limiting.

The frontend should call the API at `https://api.growthos.com`; it should never contain platform client secrets or database credentials.

## Step 3 — Containerize GradientOS

Create two Docker images and store them in Amazon ECR:

1. **API service** — dashboard APIs, authentication checks, connections setup, and read-only agent endpoints.
2. **Worker service** — Meta, TikTok, Google, SFTP, and email-report ingestion; data transformations; agent/ML jobs.

Start with these two services. Do not create a separate microservice for every provider yet. Keep provider code as modules inside the worker until scaling or team ownership makes a split worthwhile.

## Step 4 — Run the API and workers on ECS Fargate

1. Create an AWS VPC with public and private subnets in at least two availability zones.
2. Create an Application Load Balancer in public subnets.
3. Create an ECS Fargate cluster in private subnets.
4. Deploy the API service behind the load balancer.
5. Deploy worker services without public IP addresses.
6. Configure autoscaling for the API based on CPU, memory, and request load.
7. Use CloudWatch logs for every container.

## Step 5 — Create the databases and storage

1. Create Amazon RDS PostgreSQL with Multi-AZ enabled for production.
2. Put RDS in private subnets and allow access only from ECS security groups.
3. Create an encrypted S3 bucket for raw provider payloads and reports.
4. Store raw files with a predictable path:

   `raw/{organisation-id}/{provider}/{yyyy-mm-dd}/{sync-run-id}.json.gz`

5. Create another bucket for non-sensitive generated exports if customers will download reports.
6. Enable database backups, point-in-time recovery, and S3 lifecycle rules.

Postgres stores normalized entities and current product state: organisations, users, locations, provider connections, campaigns, ad sets, ads, daily metrics, workflow approvals, and audit logs. S3 preserves the raw original files so we can replay or debug a sync.

## Step 6 — Add safe secrets and authentication

1. Put every Meta, TikTok, Google, database, and SFTP credential in AWS Secrets Manager.
2. Encrypt secrets and OAuth tokens with AWS KMS.
3. Give each ECS task only the IAM permissions it needs.
4. Keep Google login with Supabase initially, or move it to AWS Cognito later. Either way, the production callback URL must be registered in the identity provider.
5. Never ask a customer for an ad-platform password; use OAuth or a provider-approved invitation flow.

## Step 7 — Build the ingestion pipeline

For each provider, the flow should be:

`scheduler → SQS job → worker → raw S3 payload → validation → Postgres metrics → dashboard`

1. Use EventBridge Scheduler to create recurring jobs.
2. Send each job to an SQS queue.
3. Give Meta, TikTok, Google, and report/SFTP ingestion separate queues.
4. Give every queue a dead-letter queue for failed jobs.
5. Track each sync in Postgres with status, timestamps, provider account, coverage, and error details.
6. Make jobs idempotent: a retry must not duplicate campaign metrics.

## Step 8 — Add Redis when it is needed

Use AWS ElastiCache for Redis for:

- API rate limits
- short-lived dashboard cache
- provider API throttling state
- temporary agent conversation state
- distributed locks that prevent duplicate sync jobs

Redis is not the system of record. Postgres remains the source of truth.

## Step 9 — Add BigQuery later, not on day one

Add BigQuery when GradientOS needs multi-year, cross-location analytics, ML training data, or complex reporting that should not slow down Postgres.

1. Export modeled daily facts from Postgres/S3 to BigQuery on an hourly or daily schedule.
2. Partition tables by date and cluster them by organisation, provider, and location.
3. Use BigQuery for large analytical queries, retention models, forecasting features, and customer exports.
4. Keep live permissions, connections, workflows, and dashboard reads in Postgres.

## Step 10 — Deploy safely

1. Manage AWS, Cloudflare, and database resources with Terraform.
2. Use GitHub Actions to build Docker images, push to ECR, and deploy to staging first.
3. Run database migrations as a separate release step.
4. Promote the same image from staging to production after smoke tests pass.
5. Set alerts for failed syncs, token refresh failures, queue depth, API errors, database capacity, and unexpected cloud cost.

## First production milestone

The first real milestone is not "all integrations live." It is:

> One restaurant organisation can sign in, connect one approved ad account, complete a reliable daily sync, view validated campaign data, and see an actionable error when anything fails.

Once that path is dependable, add providers and scale workers independently.
