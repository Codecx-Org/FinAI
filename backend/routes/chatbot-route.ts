import { Router, type Request, type Response } from 'express';
import { ChatbotAgent } from '../chatbot/agent.js';
import { asyncHandler } from '../utils/async-handler.js';
import prisma from '../utils/prisma.js';

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

/**
 * @route GET /api/chatbot/insights
 * @desc Get AI-generated business insights based on KPIs
 */
router.get('/chatbot/insights', asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.query.businessId ? Number(req.query.businessId) : undefined;
  
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  // Aggregate KPIs
  const [
    orderCount,
    customerCount,
    totalSales,
    totalExpenses,
    recentSales,
    lowStockProducts
  ] = await Promise.all([
    prisma.order.count({ where: { businessId } }),
    prisma.customer.count({ where: { businessId } }),
    prisma.sales.aggregate({
      where: { businessId },
      _sum: { totalAmount: true }
    }),
    prisma.expenses.aggregate({
      where: { businessId },
      _sum: { amount: true }
    }),
    prisma.sales.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { product: true }
    }),
    prisma.product.findMany({
      where: { businessId, stockQuantity: { lte: 10 } },
      take: 5
    })
  ]);

  const kpis = {
    orders: orderCount,
    customers: customerCount,
    sales: totalSales._sum.totalAmount || 0,
    expenses: totalExpenses._sum.amount || 0,
    recentSales: recentSales.map(s => `${s.product.name} (Qty: ${s.quantity})`),
    lowStock: lowStockProducts.map(p => p.name)
  };

  await initializeAgent();

  const prompt = `
    Generate a concise business insight report for a business owner based on the following KPIs:
    - Total Orders: ${kpis.orders}
    - Total Customers: ${kpis.customers}
    - Total Sales Revenue: KES ${kpis.sales}
    - Total Expenses: KES ${kpis.expenses}
    - Recent Sales: ${kpis.recentSales.join(', ') || 'None'}
    - Low Stock Items: ${kpis.lowStock.join(', ') || 'None'}

    Provide 3 actionable "Growth Tips" and 1 "Aggregated Business Insight".
    Format the response as a JSON object with:
    {
      "tips": [{"title": "...", "tip": "...", "impact": "High/Medium/Low"}],
      "insight": "...",
      "summary": {
        "revenue": ${kpis.sales},
        "expenses": ${kpis.expenses},
        "profit": ${kpis.sales - kpis.expenses}
      }
    }
    Respond ONLY with the JSON object.
  `;

  try {
    const responseText = await agent.chat(prompt, []);
    // Try to parse JSON from response, AI might wrap it in code blocks
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse AI response', raw: responseText };
    
    res.json(insights);
  } catch (error: any) {
    console.error('Insight generation error:', error);
    res.status(500).json({ error: 'Failed to generate insights', details: error.message });
  }
}));

export default router;
