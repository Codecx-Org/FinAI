# FinAI Backend API Documentation

Welcome to the FinAI Backend. This document serves as a comprehensive guide for frontend developers to integrate with our multi-tenant business management and AI-powered financial assistant platform.

## 🚀 Architecture Overview

The backend is built with a modern, event-driven, and scalable architecture:

- **Core:** Node.js & Express (TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication/Multi-tenancy:** All core entities are linked to a `Business`. Ensure you include `businessId` in relevant requests.
- **Asynchronous Workflows:** Uses **Redis** and **BullMQ** for long-running tasks like inventory updates and CSV generation.
- **AI Engine:** Integrated Chatbot using LangChain and Model Context Protocol (MCP) to analyze financial data.
- **Integrations:** 
  - **M-Pesa:** Automated STK Push payments linked to orders.
  - **WhatsApp (Twilio):** Automated order capture via WhatsApp messages.

---

## 📁 Project Directory Structure

```text
├── chatbot/                # AI Agent logic, MCP server, and prompts
├── generated/prisma        # Auto-generated Prisma Client
├── prisma/                 # Database schema and migrations
│   └── seed.ts             # Script to populate dummy data
├── routes/                 # Express API routes (Endpoint definitions)
├── services/               # Business logic layer (Service classes)
├── subscribers/            # Redis event listeners (Event-driven logic)
├── utils/                  # Shared utilities (Types, Error handlers, Prisma client)
├── workflows/              # BullMQ background workers and task flows
├── main.ts                 # Entry point: Server setup and route registration
└── package.json            # Scripts and dependencies
```

---

## 🛠 Core API Modules

All base URLs are prefixed with `/api`.

### 1. Business Module
Manages business registration and M-Pesa configuration.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/business` | Register a new business |
| `GET` | `/api/business` | List all businesses |
| `GET` | `/api/business/:id` | Get specific business details |
| `PUT` | `/api/business/:id` | Update business metadata or shortcode |

**Schema (Create):**
```json
{
  "name": "My Shop",
  "mpesaShortcode": "174379",
  "ownerName": "John Doe",
  "ownerEmail": "john@myshop.com",
  "metadata": { "location": "Nairobi" }
}
```

---

### 2. Customers
Manage customers associated with a specific business.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/customers` | Create a customer |
| `GET` | `/api/customers?businessId=1` | List customers for a business |

**Schema (Create):**
```json
{
  "name": "Alice Smith",
  "email": "alice@gmail.com",
  "phone": "254712345678",
  "businessId": 1
}
```

---

### 3. Products
Manage inventory and pricing.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/products` | Add a new product |
| `GET` | `/api/products?businessId=1` | List business products |

**Schema (Create):**
```json
{
  "name": "Smartphone X",
  "stockQuantity": 50,
  "price": 25000,
  "buyingPrice": 18000,
  "businessId": 1
}
```

---

### 4. Orders & Payments
Handles sales transactions and triggers M-Pesa STK Push.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Create an order (Draft/Created) |
| `GET` | `/api/orders?businessId=1` | Fetch order history |
| `POST` | `/api/webhook/mpesa` | Callback for payment status (Internal) |

**Schema (Create Order):**
```json
{
  "customerId": 1,
  "businessId": 1,
  "totalAmount": 5000,
  "status": "created",
  "orderItems": [
    { "productId": 2, "quantity": 1 }
  ]
}
```

**Order Lifecycle:**
1. `created`: Order is initialized.
2. `pending`: M-Pesa STK Push has been sent to the customer.
3. `paid`: Payment received; triggers background **Inventory Update** and **Sales Logging**.
4. `failed`: Payment was declined or timed out.

---

### 5. Expenses
Track business operational costs.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/expenses` | Log an expense |
| `GET` | `/api/expenses?businessId=1` | List expenses |

**Schema (Create):**
```json
{
  "type": "Rent",
  "amount": 15000,
  "description": "Monthly shop rent",
  "isRecurring": true,
  "frequency": "monthly",
  "nextDueDate": "2026-04-01T00:00:00Z",
  "businessId": 1
}
```

---

## 🤖 AI Chatbot Integration

The FinAI assistant can answer questions about sales trends, inventory, and financial health.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chatbot/chat` | Chat with the AI assistant |

**Request Body:**
```json
{
  "message": "What were my top selling products in March?",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help you today?" }
  ]
}
```

**Response Body:**
```json
{
  "response": "Your top selling products were...",
  "history": [...]
}
```

---

## 📱 WhatsApp Order Capture (Webhook)

Integrated with Twilio. When a message is sent to the business WhatsApp number, the system attempts to capture an order automatically based on product keywords.

**Endpoint:** `POST /api/twilio-callback` (Configured in Twilio Console).

---

## 🛠 Development Commands

- **Install Dependencies:** `npm install`
- **Database Migration:** `npx prisma migrate dev`
- **Seed Data (100+ records):** `npx prisma db seed`
- **Start Server:** `npm start`

## ⚠️ Important Notes
- **Multi-tenancy:** Always pass `businessId` when creating or fetching resources to ensure data isolation.
- **Asynchronous Updates:** Inventory and Sales records are processed via background workers. If an order is marked `paid`, wait a few seconds before refreshing inventory to see updates.
- **Error Handling:** Errors return a standard JSON: `{ "status": "error", "message": "Reason for failure" }`.
