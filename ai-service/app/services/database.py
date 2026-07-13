"""
Database service for the AI service.
Uses raw asyncpg/SQLAlchemy to query the same PostgreSQL DB as the Core API.
"""
import asyncpg
from app.config import get_settings

settings = get_settings()

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=5)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


class DatabaseService:
    """Thin read layer over the shared Postgres DB, used by LangGraph tools."""

    async def _fetch(self, query: str, *args) -> list[dict]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]

    async def _fetchrow(self, query: str, *args) -> dict | None:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None

    async def _execute(self, query: str, *args) -> str:
        pool = await get_pool()
        async with pool.acquire() as conn:
            return await conn.execute(query, *args)

    # ── Products ──────────────────────────────────────────────────────────────

    async def get_all_products(self, business_id: int) -> list[dict]:
        return await self._fetch(
            'SELECT id, name, category, "stockQuantity", price, "buyingPrice", supplier, '
            '"minStockLevel", "maxStockLevel", "createdAt" '
            'FROM "Product" WHERE "businessId" = $1 ORDER BY name',
            business_id,
        )

    async def get_product(self, product_id: int, business_id: int) -> dict | None:
        return await self._fetchrow(
            'SELECT * FROM "Product" WHERE id = $1 AND "businessId" = $2',
            product_id, business_id,
        )

    async def create_product(self, business_id: int, name: str, stock_quantity: int,
                              price: float, buying_price: float) -> dict | None:
        return await self._fetchrow(
            'INSERT INTO "Product" (name, "stockQuantity", price, "buyingPrice", "businessId") '
            'VALUES ($1, $2, $3, $4, $5) RETURNING id, name, "stockQuantity", price, "buyingPrice"',
            name, stock_quantity, price, buying_price, business_id,
        )

    # ── Customers ─────────────────────────────────────────────────────────────

    async def get_all_customers(self, business_id: int) -> list[dict]:
        return await self._fetch(
            'SELECT id, name, email, phone, "createdAt" FROM "Customer" WHERE "businessId" = $1 ORDER BY name',
            business_id,
        )

    async def get_customer(self, customer_id: int, business_id: int) -> dict | None:
        return await self._fetchrow(
            'SELECT * FROM "Customer" WHERE id = $1 AND "businessId" = $2',
            customer_id, business_id,
        )

    async def create_customer(self, business_id: int, name: str, email: str | None = None,
                               phone: str | None = None) -> dict | None:
        return await self._fetchrow(
            'INSERT INTO "Customer" (name, email, phone, "businessId") '
            'VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
            name, email, phone, business_id,
        )

    # ── Orders ────────────────────────────────────────────────────────────────

    async def get_all_orders(self, business_id: int) -> list[dict]:
        return await self._fetch(
            'SELECT o.id, o."totalAmount", o.status, o."createdAt", '
            'c.name as "customerName" '
            'FROM "Order" o LEFT JOIN "Customer" c ON o."customerId" = c.id '
            'WHERE o."businessId" = $1 ORDER BY o."createdAt" DESC',
            business_id,
        )

    async def get_order(self, order_id: int) -> dict | None:
        return await self._fetchrow(
            'SELECT o.*, c.name as "customerName", c.phone as "customerPhone" '
            'FROM "Order" o LEFT JOIN "Customer" c ON o."customerId" = c.id '
            'WHERE o.id = $1',
            order_id,
        )

    async def create_order(self, business_id: int, customer_id: int | None,
                            total_amount: float, status: str) -> dict | None:
        return await self._fetchrow(
            'INSERT INTO "Order" ("customerId", "totalAmount", status, "businessId") '
            'VALUES ($1, $2, $3, $4) RETURNING id, "totalAmount", status',
            customer_id, total_amount, status, business_id,
        )

    # ── Sales ────────────────────────────────────────────────────────────────

    async def get_all_sales(self, business_id: int) -> list[dict]:
        return await self._fetch(
            'SELECT s.id, s."totalAmount", s.quantity, s."createdAt", '
            'p.name as "productName" '
            'FROM "Sales" s LEFT JOIN "Product" p ON s."productId" = p.id '
            'WHERE s."businessId" = $1 ORDER BY s."createdAt" DESC',
            business_id,
        )

    async def create_sale(self, business_id: int, order_id: int, product_id: int,
                           quantity: int, total_amount: float) -> dict | None:
        return await self._fetchrow(
            'INSERT INTO "Sales" ("orderId", "productId", quantity, "totalAmount", "businessId") '
            'VALUES ($1, $2, $3, $4, $5) RETURNING id, "totalAmount", quantity',
            order_id, product_id, quantity, total_amount, business_id,
        )

    # ── Expenses ─────────────────────────────────────────────────────────────

    async def get_all_expenses(self, business_id: int) -> list[dict]:
        return await self._fetch(
            'SELECT id, type, amount, description, "isRecurring", frequency, "createdAt" '
            'FROM "Expenses" WHERE "businessId" = $1 ORDER BY "createdAt" DESC',
            business_id,
        )

    async def create_expense(self, business_id: int, expense_type: str, amount: float,
                              description: str = "", is_recurring: bool = False,
                              frequency: str | None = None) -> dict | None:
        return await self._fetchrow(
            'INSERT INTO "Expenses" (type, amount, description, "isRecurring", frequency, "businessId") '
            'VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, type, amount',
            expense_type, amount, description, is_recurring, frequency, business_id,
        )

    # ── Business ─────────────────────────────────────────────────────────────

    async def get_business(self, business_id: int) -> dict | None:
        return await self._fetchrow(
            'SELECT id, name, "ownerName", "ownerEmail", "businessType", "yearsInBusiness", "createdAt" '
            'FROM "Business" WHERE id = $1',
            business_id,
        )

    # ── Business Summary (for insights) ──────────────────────────────────────

    async def get_business_summary(self, business_id: int) -> dict:
        products = await self.get_all_products(business_id)
        sales = await self.get_all_sales(business_id)
        expenses = await self.get_all_expenses(business_id)
        orders = await self.get_all_orders(business_id)

        total_revenue = sum(float(s.get("totalAmount", 0)) for s in sales)
        total_expenses = sum(float(e.get("amount", 0)) for e in expenses)
        low_stock = [p for p in products if int(p.get("stockQuantity", 0)) < 5]
        pending_orders = [o for o in orders if o.get("status") in ("pending", "created")]

        return {
            "revenue": total_revenue,
            "expenses": total_expenses,
            "profit": total_revenue - total_expenses,
            "productCount": len(products),
            "lowStockCount": len(low_stock),
            "lowStockItems": [{"name": p["name"], "qty": p["stockQuantity"]} for p in low_stock],
            "pendingOrdersCount": len(pending_orders),
            "summary": f"Business has KES {total_revenue:,.0f} in revenue and KES {total_expenses:,.0f} in expenses. "
                       f"{len(low_stock)} items are low on stock.",
        }


# Module-level singleton
db_service = DatabaseService()
