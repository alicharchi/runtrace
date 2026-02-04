from pydantic_settings import BaseSettings
from typing import List
import logging

class AppConfig(BaseSettings):
    _log_level: str = "INFO"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "openFoam"
    DB_USER: str = "postgres"
    PSWD_FILE: str = "/run/secrets/db-password"
    POLL_INTERVAL: int = 60
    MSG_BROKER: str = "kafka:9093"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    @property
    def LOG_LEVEL(self) -> int:
        level = logging.getLevelName(self._log_level.upper())
        if not isinstance(level, int):
            raise ValueError(f"Invalid LOG_LEVEL: {self.LOG_LEVEL}")
        return level
    
    class Config:
        env_file = ".env"

CONFIG = AppConfig()
