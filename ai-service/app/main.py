"""
FinAI AI Service — FastAPI Entry Point

Stack:
  - FastAPI for HTTP
  - LangGraph + Gemini 2.0 Flash for the AI agent
  - Redis for conversation history (30-min TTL)
  - asyncpg for direct PostgreSQL access
  - LangSmith for observability (optional)

Start with:
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
Or via PM2:
  pm2 start ecosystem.config.js --only finai-ai-service
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.database import close_pool
from app.services.redis_history import conversation_history
from app.services.langsmith_setup import setup_langsmith
from app.routes.chat import router as chat_router
from app.routes.insights import router as insights_router
from app.routes.health import router as health_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle manager."""
    setup_langsmith()  # Enable LangSmith tracing if configured
    print(f"[AI Service] Starting — model: {settings.gemini_model}")
    yield
    # Cleanup on shutdown
    print("[AI Service] Shutting down...")
    await close_pool()
    await conversation_history.close()
    print("[AI Service] Connections closed.")


app = FastAPI(
    title="FinAI AI Service",
    description="LangGraph + Gemini 2.0 Flash agent for Kenyan SME financial assistance",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS (only needed if AI service is called directly — normally via Core API) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "x-internal-secret"],
)


# ─── Internal Secret Auth ──────────────────────────────────────────────────────
@app.middleware("http")
async def verify_internal_secret(request: Request, call_next):
    """
    All requests to the AI service must include x-internal-secret header.
    This prevents direct external access — all traffic must go through Core API.
    Skip for health check (to allow PM2 health monitoring).
    """
    if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
        return await call_next(request)

    if settings.internal_api_secret:
        secret = request.headers.get("x-internal-secret", "")
        if secret != settings.internal_api_secret:
            return JSONResponse(status_code=403, content={"error": "Forbidden"})

    return await call_next(request)


# ─── Global Error Handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc)},
    )


# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(insights_router)
