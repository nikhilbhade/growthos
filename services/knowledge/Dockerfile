FROM python:3.12-alpine

WORKDIR /app
COPY services/knowledge ./

# Stdlib-only for the MVP — no requirements to install. A real embedding backend
# adds its client here later.
EXPOSE 4200
CMD ["python", "app.py"]
