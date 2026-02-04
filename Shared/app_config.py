import os
import logging
from typing import List

def get_log_level() -> int:
    level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    level = logging.getLevelName(level_str)
    if not isinstance(level, int):
        raise RuntimeError(f"Invalid LOG_LEVEL: {level_str}")
    return level

def get_allowed_origins() -> List[str]:
    str_org = os.getenv("ALLOWED_ORIGINS","http://localhost:5173")
    return [o.strip() for o in str_org.split(",")]

LOG_LEVEL = get_log_level() 
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "openFoam")
DB_USER = os.getenv("DB_USER", "postgres")

PSWD_FILE = os.getenv("PASSWORD_FILE","/run/secrets/db-password")

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "60"))

MSG_BROKER = os.getenv("BOOTSTRAP_SERVERS", "kafka:9093")

ALLOWED_ORIGINS = get_allowed_origins()