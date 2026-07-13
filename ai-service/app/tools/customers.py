"""Customer tools for the LangGraph agent."""
import json
from langchain_core.tools import tool
from app.services.database import db_service


@tool
async def get_all_customers(business_id: int) -> str:
    """List all customers for the given business."""
    customers = await db_service.get_all_customers(business_id)
    if not customers:
        return "No customers found."
    return json.dumps(customers, default=str)


@tool
async def get_customer(customer_id: int, business_id: int) -> str:
    """Get a specific customer by ID."""
    customer = await db_service.get_customer(customer_id, business_id)
    if not customer:
        return f"Customer ID {customer_id} not found."
    return json.dumps(customer, default=str)


@tool
async def create_customer(
    business_id: int,
    name: str,
    email: str | None = None,
    phone: str | None = None,
) -> str:
    """
    Create a new customer.
    Required: business_id, name. Optional: email, phone.
    """
    customer = await db_service.create_customer(business_id, name, email, phone)
    if not customer:
        return "Error: Failed to create customer."
    return json.dumps(customer, default=str)
