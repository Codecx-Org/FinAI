"""Product tools for the LangGraph agent."""
import json
from langchain_core.tools import tool
from app.services.database import db_service


@tool
async def get_all_products(business_id: int) -> str:
    """List all products in the inventory for the given business."""
    products = await db_service.get_all_products(business_id)
    if not products:
        return "No products found in inventory."
    return json.dumps(products, default=str)


@tool
async def get_product(product_id: int, business_id: int) -> str:
    """Get details of a specific product by its ID."""
    product = await db_service.get_product(product_id, business_id)
    if not product:
        return f"Product ID {product_id} not found."
    return json.dumps(product, default=str)


@tool
async def create_product(
    business_id: int,
    name: str,
    stock_quantity: int,
    price: float,
    buying_price: float,
) -> str:
    """
    Create a new product in the inventory.
    Required: business_id, name, stock_quantity, price (selling), buying_price.
    """
    if price < 0 or buying_price < 0:
        return "Error: Price and buying price must be non-negative."
    product = await db_service.create_product(business_id, name, stock_quantity, price, buying_price)
    if not product:
        return "Error: Failed to create product."
    margin = ((price - buying_price) / price * 100) if price > 0 else 0
    return json.dumps({**product, "profitMargin": f"{margin:.1f}%"}, default=str)
