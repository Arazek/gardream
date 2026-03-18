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
    KEYCLOAK_PUBLIC_URL: str = "https://localhost:4443/auth"
    KEYCLOAK_REALM: str = "pwa"

    @property
    def KEYCLOAK_JWKS_URL(self) -> str:
        return (
            f"{self.KEYCLOAK_INTERNAL_URL}/auth/realms"
            f"/{self.KEYCLOAK_REALM}/protocol/openid-connect/certs"
        )

    @property
    def KEYCLOAK_ISSUER(self) -> str:
        # Must match the `iss` claim in tokens, which uses the public URL
        return f"{self.KEYCLOAK_PUBLIC_URL}/realms/{self.KEYCLOAK_REALM}"

    # Security
    SECRET_KEY: str

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["https://localhost", "https://localhost:4443"]

    # Logging
    LOG_LEVEL: str = "info"


settings = Settings()
