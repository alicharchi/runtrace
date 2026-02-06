# syntax=docker/dockerfile:1.4

# -------------------------------
# Base image
# -------------------------------
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# -------------------------------
# System dependencies
# -------------------------------
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------
# Python dependencies
# -------------------------------
COPY backend/api/requirements.txt /app/requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r /app/requirements.txt

# -------------------------------
# Non-root user
# -------------------------------
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# -------------------------------
# Application code
# -------------------------------
COPY backend/api/app /app/app
COPY Shared/app_config.py /app/app/app_config.py

RUN chown -R appuser:appuser /app
USER appuser

# -------------------------------
# Runtime
# -------------------------------
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host=0.0.0.0", "--port=8001"]