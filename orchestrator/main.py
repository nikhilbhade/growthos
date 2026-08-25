"""Container entrypoint: serve the ADK agents in this directory over HTTP.

Used by the Docker image on Cloud Run. `web=False` means a headless API server
(no browser UI). On Cloud Run this runs with --min-instances=0, so the service
scales to zero and costs nothing when idle — there is no always-on billable
endpoint.

Run locally:  uvicorn main:app --host 0.0.0.0 --port 8080
"""
import os

from google.adk.cli.fast_api import get_fast_api_app

# Directory that contains the agent packages (e.g. meta_agent/).
AGENTS_DIR = os.path.dirname(os.path.abspath(__file__))

app = get_fast_api_app(agents_dir=AGENTS_DIR, web=False)
