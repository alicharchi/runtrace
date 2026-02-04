# syntax = docker/dockerfile:1.4

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY api/requirements.txt ./

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

USER appuser

COPY api/*.py /app
COPY /Shared/app_config.py /app
EXPOSE 8001

CMD ["python3","-m","uvicorn","app:app","--reload","--host=0.0.0.0","--port=8001"]