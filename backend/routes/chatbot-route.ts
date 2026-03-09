import { Router, type Request, type Response } from 'express';
import { ChatbotAgent } from '../chatbot/agent.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const agent = new ChatbotAgent();

// Initialize the agent once
let isInitialized = false;
const initializeAgent = async () => {
  if (!isInitialized) {
    await agent.initialize();
    isInitialized = true;
  }
};

/**
 * @route POST /api/chatbot/chat
 * @desc Send a message to the AI assistant
 * @access Public (or add auth middleware if needed)
 */
router.post('/chatbot/chat', asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  await initializeAgent();

  try {
    const response = await agent.chat(message, history || []);
    res.json({ 
      response,
      history: [
        ...(history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      ]
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat message', details: error.message });
  }
}));

export default router;
