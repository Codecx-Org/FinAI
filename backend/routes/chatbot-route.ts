// routes/chatbot-route.ts
import { Router, type Response } from 'express';
import { ChatbotAgent } from '../chatbot/agent.js';
import { getAgentForBusiness, clearAgentCache, hasCachedAgent } from '../chatbot/agent-manager.js';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate } from '../utils/auth-middleware.js';
import type { AuthenticatedRequest } from '../utils/auth-middleware.js';
const router = Router();

/**
 * @route POST /api/chatbot/chat
 * @desc Send a message to the AI assistant
 */
router.post('/chatbot/chat', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { message, history = [], language = 'en' } = req.body;
  const businessId = req.user?.id;

  // Validate request
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Message is required',
      details: 'Please provide a non-empty message string'
    });
  }

  if (!businessId) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Missing business context',
      details: 'Authentication failed or business ID not found'
    });
  }

  if (!Array.isArray(history)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid history format',
      details: 'History must be an array of messages'
    });
  }

  try {
    const agent = await getAgentForBusiness(businessId);
    const response = await agent.chat(message, history, businessId, language);
    
    return res.json({
      success: true,
      response,
      businessId,
      history: [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      ]
    });
    
  } catch (error: any) {
    console.error(`[CHATBOT] Error for business ${businessId}:`, error);
    
    if (error.message === 'Business context not set. Please log in first.') {
      return res.status(401).json({ 
        success: false,
        error: 'Business context not initialized',
        details: 'Please re-authenticate and try again'
      });
    }
    
    if (error.message.includes('tool') || error.message.includes('MCP') || error.message.includes('server')) {
      return res.status(503).json({
        success: false,
        error: 'Chatbot service temporarily unavailable',
        details: 'Unable to access business data. Please try again later.'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * @route GET /api/chatbot/insights
 * @desc Get AI-generated business insights and summaries
 */
router.get('/chatbot/insights', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = Number(req.query.businessId) || req.user?.id;
  
  if (!businessId) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Missing business context' 
    });
  }

  try {
    const agent = await getAgentForBusiness(businessId);
    const insights = await agent.getInsights(businessId);
    
    return res.json(insights);
  } catch (error: any) {
    console.error(`[CHATBOT] Error generating insights for business ${businessId}:`, error);
    
    // Fallback in case of LLM error
    return res.status(503).json({
      success: false,
      error: 'Insights temporarily unavailable',
      details: error.message
    });
  }
}));

/**
 * @route POST /api/chatbot/clear-cache
 * @desc Clear the agent cache for the authenticated business
 */
router.post('/chatbot/clear-cache', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  
  if (businessId && clearAgentCache(businessId)) {
    console.log(`[CHATBOT] Cleared cache for business ${businessId}`);
    return res.json({ 
      success: true, 
      message: 'Chatbot cache cleared successfully',
      businessId
    });
  }
  
  return res.json({ 
    success: true, 
    message: 'No cache found for this business',
    businessId
  });
}));

/**
 * @route GET /api/chatbot/health
 * @desc Check if chatbot is operational
 */
router.get('/chatbot/health', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  
  if (!businessId) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }
  
  try {
    await getAgentForBusiness(businessId);
    
    return res.json({
      success: true,
      status: 'healthy',
      businessId,
      cached: hasCachedAgent(businessId),
      message: 'Chatbot is ready'
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      businessId,
      error: error.message,
      message: 'Chatbot service is unavailable'
    });
  }
}));

/**
 * @route GET /api/chatbot/me
 * @desc Get current business info from token
 */
router.get('/chatbot/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.user?.id;
  const email = req.user?.email;
  
  return res.json({
    success: true,
    business: {
      id: businessId,
      email: email
    },
    message: 'Authenticated successfully'
  });
}));

export default router;