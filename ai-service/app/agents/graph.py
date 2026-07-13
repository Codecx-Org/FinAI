"""
FinAI LangGraph Agent — Core Definition

Uses Google Gemini 2.0 Flash via langchain-google-genai.
The agent is a ReAct agent (Reason + Act) built with LangGraph's prebuilt
create_react_agent, with all business tools injected.

Architecture:
  User message → Gemini 2.0 Flash → Tool call → DB/API → Gemini → Response

LangSmith tracing is enabled when LANGCHAIN_TRACING_V2=true in .env.
"""
import os
from datetime import datetime
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent

from app.config import get_settings
from app.tools.products import get_all_products, get_product, create_product
from app.tools.customers import get_all_customers, get_customer, create_customer
from app.tools.orders import get_all_orders, get_order, create_order
from app.tools.sales import get_all_sales, create_sale
from app.tools.expenses import get_all_expenses, create_expense
from app.tools.payments import initiate_payment, check_payment_status
from app.tools.whatsapp import whatsapp_send_text, whatsapp_send_media, whatsapp_broadcast_advert
from app.tools.business import get_business_summary, get_business_info

settings = get_settings()

# Enable LangSmith tracing if configured
if settings.langchain_tracing_v2.lower() == "true" and settings.langchain_api_key:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project

SYSTEM_PROMPT_TEMPLATE = """
You are Fin-AI, a smart business assistant for Kenyan small business owners.
You help manage products, customers, orders, expenses, and payments.
You speak in Swahili or English based on the user's preference.

## YOUR PERSONALITY
- Friendly, direct, and helpful — like a trusted business advisor
- Keep answers short and practical
- Use simple language, no jargon
- Always confirm before taking destructive actions
- Format lists with bullet points (•), never with tables

## CRITICAL RULES
1. ALWAYS call the appropriate tool — never make up data
2. ALWAYS confirm before creating products, customers, orders, or initiating payments
3. Show IDs when creating records (e.g., "Product ID: 5")
4. Calculate and show profit margins when adding products
5. For M-Pesa payments, validate phone format: 07XXXXXXXX or 01XXXXXXXX (10 digits)
6. If a tool fails, explain the error and suggest an alternative

## LANGUAGE
- Current language preference: {language}
- If language is "sw", respond entirely in Kiswahili
- If language is "en", respond in English

## CONTEXT
- Business ID: {business_id}
- Today: {current_date}
- Timezone: Africa/Nairobi (EAT, UTC+3)

## AVAILABLE TOOLS
Products: get_all_products, get_product, create_product
Customers: get_all_customers, get_customer, create_customer
Orders: get_all_orders, get_order, create_order
Sales: get_all_sales, create_sale
Expenses: get_all_expenses, create_expense
Payments: initiate_payment, check_payment_status
WhatsApp: whatsapp_send_text, whatsapp_send_media, whatsapp_broadcast_advert
Reports: get_business_summary, get_business_info

## STANDARD WORKFLOWS

### New Sale (End-to-End)
1. Check customer exists → get_all_customers. If not → create_customer
2. Check product → get_all_products or get_product
3. Create order → create_order (status: "created")
4. Initiate payment → initiate_payment with customer phone
5. Check payment → check_payment_status after 30-60 seconds
6. On success → create_sale

### Add Product
1. Ask: name, selling price, buying price, stock quantity
2. Compute profit margin and confirm with user
3. Create → create_product

Remember: You're helping a Kenyan business owner run a smarter business!
""".strip()


def build_system_prompt(business_id: int, language: str = "en") -> str:
    current_date = datetime.now().strftime("%A, %B %d, %Y")
    return SYSTEM_PROMPT_TEMPLATE.format(
        business_id=business_id,
        language="Kiswahili" if language == "sw" else "English",
        current_date=current_date,
    )


def get_all_tools():
    return [
        get_all_products,
        get_product,
        create_product,
        get_all_customers,
        get_customer,
        create_customer,
        get_all_orders,
        get_order,
        create_order,
        get_all_sales,
        create_sale,
        get_all_expenses,
        create_expense,
        initiate_payment,
        check_payment_status,
        whatsapp_send_text,
        whatsapp_send_media,
        whatsapp_broadcast_advert,
        get_business_summary,
        get_business_info,
    ]


@lru_cache(maxsize=1)
def get_llm():
    """
    Returns Gemini 2.0 Flash — cached after first call.
    Model choice rationale:
    - Best Swahili support of any frontier model
    - 1M token context window (entire business history fits)
    - Fastest inference (~500ms) — critical for mobile UX
    - Most cost-effective for Kenyan startup budget
    """
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.3,
        max_retries=3,
    )


def build_agent(business_id: int, language: str = "en"):
    """
    Build a stateless ReAct agent for a specific business context.
    The agent is rebuilt per request — state lives in Redis, not the agent.
    """
    llm = get_llm()
    tools = get_all_tools()
    system_prompt = build_system_prompt(business_id, language)

    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=SystemMessage(content=system_prompt),
    )
