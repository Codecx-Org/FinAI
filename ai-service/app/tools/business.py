"""Business summary and info tools for the LangGraph agent."""
import json
from langchain_core.tools import tool
from app.services.database import db_service


@tool
async def get_business_summary(business_id: int) -> str:
    """
    Get a comprehensive financial and operational summary of the business.
    Use when user asks: 'how is my business doing?', 'give me a summary', 'status report'.
    Returns: revenue, expenses, profit, product count, low stock alerts, pending orders.
    """
    summary = await db_service.get_business_summary(business_id)
    return json.dumps(summary, default=str)


@tool
async def get_business_info(business_id: int) -> str:
    """
    Get business profile information (name, owner, type, tenure).
    """
    business = await db_service.get_business(business_id)
    if not business:
        return f"Business ID {business_id} not found."
    return json.dumps(business, default=str)
