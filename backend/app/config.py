import os
from functools import lru_cache


class Settings:
    # SQLite by default so no external database is required. Render's disk is
    # ephemeral on the free tier, so for production persistence either attach
    # a Render Disk at /data and set DATABASE_URL=sqlite:////data/projectmentor.db,
    # or swap in a managed Postgres URL here.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./projectmentor.db")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_API_URL: str = os.getenv("LLM_API_URL", "https://api.anthropic.com/v1/messages")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
