import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOpenAI } from "@langchain/openai";
import {createAgent, tool} from 'langchain'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
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

  async initialize() {
    // Start the MCP server as a subprocess
    // Using ts-node to run the server file
    const transport = new StdioClientTransport({
      command: "node",
      args: [
        "--loader",
        "ts-node/esm",
        path.join(__dirname, "mcp-server.ts"),
      ],
      env: process.env as any,
    });

    await this.client.connect(transport);

    // List tools from the MCP server
    const { tools: mcpTools } = await this.client.listTools();

    // Wrap MCP tools for LangChain
    const langchainTools = mcpTools.map(
      (t) => tool( async (args: any) => {
        const response = await this.client.callTool({
          name: t.name,
          arguments: args,
        }) as any;

        if (response.isError) {
          throw new Error(response.content[0].text as any);
        }
        return response.content.map((c: any) => c.text).join("\n");   
      }, { name: t.name, description: t.description || "", schema: t.inputSchema })
    );
    // Initialize the LLM (OpenRouter)
    const llm = new ChatOpenAI({
      modelName: process.env.CHAT_MODEL || "google/gemini-flash-1.5", // Default model
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      temperature: 0.5,
    });

    // Define the prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are Fin-AI, a business operations assistant. You help manage products, customers, and orders using the provided tools. Be concise and professional."],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    
    this.executor = createAgent({
      model: llm,      
      tools: langchainTools,
      systemPrompt: SYSTEM_PROMPT,
    });
    console.log("Chatbot Agent initialized with MCP tools.");
  }

  async chat(input: string, chatHistory: any[] = []) {
    if (!this.executor) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const response = await this.executor.invoke({
      input,
      chatHistory,
    });

    return response.output;
  }
}
