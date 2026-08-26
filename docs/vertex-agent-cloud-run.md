# Vertex AI agent deployment

GrowthOS uses **Gemini 2.5 Flash-Lite** through Vertex AI's serverless Generative AI API. Do not deploy a Model Garden GPU endpoint for the retrieval agents: it incurs dedicated compute cost and is unnecessary for this workload.

## Runtime boundary

1. Cloud Run runs the private GrowthOS Node API.
2. A dedicated Cloud Run service account authenticates to Vertex through Application Default Credentials.
3. The agent retrieves tenant-scoped provider data first, calculates metrics in code, and then asks Gemini to explain only that retrieved data.
4. The model has no provider credentials and no write tools.

## One-time Google Cloud setup

Set the project and region before deployment:

```bash
export GROWTHOS_PROJECT_ID="growthos-506612"
export GROWTHOS_REGION="us-central1"
gcloud config set project "$GROWTHOS_PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com secretmanager.googleapis.com
```

Create the runtime identity and only the permissions it needs:

```bash
gcloud iam service-accounts create growthos-agent-runtime --display-name="GrowthOS agent runtime"
gcloud projects add-iam-policy-binding "$GROWTHOS_PROJECT_ID" \
  --member="serviceAccount:growthos-agent-runtime@${GROWTHOS_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## Store production configuration

Store values in Secret Manager. Never copy `.env` into a container image or commit it.

```bash
printf '%s' 'vertex' | gcloud secrets create growthos-agent-model-provider --data-file=-
printf '%s' 'gemini-2.5-flash-lite' | gcloud secrets create growthos-agent-model-id --data-file=-
printf '%s' "$GROWTHOS_PROJECT_ID" | gcloud secrets create growthos-vertex-project-id --data-file=-
printf '%s' "$GROWTHOS_REGION" | gcloud secrets create growthos-vertex-location --data-file=-
```

Grant the runtime service account access to each secret:

```bash
for secret in growthos-agent-model-provider growthos-agent-model-id growthos-vertex-project-id growthos-vertex-location; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:growthos-agent-runtime@${GROWTHOS_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SERVICE_AUTH_TOKEN`, and any database connection string using the same Secret Manager pattern before live customer traffic.

## Deploy

```bash
gcloud run deploy growthos-agent-api \
  --source . \
  --region "$GROWTHOS_REGION" \
  --service-account "growthos-agent-runtime@${GROWTHOS_PROJECT_ID}.iam.gserviceaccount.com" \
  --set-secrets "AGENT_MODEL_PROVIDER=growthos-agent-model-provider:latest,AGENT_MODEL_ID=growthos-agent-model-id:latest,VERTEX_AI_PROJECT_ID=growthos-vertex-project-id:latest,VERTEX_AI_LOCATION=growthos-vertex-location:latest" \
  --no-allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --cpu 1 \
  --memory 1Gi
```

Keep the service private. The browser must call an authenticated control-plane API, which validates the Supabase JWT and then calls this service with an IAM identity or service-to-service token.

## Local development

Use ADC, not a copied key file:

```bash
gcloud auth application-default login
AGENT_MODEL_PROVIDER=vertex \
AGENT_MODEL_ID=gemini-2.5-flash-lite \
VERTEX_AI_PROJECT_ID=growthos-506612 \
VERTEX_AI_LOCATION=us-central1 \
npm start
```

If Vertex is not configured or returns an error, GrowthOS automatically falls back to its deterministic read-only retrieval path.
