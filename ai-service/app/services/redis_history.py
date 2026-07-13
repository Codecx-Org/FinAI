"""
Redis-backed conversation history manager.

Each business gets a conversation history stored as a Redis list:
  Key: finai:conversation:{businessId}
  TTL: CONVERSATION_TTL_SECONDS (default 30 min, reset on every message)

Format per entry: {"role": "user"|"assistant", "content": "..."}
"""
import json
import redis.asyncio as aioredis
from typing import Any
from app.config import get_settings

settings = get_settings()


class ConversationHistory:
    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    def _key(self, business_id: int) -> str:
        return f"finai:conversation:{business_id}"

    async def get_history(self, business_id: int) -> list[dict[str, str]]:
        """Return the conversation history for a business."""
        redis = await self.get_redis()
        raw = await redis.lrange(self._key(business_id), 0, -1)
        return [json.loads(entry) for entry in raw]

    async def append(self, business_id: int, role: str, content: str) -> None:
        """Append a message and reset the TTL."""
        redis = await self.get_redis()
        key = self._key(business_id)
        entry = json.dumps({"role": role, "content": content})
        await redis.rpush(key, entry)

        # Keep last 40 entries (20 turns)
        length = await redis.llen(key)
        if length > 40:
            await redis.ltrim(key, -40, -1)

        # Reset TTL on each interaction
        await redis.expire(key, settings.conversation_ttl_seconds)

    async def clear(self, business_id: int) -> bool:
        """Delete the history for a business. Returns True if key existed."""
        redis = await self.get_redis()
        result = await redis.delete(self._key(business_id))
        return result > 0

    async def set_history(self, business_id: int, history: list[dict[str, str]]) -> None:
        """Replace the full history (used when syncing from request body)."""
        redis = await self.get_redis()
        key = self._key(business_id)
        await redis.delete(key)
        if history:
            entries = [json.dumps(entry) for entry in history]
            await redis.rpush(key, *entries)
            await redis.expire(key, settings.conversation_ttl_seconds)

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()


# Module-level singleton
conversation_history = ConversationHistory()
