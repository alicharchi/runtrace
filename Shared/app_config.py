from pydantic_settings import BaseSettings
from typing import List, Optional
import logging

class AppConfig(BaseSettings):
    LOG_LEVEL: str = "INFO"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "openFoam"
    DB_USER: str = "postgres"
    PSWD_FILE: str = "/run/secrets/db-password"
    POLL_INTERVAL: int = 60
    MSG_BROKER: str = "kafka:9093"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]
    
    SENDER_EMAIL: str = "info@test.com"
    SMTP_SERVER: str = "localhost"
    SMTP_PORT: int = 25    
    SMTP_PSWD: Optional[str] = None

    @property
    def LOG_LEVEL_NUM(self) -> int:
        level = logging.getLevelName(self.LOG_LEVEL.upper())
        if not isinstance(level, int):
            raise ValueError(f"Invalid LOG_LEVEL: {self.LOG_LEVEL}")
        return level
    
    class Config:
        env_file = ".env"

CONFIG = AppConfig()
