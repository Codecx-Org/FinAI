"""Sales tools for the LangGraph agent."""
import json
from langchain_core.tools import tool
from app.services.database import db_service


@tool
async def get_all_sales(business_id: int) -> str:
    """List all sales records for the given business."""
    sales = await db_service.get_all_sales(business_id)
    if not sales:
        return "No sales records found."
    total = sum(float(s.get("totalAmount", 0)) for s in sales)
    return json.dumps({"sales": sales, "totalRevenue": total}, default=str)


@tool
async def create_sale(
    business_id: int,
    order_id: int,
    product_id: int,
    quantity: int,
    total_amount: float,
) -> str:
    """
    Record a new sale after a successful payment.
    Call this after check_payment_status returns 'paid'.
    """
    if quantity < 1:
        return "Error: Quantity must be at least 1."
    if total_amount < 0:
        return "Error: Total amount must be non-negative."

    sale = await db_service.create_sale(business_id, order_id, product_id, quantity, total_amount)
    if not sale:
        return "Error: Failed to create sale record."
    return json.dumps(sale, default=str)
