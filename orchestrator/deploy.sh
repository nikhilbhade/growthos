#!/usr/bin/env bash
#
# Deploy the ADK Meta orchestration agent to Cloud Run.
#
# NO BILLABLE IDLE ENDPOINT: --min-instances=0 means the service scales to zero
# when idle, so it costs nothing between requests. --max-instances caps runaway.
# There is no Vertex/GPU endpoint and no always-on resource. You pay only for the
# brief request compute (and per-token model usage when the agent actually calls
# a model). Tear it down entirely with the delete command at the bottom.
#
# Prereqs (run once, in an AUTHENTICATED environment — not this sandbox):
#   gcloud auth login
#   gcloud config set project growthos-506612
#   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
#
# Then, from the orchestrator/ directory:
#   GROWTHOS_API_URL=https://<your-node-app> ./deploy.sh
#
set -euo pipefail

PROJECT_ID="growthos-506612"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-meta-orchestrator}"

# The Node GrowthOS server the agent retrieves from. Must be reachable from
# Cloud Run (a public URL, e.g. your Vercel deployment).
: "${GROWTHOS_API_URL:?Set GROWTHOS_API_URL to your reachable Node server URL}"

# Non-secret runtime config. Keep GROWTHOS_DEMO=true until real Meta creds are wired.
ENV_VARS="GROWTHOS_API_URL=${GROWTHOS_API_URL}"
ENV_VARS+=",ORCHESTRATOR_MODEL=${ORCHESTRATOR_MODEL:-gemini-2.5-flash}"
ENV_VARS+=",GROWTHOS_DEMO=${GROWTHOS_DEMO:-true}"

gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --min-instances=0 \
  --max-instances=3 \
  --cpu=1 \
  --memory=512Mi \
  --concurrency=20 \
  --timeout=120 \
  --no-allow-unauthenticated \
  --set-env-vars="${ENV_VARS}"

# Model API key is a SECRET — never bake it into --set-env-vars or the image.
# Store it in Secret Manager and reference it, e.g.:
#   printf 'YOUR_KEY' | gcloud secrets create google-api-key --data-file=-
#   gcloud run services update "${SERVICE}" --region "${REGION}" \
#     --set-secrets="GOOGLE_API_KEY=google-api-key:latest"

cat <<EOF

Deployed "${SERVICE}" to Cloud Run (region ${REGION}), scaling to zero when idle.
It requires authentication (--no-allow-unauthenticated). Get a token / URL with:
  gcloud run services describe ${SERVICE} --region ${REGION} --format='value(status.url)'

Tear it down completely (removes the service; nothing bills afterward):
  gcloud run services delete ${SERVICE} --region ${REGION} --quiet
EOF
