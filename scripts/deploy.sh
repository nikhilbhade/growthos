#!/usr/bin/env bash
#
# Deploy the GrowthOS web control plane (server.js) to Google Cloud Run.
#
# This builds the container from the repository root Dockerfile using Cloud
# Build — no local Docker daemon required — and deploys it as a Cloud Run
# service. Provider microservices (services/) are deployed separately; see
# docs/microservices-architecture.md for their deployment boundary.
#
# Usage:
#   scripts/deploy.sh [-- <extra gcloud run deploy args>]
#
# Configuration (environment variables, with defaults):
#   GROWTHOS_GCP_PROJECT   GCP project id        (default: growthos-506612)
#   GROWTHOS_GCP_REGION    Cloud Run region      (default: us-central1)
#   GROWTHOS_SERVICE       Cloud Run service name(default: growthos-web)
#   GROWTHOS_ALLOW_UNAUTH  Public access yes/no  (default: yes)
#   GROWTHOS_PRINT_ONLY    Print the command and exit without deploying (default: no)
#
# Application secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AGENT_MODEL_API_KEY,
# etc.) are NOT set here. Provide them out of band, e.g. from Secret Manager:
#   scripts/deploy.sh -- --set-secrets=SUPABASE_SERVICE_ROLE_KEY=growthos-supabase-key:latest
#
# Examples:
#   scripts/deploy.sh
#   GROWTHOS_GCP_REGION=us-east1 scripts/deploy.sh
#   GROWTHOS_PRINT_ONLY=yes scripts/deploy.sh
#   scripts/deploy.sh -- --set-env-vars=NODE_ENV=production --min-instances=1

set -euo pipefail

PROJECT="${GROWTHOS_GCP_PROJECT:-growthos-506612}"
REGION="${GROWTHOS_GCP_REGION:-us-central1}"
SERVICE="${GROWTHOS_SERVICE:-growthos-web}"
ALLOW_UNAUTH="${GROWTHOS_ALLOW_UNAUTH:-yes}"
PRINT_ONLY="${GROWTHOS_PRINT_ONLY:-no}"

# The repository root is one level up from this script.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Everything after `--` is passed straight through to `gcloud run deploy`.
EXTRA_ARGS=()
if [[ "${1:-}" == "--" ]]; then
  shift
  EXTRA_ARGS=("$@")
fi

deploy_args=(
  run deploy "$SERVICE"
  --project "$PROJECT"
  --region "$REGION"
  --source "$ROOT_DIR"
  --platform managed
)

if [[ "$ALLOW_UNAUTH" == "yes" ]]; then
  deploy_args+=(--allow-unauthenticated)
else
  deploy_args+=(--no-allow-unauthenticated)
fi

if [[ ${#EXTRA_ARGS[@]} -gt 0 ]]; then
  deploy_args+=("${EXTRA_ARGS[@]}")
fi

log "Project : $PROJECT"
log "Region  : $REGION"
log "Service : $SERVICE"
log "Source  : $ROOT_DIR"
log "Command : gcloud ${deploy_args[*]}"

if [[ "$PRINT_ONLY" == "yes" ]]; then
  log "GROWTHOS_PRINT_ONLY=yes — not deploying."
  exit 0
fi

command -v gcloud >/dev/null 2>&1 || die "gcloud CLI not found. Install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"

# Confirm the caller is authenticated before kicking off a Cloud Build.
if ! gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | grep -q .; then
  die "No active gcloud account. Run: gcloud auth login"
fi

log "Deploying to Cloud Run..."
gcloud "${deploy_args[@]}"

url="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)"
[[ -n "$url" ]] && log "Deployed: $url"
