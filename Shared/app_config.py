from pydantic_settings import BaseSettings
from pydantic import EmailStr,Field
from typing import List, Optional
import logging
from enum import Enum

class JWTAlgorithm(str, Enum):
    HS256 = "HS256"
    HS384 = "HS384"
    HS512 = "HS512"

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
    SMTP_SERVER: str = "mailpit"
    SMTP_PORT: int = 25    
    SMTP_PSWD: Optional[str] = None

    LOCAL_TIMEZONE: str = "America/Los_Angeles"

    SQL_ECHO: bool = True 

    ADMIN_EMAIL: EmailStr ="admin@test.com"
    ADMIN_PASSWORD: str ="test123"

    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: JWTAlgorithm = JWTAlgorithm.HS256
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, gt=0)

    @property
    def LOG_LEVEL_NUM(self) -> int:
        level = logging.getLevelName(self.LOG_LEVEL.upper())
        if not isinstance(level, int):
            raise ValueError(f"Invalid LOG_LEVEL: {self.LOG_LEVEL}")
        return level
    
    class Config:
        env_file = ".env"

CONFIG = AppConfig()
