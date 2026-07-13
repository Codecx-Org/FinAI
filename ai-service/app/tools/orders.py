"""Order tools for the LangGraph agent."""
import json
from langchain_core.tools import tool
from app.services.database import db_service


@tool
async def get_all_orders(business_id: int) -> str:
    """List all orders for the given business."""
    orders = await db_service.get_all_orders(business_id)
    if not orders:
        return "No orders found."
    return json.dumps(orders, default=str)


@tool
async def get_order(order_id: int) -> str:
    """Get details of a specific order by its ID, including customer info."""
    order = await db_service.get_order(order_id)
    if not order:
        return f"Order ID {order_id} not found."
    return json.dumps(order, default=str)


@tool
async def create_order(
    business_id: int,
    total_amount: float,
    status: str = "created",
    customer_id: int | None = None,
) -> str:
    """
    Create a new order.
    status must be one of: drafted, created, pending, paid, canceled, failed.
    customer_id is optional.
    """
    valid_statuses = {"drafted", "created", "pending", "paid", "canceled", "failed"}
    if status not in valid_statuses:
        return f"Error: Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}"
    if total_amount < 0:
        return "Error: Total amount must be non-negative."

    order = await db_service.create_order(business_id, customer_id, total_amount, status)
    if not order:
        return "Error: Failed to create order."
    return json.dumps(order, default=str)
