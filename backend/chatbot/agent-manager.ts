import { ChatbotAgent } from '../chatbot/agent.js';
import { redisService } from './redis-service.js';

const AGENT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CachedAgent {
  agent: ChatbotAgent;
  lastUsed: number;
  evictionTimer: ReturnType<typeof setTimeout>;
}

// In-process cache with TTL eviction
const agentCache = new Map<number, CachedAgent>();

function scheduleEviction(businessId: number) {
  return setTimeout(async () => {
    const cached = agentCache.get(businessId);
    if (cached) {
      console.log(`[AgentManager] Evicting idle agent for business ${businessId}`);
      await cached.agent.close();
      agentCache.delete(businessId);
      // Signal to Redis that this worker no longer holds the agent
      await redisService.del(`agent:active:${businessId}`);
    }
  }, AGENT_TTL_MS);
}

/**
 * Get or create a ChatbotAgent for a specific business.
 * - Resets the 30-minute TTL eviction timer on every access.
 * - Closes the MCP subprocess on eviction to prevent resource leaks.
 */
export const getAgentForBusiness = async (businessId: number): Promise<ChatbotAgent> => {
  if (agentCache.has(businessId)) {
    const cached = agentCache.get(businessId)!;
    // Reset TTL on access
    clearTimeout(cached.evictionTimer);
    cached.evictionTimer = scheduleEviction(businessId);
    cached.lastUsed = Date.now();
    console.log(`[AgentManager] Using cached agent for business ${businessId}`);
    return cached.agent;
  }

  console.log(`[AgentManager] Creating new agent for business ${businessId}`);
  const agent = new ChatbotAgent();
  await agent.setBusinessContext(businessId);
  await agent.initialize();

  const entry: CachedAgent = {
    agent,
    lastUsed: Date.now(),
    evictionTimer: scheduleEviction(businessId),
  };
  agentCache.set(businessId, entry);

  // Mark agent as active in Redis (for cluster awareness)
  await redisService.set(`agent:active:${businessId}`, String(process.pid), 'EX', Math.floor(AGENT_TTL_MS / 1000) + 60);

  console.log(`[AgentManager] Agent created and cached for business ${businessId}`);
  return agent;
};

/**
 * Explicitly evict an agent, closing its MCP subprocess.
 */
export const clearAgentCache = async (businessId: number): Promise<boolean> => {
  const cached = agentCache.get(businessId);
  if (!cached) return false;

  clearTimeout(cached.evictionTimer);
  await cached.agent.close();
  agentCache.delete(businessId);
  await redisService.del(`agent:active:${businessId}`);
  console.log(`[AgentManager] Manually evicted agent for business ${businessId}`);
  return true;
};

export const hasCachedAgent = (businessId: number): boolean => agentCache.has(businessId);

export const getCacheStats = () => ({
  count: agentCache.size,
  businesses: Array.from(agentCache.keys()),
  entries: Array.from(agentCache.entries()).map(([id, entry]) => ({
    businessId: id,
    idleMs: Date.now() - entry.lastUsed,
  })),
});
