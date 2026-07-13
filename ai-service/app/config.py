"""
AI Service Configuration
Reads from environment variables with sensible defaults.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str
    gemini_model: str = "gemini-2.0-flash"

    # Redis
    redis_url: str = "redis://localhost:6379"
    conversation_ttl_seconds: int = 1800  # 30 minutes

    # Database
    database_url: str

    # WhatsApp internal
    whatsapp_internal_url: str = "http://localhost:3001"

    # Internal auth
    internal_api_secret: str = ""

    # LangSmith (optional)
    langchain_tracing_v2: str = "false"
    langchain_api_key: str = ""
    langchain_project: str = "finai-production"

    # Service
    ai_service_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
