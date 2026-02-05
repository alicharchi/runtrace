# syntax = docker/dockerfile:1.4

FROM python:3.11-slim

# Prevent Python from buffering logs
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY notifier/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY notifier/*.py /app
COPY notifier/*.html /app
COPY /Shared/app_config.py /app
COPY /Shared/logging_config.py /app
RUN mkdir -p /app/data

CMD ["python", "-u", "notifier.py"]