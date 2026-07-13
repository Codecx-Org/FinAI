"""WhatsApp tools for the LangGraph agent."""
import json
import httpx
from langchain_core.tools import tool
from app.services.database import db_service
from app.config import get_settings
import asyncio

settings = get_settings()


@tool
async def whatsapp_send_text(to: str, text: str) -> str:
    """
    Send a text message to a WhatsApp number.
    'to' should be a Kenyan phone number like 0712345678.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.whatsapp_internal_url}/send-text",
                json={"to": to, "text": text},
            )
            return json.dumps(response.json())
    except Exception as e:
        return f"Error sending WhatsApp message: {str(e)}"


@tool
async def whatsapp_send_media(to: str, image_url: str, caption: str = "") -> str:
    """
    Send an image/media message to a WhatsApp number.
    'image_url' can be a public HTTP URL or a local file path.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.whatsapp_internal_url}/send-media",
                json={"to": to, "imageUrl": image_url, "caption": caption},
            )
            return json.dumps(response.json())
    except Exception as e:
        return f"Error sending WhatsApp media: {str(e)}"


@tool
async def whatsapp_broadcast_advert(
    business_id: int,
    text: str,
    image_url: str | None = None,
    customer_ids: list[int] | None = None,
) -> str:
    """
    Broadcast an advertisement to all or specific customers via WhatsApp.
    Has a built-in 2-second delay between messages to avoid spam detection.
    customer_ids: optional list of specific customer IDs. If omitted, sends to all customers.
    """
    customers = await db_service.get_all_customers(business_id)

    if customer_ids:
        targets = [c for c in customers if c["id"] in customer_ids]
    else:
        targets = customers

    results = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for customer in targets:
            phone = customer.get("phone")
            if not phone:
                results.append({"id": customer["id"], "success": False, "reason": "no phone"})
                continue
            try:
                if image_url:
                    await client.post(
                        f"{settings.whatsapp_internal_url}/send-media",
                        json={"to": phone, "imageUrl": image_url, "caption": text},
                    )
                else:
                    await client.post(
                        f"{settings.whatsapp_internal_url}/send-text",
                        json={"to": phone, "text": text},
                    )
                results.append({"id": customer["id"], "name": customer["name"], "success": True})
            except Exception as e:
                results.append({"id": customer["id"], "success": False, "error": str(e)})
            await asyncio.sleep(2)  # Rate limiting delay

    sent = sum(1 for r in results if r["success"])
    return json.dumps({"broadcastCount": sent, "total": len(targets), "details": results})
