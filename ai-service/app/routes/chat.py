"""
Chat route — POST /chat
Handles user messages, manages Redis conversation history, and calls the LangGraph agent.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage

from app.agents.graph import build_agent
from app.services.redis_history import conversation_history

router = APIRouter()


class ChatRequest(BaseModel):
    business_id: int
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[dict] = []
    language: str = "en"


class ChatResponse(BaseModel):
    success: bool
    response: str
    business_id: int
    language: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Send a message to the AI agent and get a response.
    Conversation history is persisted in Redis with a 30-minute TTL.
    """
    try:
        # Sync history from request to Redis (in case client sends history)
        if req.history:
            await conversation_history.set_history(req.business_id, req.history)

        # Load history from Redis
        history = await conversation_history.get_history(req.business_id)

        # Build messages for the agent
        messages = []
        for entry in history:
            if entry["role"] == "user":
                messages.append(HumanMessage(content=entry["content"]))
            elif entry["role"] == "assistant":
                messages.append(AIMessage(content=entry["content"]))

        messages.append(HumanMessage(content=req.message))

        # Build and invoke the agent
        agent = build_agent(req.business_id, req.language)
        result = await agent.ainvoke({"messages": messages})

        last_message = result["messages"][-1]
        response_text = last_message.content

        # Ensure it's a string
        if isinstance(response_text, list):
            response_text = " ".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in response_text
            )

        # Persist new messages to Redis
        await conversation_history.append(req.business_id, "user", req.message)
        await conversation_history.append(req.business_id, "assistant", str(response_text))

        return ChatResponse(
            success=True,
            response=str(response_text),
            business_id=req.business_id,
            language=req.language,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@router.post("/clear-history")
async def clear_history(payload: dict):
    """Clear the Redis conversation history for a business."""
    business_id = payload.get("businessId") or payload.get("business_id")
    if not business_id:
        raise HTTPException(status_code=400, detail="businessId required")
    cleared = await conversation_history.clear(int(business_id))
    return {"success": True, "cleared": cleared, "businessId": business_id}
