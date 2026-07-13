import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getSystemPrompt } from "./prompt.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Type for the compiled LangGraph agent
type AgentExecutor = ReturnType<typeof createReactAgent>;

/**
 * Chatbot Agent class.
 * Uses LangGraph's createReactAgent with MCP tools via StdioClientTransport.
 */
export class ChatbotAgent {
  private executor: AgentExecutor | null = null;
  private client: Client;
  private businessId: number | null = null;

  constructor() {
    this.client = new Client(
      {
        name: "fin-ai-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async setBusinessContext(businessId: number) {
    if (!businessId || isNaN(businessId)) {
      throw new Error("Invalid business ID");
    }
    this.businessId = Number(businessId);
    console.log(`Business context set to ID: ${this.businessId}`);
  }

  async initialize() {
    if (!this.businessId) {
      throw new Error("Business context not set. Call setBusinessContext() before initialize()");
    }

    // Start the MCP server as a subprocess via bun
    const transport = new StdioClientTransport({
      command: "bun",
      args: [
        "run",
        path.join(__dirname, "mcp-server.ts"),
      ],
      env: process.env as Record<string, string>,
    });

    await this.client.connect(transport);

    // List tools from the MCP server
    const { tools: mcpTools } = await this.client.listTools();

    // Wrap MCP tools for LangGraph — inject businessId on every call
    const langchainTools = mcpTools.map((t) =>
      tool(
        async (args: Record<string, unknown>) => {
          if (!this.businessId) {
            throw new Error("Business context not set. Please log in first.");
          }

          console.log(`[DEBUG] Calling tool: ${t.name} | businessId: ${this.businessId}`);

          const response = await this.client.callTool({
            name: t.name,
            arguments: {
              ...args,
              businessId: this.businessId,
            },
          }) as any;

          console.log(`[DEBUG] Tool ${t.name} response received`);

          if (response.isError) {
            throw new Error(response.content?.[0]?.text || "Tool failed");
          }
          return response.content.map((c: any) => c.text).join("\n");
        },
        {
          name: t.name,
          description: t.description || "",
          schema: z.object({}),  // MCP tools validated server-side; pass-through here
        }
      )
    );

    // Initialize the LLM — OpenRouter with Gemini 2.0 Flash as default
    const llm = new ChatOpenAI({
      model: process.env.CHAT_MODEL || "google/gemini-2.0-flash-exp",
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.3,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
    });

    // createReactAgent from @langchain/langgraph/prebuilt — correct API
    this.executor = createReactAgent({
      llm,
      tools: langchainTools,
      prompt: getSystemPrompt(),
    });

    console.log("[CHATBOT] Agent initialized with MCP tools via LangGraph.");
  }

  async chat(input: string, chatHistory: any[] = [], businessId?: number, language: string = "en") {
    if (!this.executor) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const messages = [
      // Inject businessId reminder as system message
      ...(businessId
        ? [new SystemMessage({
            content: `The user is currently managing Business ID: ${businessId}. Always include this businessId when calling tools that require it.`,
          })]
        : []),
      // Inject language instruction
      ...(language === "sw"
        ? [new SystemMessage({
            content: "Please respond in Kiswahili. Keep your response professional yet easy to understand.",
          })]
        : []),
      // Chat history
      ...chatHistory.map((entry) =>
        entry.role === "assistant"
          ? new AIMessage({ content: entry.content })
          : new HumanMessage({ content: entry.content })
      ),
      new HumanMessage({ content: input }),
    ];

    const response = await this.executor.invoke({ messages });
    const lastMessage = response.messages[response.messages.length - 1];

    if (!lastMessage) {
      throw new Error("No response from agent.");
    }

    return lastMessage.content;
  }

  async getInsights(businessId: number): Promise<any> {
    if (!this.executor) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const prompt = `
      Please provide a business insight report for Business ID: ${businessId}.
      Use the 'get_business_summary' tool to get the latest financial data.
      
      You MUST respond with ONLY a valid JSON object. Do not include any other text, markdown formatting (like \`\`\`json), or explanations.
      
      The JSON structure MUST be:
      {
        "summary": {
          "revenue": number,
          "expenses": number,
          "profit": number
        },
        "insight": "A helpful 1-2 sentence professional summary of the business performance based on the data.",
        "tips": [
          {
            "title": "Short title for the tip",
            "tip": "Actionable advice for the business owner",
            "impact": "High" | "Medium" | "Low"
          }
        ]
      }
      
      Provide at least 3 actionable tips.
    `;

    const response = await this.executor.invoke({
      messages: [new HumanMessage({ content: prompt })],
    });

    const lastMessage = response.messages[response.messages.length - 1];
    let content = lastMessage.content;

    // Strip markdown code fences if present
    if (typeof content === "string") {
      content = content.replace(/```json\n?/, "").replace(/```\n?/, "").trim();
    }

    try {
      return JSON.parse(content as string);
    } catch (error) {
      console.error("[CHATBOT] Failed to parse insights JSON:", content);
      throw new Error("Failed to generate structured insights");
    }
  }

  async getAnalyticsInsights(businessId: number, analyticsData: any): Promise<any> {
    if (!this.executor) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const prompt = `
      Perform a deep strategic analysis for Business ID: ${businessId}.
      
      Business Context: ${JSON.stringify(analyticsData.businessContext)}
      Inventory Snapshot: ${JSON.stringify(analyticsData.inventorySummary)}
      Recent Sales Trends: ${JSON.stringify(analyticsData.recentSalesPerformance)}
      Performance Metrics: ${JSON.stringify({
        weekly: analyticsData.weeklyOverview,
        categories: analyticsData.categoryPerformance,
        profitTrends: analyticsData.monthlyProfitTrends,
      })}
      
      Based on the business type and the data provided:
      1. Analyze if the current inventory levels are optimized for the recent sales volume.
      2. Identify which product categories are the most/least profitable.
      3. Provide growth strategies specific to a business of this type and tenure.
      
      You MUST respond with ONLY a valid JSON object.
      The JSON structure MUST be:
      {
        "summary": "A deep-dive executive summary (2-3 sentences).",
        "trends": [
          {
            "title": "Trend Title",
            "description": "Evidence-based description from the sales/inventory data",
            "sentiment": "positive" | "negative" | "neutral"
          }
        ],
        "recommendations": [
          {
            "action": "Specific action to take",
            "reason": "Data-driven rationale",
            "priority": "High" | "Medium" | "Low"
          }
        ]
      }
    `;

    const response = await this.executor.invoke({
      messages: [new HumanMessage({ content: prompt })],
    });

    const lastMessage = response.messages[response.messages.length - 1];
    let content = lastMessage.content;

    if (typeof content === "string") {
      content = content.replace(/```json\n?/, "").replace(/```\n?/, "").trim();
    }

    try {
      return JSON.parse(content as string);
    } catch (error) {
      console.error("[CHATBOT] Failed to parse analytics insights JSON:", content);
      throw new Error("Failed to generate analytics insights");
    }
  }

  /**
   * Gracefully close the MCP client connection and subprocess.
   */
  async close() {
    try {
      await this.client.close();
      console.log(`[CHATBOT] Agent connection closed for business ${this.businessId}`);
    } catch (err) {
      console.warn("[CHATBOT] Error closing agent client:", err);
    }
  }
}
