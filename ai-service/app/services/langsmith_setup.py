"""
LangSmith Observability Setup for the FinAI AI Service.

This module enables LangSmith tracing when LANGCHAIN_TRACING_V2=true.
LangSmith provides:
  - Full trace of every agent run (prompt → tool calls → response)
  - Latency breakdown per step
  - Token usage and cost tracking
  - Error capture with stack trace
  - Dataset creation from production runs for fine-tuning

Usage:
  1. Sign up at https://smith.langchain.com (free tier available)
  2. Add to ai-service/.env:
       LANGCHAIN_TRACING_V2=true
       LANGCHAIN_API_KEY=your_key
       LANGCHAIN_PROJECT=finai-production
  3. The setup is automatic — this module is imported by app/main.py

Note: Set LANGCHAIN_TRACING_V2=false to disable without removing keys.
"""
import os
from app.config import get_settings


def setup_langsmith() -> bool:
    """
    Configure LangSmith tracing environment variables.
    Returns True if enabled, False if disabled or keys not provided.
    """
    settings = get_settings()

    if settings.langchain_tracing_v2.lower() != "true":
        print("[LangSmith] Tracing disabled (LANGCHAIN_TRACING_V2 != 'true')")
        return False

    if not settings.langchain_api_key:
        print("[LangSmith] Tracing disabled (no LANGCHAIN_API_KEY set)")
        return False

    # Set all required LangSmith env vars
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
    os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"

    print(f"[LangSmith] ✅ Tracing enabled → project: '{settings.langchain_project}'")
    return True
