import { ChatbotAgent } from './agent.js';

// Cache agent instances per business
const agentCache = new Map<number, ChatbotAgent>();

/**
 * Get or create a chatbot agent for a specific business
 */
export const getAgentForBusiness = async (businessId: number): Promise<ChatbotAgent> => {
  if (!agentCache.has(businessId)) {
    console.log(`[CHATBOT] Creating new agent for business ${businessId}`);
    const agent = new ChatbotAgent();
    
    await agent.setBusinessContext(businessId);
    await agent.initialize();
    
    agentCache.set(businessId, agent);
    console.log(`[CHATBOT] Agent created and cached for business ${businessId}`);
  } else {
    console.log(`[CHATBOT] Using cached agent for business ${businessId}`);
  }
  
  return agentCache.get(businessId)!;
};

export const clearAgentCache = (businessId: number) => {
    if (agentCache.has(businessId)) {
        agentCache.delete(businessId);
        return true;
    }
    return false;
};

export const hasCachedAgent = (businessId: number) => agentCache.has(businessId);
