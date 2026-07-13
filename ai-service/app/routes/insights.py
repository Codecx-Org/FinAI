"""
Insights routes — AI-generated business analysis endpoints.

GET /insights                - Business health snapshot (revenue, tips)
GET /analytics-insights      - Deep strategic analytics analysis
"""
import json
import re
from fastapi import APIRouter, HTTPException, Query
from langchain_core.messages import HumanMessage

from app.agents.graph import build_agent
from app.services.database import db_service

router = APIRouter()


def strip_json_fences(text: str) -> str:
    """Remove markdown code fences that models sometimes add."""
    return re.sub(r'```(?:json)?\n?', '', text).strip()


@router.get("/insights")
async def get_insights(business_id: int = Query(...)):
    """
    Get AI-generated business insights: revenue summary + actionable tips.
    Uses Gemini 2.0 Flash to analyze real business data.
    """
    try:
        summary = await db_service.get_business_summary(business_id)

        prompt = f"""
Analyze this business data and provide structured insights.
Business Summary: {json.dumps(summary)}

You MUST respond with ONLY a valid JSON object — no markdown, no explanation.
{{
  "summary": {{
    "revenue": {summary['revenue']},
    "expenses": {summary['expenses']},
    "profit": {summary['profit']}
  }},
  "insight": "A helpful 1-2 sentence professional summary of performance.",
  "tips": [
    {{
      "title": "Short tip title",
      "tip": "Specific actionable advice",
      "impact": "High" | "Medium" | "Low"
    }}
  ]
}}
Provide at least 3 tips. Base them on the actual data.
""".strip()

        agent = build_agent(business_id)
        result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
        content = result["messages"][-1].content

        if isinstance(content, list):
            content = " ".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)

        content = strip_json_fences(str(content))
        return json.loads(content)

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned malformed JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights error: {str(e)}")


@router.get("/analytics-insights")
async def get_analytics_insights(business_id: int = Query(...)):
    """
    Deep strategic analytics: trends, category performance, and recommendations.
    """
    try:
        from app.services.database import db_service as db

        # Gather analytics data
        products, sales, expenses, orders = await __import__("asyncio").gather(
            db.get_all_products(business_id),
            db.get_all_sales(business_id),
            db.get_all_expenses(business_id),
            db.get_all_orders(business_id),
        )

        total_revenue = sum(float(s.get("totalAmount", 0)) for s in sales)
        total_expenses = sum(float(e.get("amount", 0)) for e in expenses)
        low_stock = [p for p in products if int(p.get("stockQuantity", 0)) < 5]

        analytics_data = {
            "businessContext": {"businessId": business_id},
            "inventorySummary": {
                "totalProducts": len(products),
                "lowStockCount": len(low_stock),
                "lowStockItems": [p["name"] for p in low_stock],
            },
            "recentSalesPerformance": {
                "totalRevenue": total_revenue,
                "totalSales": len(sales),
                "recentSales": sales[:10],
            },
            "weeklyOverview": {"totalExpenses": total_expenses, "totalOrders": len(orders)},
            "categoryPerformance": {},
            "monthlyProfitTrends": {
                "profit": total_revenue - total_expenses,
                "margin": ((total_revenue - total_expenses) / total_revenue * 100) if total_revenue > 0 else 0,
            },
        }

        prompt = f"""
Perform a deep strategic analysis of this Kenyan small business.
Data: {json.dumps(analytics_data)}

Respond with ONLY a valid JSON object:
{{
  "summary": "Executive summary (2-3 sentences).",
  "trends": [
    {{
      "title": "Trend Title",
      "description": "Evidence-based observation",
      "sentiment": "positive" | "negative" | "neutral"
    }}
  ],
  "recommendations": [
    {{
      "action": "Specific action to take",
      "reason": "Data-driven rationale",
      "priority": "High" | "Medium" | "Low"
    }}
  ]
}}
Provide at least 2 trends and 3 recommendations.
""".strip()

        agent = build_agent(business_id)
        result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
        content = result["messages"][-1].content

        if isinstance(content, list):
            content = " ".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)

        content = strip_json_fences(str(content))
        return json.loads(content)

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned malformed JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics insights error: {str(e)}")
