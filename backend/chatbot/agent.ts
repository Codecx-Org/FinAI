import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOpenAI } from "@langchain/openai";
import {AIMessage, createAgent, HumanMessage, tool} from 'langchain'
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

  async chat(input: string, chatHistory: any[] = []) {
    const messages = [
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
}
