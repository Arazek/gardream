import json
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "PWA Template"

    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Keycloak
    KEYCLOAK_INTERNAL_URL: str = "http://keycloak:8080"
    KEYCLOAK_PUBLIC_URL: str = "https://gateway.localhost/keycloak"
    KEYCLOAK_REALM: str = "gardream"

    @property
    def KEYCLOAK_JWKS_URL(self) -> str:
        return (
            f"{self.KEYCLOAK_INTERNAL_URL}/keycloak/realms"
            f"/{self.KEYCLOAK_REALM}/protocol/openid-connect/certs"
        )

    @property
    def KEYCLOAK_ISSUER(self) -> str:
        # Must match the `iss` claim in tokens, which uses the public URL
        return f"{self.KEYCLOAK_PUBLIC_URL}/realms/{self.KEYCLOAK_REALM}"

    # Security
    SECRET_KEY: str

    # CORS — stored as a comma-separated string to avoid pydantic-settings JSON parsing
    # issues with Docker Compose env var interpolation. Use settings.cors_origins for List[str].
    BACKEND_CORS_ORIGINS: str = "https://localhost,https://localhost:4443"

    @property
    def cors_origins(self) -> List[str]:
        v = self.BACKEND_CORS_ORIGINS.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]

    # App public URL (used in email links)
    APP_URL: str = "https://localhost:4443"

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Digital Arboretum"
    SMTP_FROM_EMAIL: str = ""
    SMTP_ENABLED: bool = False

    # Scheduler timezone and cron hours (UTC)
    SCHEDULER_TIMEZONE: str = "UTC"
    MORNING_REMINDER_HOUR: int = 7
    MORNING_REMINDER_MINUTE: int = 0
    EVENING_REMINDER_HOUR: int = 19
    EVENING_REMINDER_MINUTE: int = 0

    # Logging
    LOG_LEVEL: str = "info"


settings = Settings()
