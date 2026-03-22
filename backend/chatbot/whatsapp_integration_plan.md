# WhatsApp-MCP Integration Plan for FinAI

## Goal
Integrate the Fin-AI MCP server with WhatsApp via `wppconnect` to allow business owners to manage operations (orders, sales, inventory, expenses) and send media/advertisements to customers directly through WhatsApp.

---

## 🛠 1. Architecture Design

1.  **WhatsApp Controller (`backend/chatbot/whatsapp-service.ts`)**:
    *   Main entry point for the WhatsApp session.
    *   Initializes `wppconnect` and handles authentication (QR code).
    *   Listens for incoming messages and routes them to the `ChatbotAgent`.
    *   Starts a local HTTP server (e.g., port 3001) for the MCP server to send outgoing messages back to WhatsApp.

2.  **MCP Server Enhancements (`backend/chatbot/mcp-server.ts`)**:
    *   Add tools for WhatsApp actions: `whatsapp_send_text`, `whatsapp_send_media`, `whatsapp_broadcast_advert`.
    *   These tools will use `axios` to communicate with the WhatsApp Controller's local HTTP server.

3.  **Agent Logic (`backend/chatbot/agent.ts`)**:
    *   Map the sender's phone number to a `businessId` using the database.
    *   Provide the `businessId` as context for all tool calls.

---

## 📝 2. Database Changes (Prisma)

Update `backend/prisma/schema.prisma`:
```prisma
model Business {
  ...
  whatsappNumber String? @unique  // Used to identify the business owner on WhatsApp
  ownerPhone     String?           // For general contact
  ...
}
```
*   **Action**: `npx prisma migrate dev --name add_whatsapp_to_business`

---

## 🚀 3. Implementation Steps

### Step 3.1: WhatsApp Service Core
Create `backend/chatbot/whatsapp-service.ts`:
-   Initialize `wppconnect.create()`.
-   Handle `onMessage`:
    1.  Get sender number.
    2.  Find `businessId` in DB.
    3.  Call `agent.chat(message, history, { businessId })`.
    4.  Send agent response back via `client.sendText()`.
-   Setup Express listener for outgoing tool-triggered messages.

### Step 3.2: MCP Server WhatsApp Tools
Add the following tools to `backend/chatbot/mcp-server.ts`:
-   `whatsapp_send_media`: Fetches product/media info and sends it to a contact.
-   `whatsapp_broadcast_advert`: Sends a message + optional image to a list of customer phone numbers.

### Step 3.3: Business Operation Enhancements
-   Add `get_business_summary` tool to `mcp-server.ts` to provide a snapshot of sales, inventory, and expenses.
-   Ensure `list_products` includes `imageUrl` for media sharing.

---

## ⚠️ 4. Potential Bottlenecks & Solutions

1.  **QR Code Auth**:
    *   *Bottleneck*: Scanning QR code in a CLI/Server environment.
    *   *Solution*: `wppconnect` can output QR to terminal or save as base64. We'll ensure it's visible.

2.  **WhatsApp Rate Limits / Banning**:
    *   *Bottleneck*: Automated broadcasting might trigger WhatsApp's spam detection.
    *   *Solution*: Implement a delay (e.g., 2-5 seconds) between messages in a broadcast and limit total messages per hour.

3.  **Context Management**:
    *   *Bottleneck*: Ensuring the agent knows *which* business it's managing based on the WhatsApp number.
    *   *Solution*: Pre-fetch the `Business` record at the start of the chat session and inject the `businessId` into the agent's memory.

4.  **File/Image Handling**:
    *   *Bottleneck*: Sending media requires local file paths or buffers.
    *   *Solution*: Use `axios` to download remote images (from `product.imageUrl`) to a temporary directory before sending via `wppconnect`.

---

## 📅 5. Timeline & Milestones
-   **Day 1**: DB Migration + WhatsApp Service Core (Session Init).
-   **Day 2**: Agent-WhatsApp Bridge + Message Routing.
-   **Day 3**: MCP WhatsApp Tools + Media Sharing implementation.
-   **Day 4**: Testing, Rate Limiting, and Refinement.
