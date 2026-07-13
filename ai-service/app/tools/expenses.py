"""Expense tools for the LangGraph agent."""
import json
from langchain_core.tools import tool
from app.services.database import db_service


@tool
async def get_all_expenses(business_id: int) -> str:
    """List all expense records for the given business."""
    expenses = await db_service.get_all_expenses(business_id)
    if not expenses:
        return "No expense records found."
    total = sum(float(e.get("amount", 0)) for e in expenses)
    return json.dumps({"expenses": expenses, "totalExpenses": total}, default=str)


@tool
async def create_expense(
    business_id: int,
    expense_type: str,
    amount: float,
    description: str = "",
    is_recurring: bool = False,
    frequency: str | None = None,
) -> str:
    """
    Record a new business expense.
    expense_type examples: Rent, Salaries, Stock Purchase, Utilities, Transport.
    frequency (if recurring): monthly or quarterly.
    """
    if amount < 0:
        return "Error: Amount must be non-negative."
    if is_recurring and frequency not in (None, "monthly", "quarterly"):
        return "Error: frequency must be 'monthly' or 'quarterly'."

    expense = await db_service.create_expense(
        business_id, expense_type, amount, description, is_recurring, frequency
    )
    if not expense:
        return "Error: Failed to create expense record."
    return json.dumps(expense, default=str)
