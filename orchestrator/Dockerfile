# Container for the ADK Meta orchestration agent, served as a headless HTTP API.
# Designed for Cloud Run with --min-instances=0 (scale to zero => no idle cost).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt ./
RUN pip install -r requirements.txt

# App code (tests/.env excluded via .dockerignore).
COPY . ./

# Run as non-root.
RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

# Cloud Run injects PORT (default 8080). Bind all interfaces.
ENV PORT=8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
