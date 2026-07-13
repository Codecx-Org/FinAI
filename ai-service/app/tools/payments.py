"""Payment tools for the LangGraph agent — calls the Core API payment service via HTTP."""
import json
import httpx
from langchain_core.tools import tool
from app.services.database import db_service
from app.config import get_settings

settings = get_settings()

# Internal Core API base URL (AI service calls Core API for payment ops)
CORE_API_URL = "http://localhost:3000"


@tool
async def initiate_payment(order_id: int, phone: str, amount: float) -> str:
    """
    Initiate an M-Pesa STK Push payment for an order.
    phone must be a Kenyan number: 07XXXXXXXX or 01XXXXXXXX (10 digits).
    This sends a payment prompt to the customer's phone.
    After calling this, wait 30-60 seconds then use check_payment_status.
    """
    import re
    if not re.match(r'^(07|01)\d{8}$', phone):
        return "Error: Phone must be in Kenyan format (07XXXXXXXX or 01XXXXXXXX, 10 digits)."
    if amount <= 0:
        return "Error: Amount must be greater than 0."

    # Check order exists first
    order = await db_service.get_order(order_id)
    if not order:
        return f"Error: Order ID {order_id} not found."
    if order.get("status") == "paid":
        return f"Order {order_id} is already paid."

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{CORE_API_URL}/api/payments/initiate",
                json={"orderId": order_id, "phone": phone, "amount": amount},
                headers={"x-internal-secret": settings.internal_api_secret},
            )
            return json.dumps(response.json())
    except Exception as e:
        return f"Error initiating payment: {str(e)}"


@tool
async def check_payment_status(order_id: int) -> str:
    """
    Check whether an M-Pesa payment has been completed for an order.
    Returns the current order status: created, pending, paid, failed, or canceled.
    """
    order = await db_service.get_order(order_id)
    if not order:
        return f"Order ID {order_id} not found."
    return json.dumps({
        "orderId": order_id,
        "status": order.get("status"),
        "totalAmount": order.get("totalAmount"),
        "customerName": order.get("customerName"),
    }, default=str)
