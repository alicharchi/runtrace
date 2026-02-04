# syntax = docker/dockerfile:1.4

FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY /app /app
RUN mkdir -p /app/data

CMD ["python", "-u", "notifier.py"]