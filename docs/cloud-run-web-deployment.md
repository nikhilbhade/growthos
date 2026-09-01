# GradientOS web deployment on Cloud Run

Cloud Run is the single production host for the GradientOS landing page, Google
sign-in callback destination, dashboard, and the Node API. Vercel is not part
of this production path.

## Routing model

| URL | Purpose |
| --- | --- |
| `/` | Public GradientOS landing page |
| `/app.html` | Google-authenticated GradientOS workspace |
| `/api/*` | Authenticated application API |
| `/_health` | Cloud Run health check |

The browser always sends Google OAuth to the configured canonical origin,
followed by `/app.html`. Set `GROWTHOS_PUBLIC_APP_URL` to the production custom
domain so customers never land on a `run.app` infrastructure URL.

## One-time Google Cloud setup

Run these commands with a project owner account. Replace the variables before
running them.

```bash
export PROJECT_ID="your-google-cloud-project"
export REGION="us-central1"
export REPOSITORY="growthos"
export SERVICE="growthos-web"
export RUNTIME_SA="growthos-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com aiplatform.googleapis.com
export BUILD_SA="$(gcloud builds get-default-service-account --region="$REGION")"
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION"
gcloud iam service-accounts create growthos-runtime --display-name="GradientOS Cloud Run runtime"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/aiplatform.user"
gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" --location="$REGION" --member="serviceAccount:${BUILD_SA}" --role="roles/artifactregistry.writer"
```

Create the two Supabase runtime values. The anon key is safe to deliver to the
browser through `/api/auth-config`; the service-role key must never be added to
this Cloud Run service.

```bash
printf '%s' 'https://YOUR_PROJECT.supabase.co' | gcloud secrets create growthos-supabase-url --data-file=-
printf '%s' 'YOUR_SUPABASE_PUBLISHABLE_ANON_KEY' | gcloud secrets create growthos-supabase-anon-key --data-file=-
```

## Build and deploy

The repository’s `cloudbuild.yaml` builds the Docker image and pushes it to the
single GradientOS Artifact Registry repository. The GCP project owner then deploys
that exact immutable image to Cloud Run. This intentionally keeps the build
identity scoped to one repository instead of granting it project-wide deployment
privileges.

```bash
export IMAGE_TAG="$(git rev-parse --short HEAD)"
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION="$REGION",_REPOSITORY="$REPOSITORY",_SERVICE="$SERVICE",_IMAGE_TAG="$IMAGE_TAG"

gcloud run deploy "$SERVICE" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:${IMAGE_TAG}" \
  --region="$REGION" \
  --service-account="$RUNTIME_SA" \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="GROWTHOS_REQUIRE_AUTH=true,GROWTHOS_PUBLIC_APP_URL=https://gradientos.ai,AGENT_MODEL_PROVIDER=vertex,AGENT_MODEL_ID=gemini-2.5-flash-lite,VERTEX_AI_PROJECT_ID=${PROJECT_ID},VERTEX_AI_LOCATION=${REGION}" \
  --set-secrets="SUPABASE_URL=growthos-supabase-url:latest,SUPABASE_ANON_KEY=growthos-supabase-anon-key:latest"
```

Retrieve the production URL and verify the service:

```bash
export APP_ORIGIN="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')"
curl -fsS "$APP_ORIGIN/_health"
open "$APP_ORIGIN"
```

## Finish Google and Supabase routing

For the current production domain, configure these exact values:

1. In **Supabase → Authentication → URL Configuration**, set **Site URL** to
   `https://gradientos.ai` and add `https://gradientos.ai/app.html` as a
   Redirect URL.
2. In **Google Cloud → Credentials → OAuth 2.0 Client**, add `$APP_ORIGIN` to
   Authorized JavaScript origins and add `https://gradientos.ai`.
3. Keep the **Authorized redirect URI** set to the Supabase provider callback:
   `https://<your-supabase-project>.supabase.co/auth/v1/callback`.
4. In **Supabase → Authentication → Providers → Google**, ensure Google is
   enabled and the Google client ID and client secret are saved.
5. Set the Cloud Run variable
   `GROWTHOS_PUBLIC_APP_URL=https://gradientos.ai`.
6. Sign in from `https://gradientos.ai`; a successful sign-in must land at
   `https://gradientos.ai/app.html#growth`.

If a custom domain is mapped to Cloud Run later, add that custom-domain origin
and `/app.html` redirect URL in steps 1–2, then make it the Supabase Site URL.
Do not remove the working `run.app` redirect until the custom-domain sign-in
has been tested.

## Continuous delivery

`cloudbuild.yaml` now builds the image, pushes it, and deploys it to Cloud Run
in one pipeline. The deploy step swaps only the container image on the existing
service, so the runtime configuration set above (service account, env vars,
secrets, ingress) is preserved across releases.

Create a Cloud Build trigger for the approved production branch (`main`):

1. Point the trigger at `cloudbuild.yaml`.
2. Optionally set the substitution `_IMAGE_TAG=$SHORT_SHA` for immutable,
   per-commit image tags (the file defaults to `latest`).
3. Grant the build service account
   (`gcloud builds get-default-service-account --region="$REGION"`) the roles it
   needs to release:

   ```bash
   gcloud projects add-iam-policy-binding "$PROJECT_ID" \
     --member="serviceAccount:${BUILD_SA}" --role="roles/run.admin"
   gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
     --member="serviceAccount:${BUILD_SA}" --role="roles/iam.serviceAccountUser"
   ```

Because the multi-stage Docker build compiles the React/shadcn SPA in `web/`,
the pipeline sets `timeout: 1800s` to give the image build headroom. Keep the
Vercel Git integration disabled for this repository to prevent competing
deploys.
