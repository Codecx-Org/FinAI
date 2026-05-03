import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOpenAI } from "@langchain/openai";
import {AIMessage, createAgent, HumanMessage, SystemMessage, tool} from 'langchain'
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { SYSTEM_PROMPT } from "./prompt.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));


/**
 * Chatbot Agent class.
 */
export class ChatbotAgent {
  private executor: ReturnType<typeof createAgent> | null = null;
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
    
    // Start the MCP server as a subprocess
    // Using ts-node to run the server file
    const transport = new StdioClientTransport({
      command: "bun",
      args: [
        "run",
        path.join(__dirname, "mcp-server.ts"),
      ],
      env: process.env as any,
    });    
    await this.client.connect(transport);

    // List tools from the MCP server
    const { tools: mcpTools } = await this.client.listTools();

    // Wrap MCP tools for LangChain
    const langchainTools = mcpTools.map((t) =>
  tool(
    async (args: any) => {
      if (!this.businessId) {
        throw new Error("Business context not set. Please log in first.");
      }

      console.log(`[DEBUG] Calling tool: ${t.name} | businessId: ${this.businessId}`);

      
      const response = await this.client.callTool({
        name: t.name,
        arguments: {...args,
    businessId: this.businessId,
  }
      
      }) as any;

      console.log(`[DEBUG] Tool ${t.name} response received`);

      if (response.isError) {
        throw new Error(response.content?.[0]?.text || "Tool failed");
      }
      return response.content.map((c: any) => c.text).join("\n");
    },
    { name: t.name, description: t.description || "", schema: t.inputSchema }
  )
);
    // Initialize the LLM (OpenRouter)
    const llm = new ChatOpenAI({
      model: process.env.CHAT_MODEL || "google/gemini-flash-1.5",
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.5,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
    });

    this.executor = createAgent({
      model: llm,      
      tools: langchainTools,
      systemPrompt: SYSTEM_PROMPT,
    });
    console.log("Chatbot Agent initialized with MCP tools.");
  }

  async chat(input: string, chatHistory: any[] = [], businessId?: number, language: string = 'en') {
    const messages = [
      ...(businessId ? [new SystemMessage({ content: `The user is currently managing Business ID: ${businessId}. Always provide this businessId when calling tools that require it.` })] : []),
      ...(language === 'sw' ? [new SystemMessage({ content: "Please respond in Kiswahili. Keep your response professional yet easy to understand in Kiswahili." })] : []),
      ...chatHistory.map((entry) => {
        return entry.role === "assistant" ? new AIMessage({
          content: entry.content,
        }) : new HumanMessage({
          content: entry.content,
        });
      }),
      new HumanMessage({content: input}),
    ]
    if (!this.executor) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const response = await this.executor.invoke({
     messages 
    });
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

    // First, get the business summary using the tool directly or via agent
    // Since we want structured data, we'll prompt the agent to use the tool and return JSON
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
      messages: [new HumanMessage({ content: prompt })]
    });

    const lastMessage = response.messages[response.messages.length - 1];
    let content = lastMessage.content;

    // Clean up content if it contains markdown code blocks
    if (typeof content === 'string') {
        content = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
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
      Analyze the following business analytics data for Business ID: ${businessId}.
      
      Data: ${JSON.stringify(analyticsData)}
      
      Provide a strategic analysis in JSON format.
      
      You MUST respond with ONLY a valid JSON object.
      The JSON structure MUST be:
      {
        "summary": "A concise executive summary of the performance (1-2 sentences).",
        "trends": [
          {
            "title": "Trend Title",
            "description": "Description of the trend observed",
            "sentiment": "positive" | "negative" | "neutral"
          }
        ],
        "recommendations": [
          {
            "action": "Specific action to take",
            "reason": "Why this action is recommended based on data",
            "priority": "High" | "Medium" | "Low"
          }
        ]
      }
    `;

    const response = await this.executor.invoke({
      messages: [new HumanMessage({ content: prompt })]
    });

    const lastMessage = response.messages[response.messages.length - 1];
    let content = lastMessage.content;

    if (typeof content === 'string') {
        content = content.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    }

    try {
      return JSON.parse(content as string);
    } catch (error) {
      console.error("[CHATBOT] Failed to parse analytics insights JSON:", content);
      throw new Error("Failed to generate analytics insights");
    }
  }
}
