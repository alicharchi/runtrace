# syntax = docker/dockerfile:1.4

FROM python:3.9-slim

WORKDIR /app

COPY consumer/requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY consumer/*.py /app
COPY /Shared/app_config.py /app
COPY /Shared/logging_config.py /app
RUN mkdir -p /app/data

CMD ["python", "-u", "consumer.py"]