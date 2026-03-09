# Chatbot Architecture

## Overview
The chatbot system is built on a modular architecture that separates the AI logic, the tool protocol, and the business logic.

## Components

### 1. LLM Layer (OpenRouter)
- Provides the reasoning engine.
- Accessed via LangChain's OpenAI-compatible interface.
- Models: e.g., `anthropic/claude-3-opus`, `google/gemini-pro-1.5`, etc.

### 2. Orchestration Layer (LangChain)
- **Agent**: Manages the conversation flow and decides which tools to call.
- **Memory**: Stores conversation history for context-aware interactions.
- **Toolbox**: A collection of tools derived from the MCP server.

### 3. Protocol Layer (MCP Server)
- **Model Context Protocol (MCP)**: Acts as a standardized interface between the LLM and the local services.
- **MCP Tools**: High-level functions exposed to the LLM, mapped to internal services.

### 4. Service Layer (Business Logic)
- **Services**: Existing TypeScript classes (`OrderService`, `ProductService`, etc.) that interact with the database via Prisma.
- **Database**: PostgreSQL (Prisma) for persistent storage.
- **Event Bus**: Redis for event-driven updates (e.g., payment confirmations).

## Data Flow
1. **User Input**: User sends a request (e.g., "Show me all orders from yesterday").
2. **Agent Reasoning**: LangChain sends the request + tool definitions to OpenRouter.
3. **Tool Call**: OpenRouter responds with a tool call (e.g., `list_orders({ date: '2023-10-26' })`).
4. **MCP Execution**: The MCP server receives the call, invokes `OrderService.getAllOrders()`, and filters the results.
5. **Observation**: The tool result is sent back to the LLM.
6. **Final Response**: The LLM synthesizes the data into a natural language response for the user.

## Security
- API Keys managed via environment variables.
- MCP Server runs in the local environment, ensuring database credentials are never exposed to the LLM provider.
