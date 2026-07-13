"""Health check route — GET /health"""
from fastapi import APIRouter
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health():
    """Returns service health status and model configuration."""
    return {
        "status": "healthy",
        "service": "finai-ai-service",
        "model": settings.gemini_model,
        "langsmith_enabled": settings.langchain_tracing_v2.lower() == "true",
    }
