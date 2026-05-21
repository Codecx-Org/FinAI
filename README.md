# FinAI - All-in-One Business Management & AI Assistant

FinAI is a comprehensive, multi-tenant platform designed to empower micro-entrepreneurs with AI-driven financial insights, automated order management, and seamless payment integrations.

---

## Key Features

- **AI Financial Coach**: Get real-time insights into your business health using our LangChain-powered assistant with Model Context Protocol (MCP) integration.
- **Automated Payments**: Seamless M-Pesa STK Push integration for instant, verifiable sales and automated reconciliation.
- **WhatsApp Order Capture**: Automatically capture orders from WhatsApp messages using Twilio and AI-driven keyword extraction.
- **Inventory & Sales Tracking**: Real-time stock management with background inventory updates and comprehensive sales logging.
- **AI Marketing Tools**: Generate stunning product images and social media content directly within the app using Pollinations AI.
- **Business Insights**: Detailed analytics on sales trends, expenses, and overall financial health.
- **Multi-Tenancy**: Secure, isolated data management for multiple businesses on a single platform.

---

## Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL |
| **Mobile** | React Native, Expo, NativeWind (Tailwind), TanStack Query |
| **Frontend** | React, Vite, Tailwind CSS |
| **Infrastructure** | Redis, BullMQ (Background Workers), Docker |
| **AI/LLM** | LangChain, Model Context Protocol (MCP), Pollinations AI |

---

## Project Structure

```text
├── backend/                # Express API, Database logic, and AI Agent
│   ├── chatbot/            # AI Agent logic, MCP server, and prompts
│   ├── prisma/             # Database schema and migrations
│   ├── services/           # Business logic layer
│   ├── workflows/          # BullMQ background workers
│   └── main.ts             # Backend entry point
├── mobile/                 # React Native (Expo) Mobile Application
│   ├── app/                # Expo Router screens (Dashboard, Sales, AI Coach)
│   ├── components/         # Reusable UI components
│   └── contexts/           # Global state (Auth, Business context)
├── frontend/               # React (Vite) Web Management Dashboard
└── ...
```

---

## Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **Bun** (Recommended for backend performance)
- **PostgreSQL** (Running instance)
- **Redis** (Required for background workers)

### 1. Environment Configuration
Navigate to both `backend/` and `mobile/` directories and set up your environment files:
```bash
# In backend/
cp .env.example .env
# Update DATABASE_URL, JWT_SECRET, and REDIS_URL

# In mobile/
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your machine's LAN IP
```

### 2. Database Initialization
In the `backend/` directory:
```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Running Services

#### **Redis (Required)**
```bash
# Using Docker (Recommended)
docker run --name final-redis -p 6379:6379 -d redis
```

#### **Backend**
```bash
# In backend/
bun run start  # or npm start
```

#### **Mobile App**
```bash
# In mobile/
npx expo start
```

#### **Frontend**
```bash
# In frontend/
npm install
npm run dev
```

---

## Production (Render)

### Render environment variables

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Supabase **transaction pooler** (port 6543) for runtime app queries |
| `DIRECT_URL` | Direct Postgres (`db.<ref>.supabase.co:5432`) for `prisma migrate deploy` only |
| `JWT_SECRET` | Auth token signing |
| `REDIS_URL` | BullMQ / Redis subscriber |
| `PORT` | Set by Render (usually `10000`) |

Start command (recommended): `bunx prisma migrate deploy && bun start`

### Expo mobile (production builds)

Set in EAS secrets or a local `.env` file (gitignored), not in tracked files:

```bash
EXPO_PUBLIC_API_URL=https://your-render-service.onrender.com
```

See [`mobile/.env.example`](mobile/.env.example). Rebuild the app after changing this value.

### Post-deploy smoke checks

Replace `YOUR_API_HOST` with the host from your Render service URL:

```bash
export API_HOST=https://your-render-service.onrender.com

# Public uptime ping (no auth) — use for Render/cron keep-alive
curl -s "$API_HOST/api/public/health"
curl -s "$API_HOST/health"
curl -s -X POST "$API_HOST/api/auth/login" \
  -H "Content-Type: application/json" -d '{}'
# Expect HTTP 400 with a validation message, not 500
```

### Bun postinstall (build logs)

If Render logs `Blocked 1 postinstall`, run `bun pm untrusted` locally, review the package, and trust only if required for your deployment.

---

## Core API Modules

All backend API requests should be prefixed with `/api`. Ensure `businessId` is included in relevant requests for multi-tenancy.

| Module | Endpoints | Description |
| :--- | :--- | :--- |
| **Business** | `/api/business` | Manage business registration and M-Pesa config. |
| **Customers** | `/api/customers` | Manage customer records per business. |
| **Products** | `/api/products` | Inventory management and AI image generation. |
| **Orders** | `/api/orders` | Sales transactions and M-Pesa STK Push. |
| **Expenses** | `/api/expenses` | Track operational costs and recurring bills. |
| **Chatbot** | `/api/chatbot/chat` | AI-powered financial assistant interface. |

---

## Development Commands

| Task | Command |
| :--- | :--- |
| **Backend Test** | `npm test` |
| **Database Studio** | `npx prisma studio` |
| **Chatbot CLI** | `bun run chatbot` |
| **Seed Data** | `npx prisma db seed` |
| **Mobile Web** | `npx expo start --web` |

---

## Important Notes
- **Asynchronous Processing**: Inventory updates and sales logging are handled by background workers. Allow a few seconds for data to reflect after a successful payment.
- **Error Handling**: The API returns standard JSON errors: `{ "status": "error", "message": "..." }`.
- **Branding**: All components should align with the **FinAI** brand identity.
