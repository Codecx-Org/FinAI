# FinAI - All-in-One Mobile Business Management & AI Assistant

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

Set your live backend URL only in the **Render dashboard** and **EAS secrets** — do not commit production URLs or credentials to this repository.

### Render build and start commands

**Root directory:** `backend`

**Build command** (use `&&`, not spaces — avoid `bun install bunx prisma generate`, which installs Prisma 7):

```bash
bun install && bunx prisma@6.16.3 generate
```

**Start command:**

```bash
bunx prisma@6.16.3 migrate deploy && bun start
```

Alternative using locked `node_modules` Prisma (see [`backend/package.json`](backend/package.json) scripts):

```bash
# Build: bun install
# Start: bun run db:migrate:deploy && bun start
```

Optional: apply [`render.yaml`](render.yaml) as a Render Blueprint for the same commands.

### Render environment variables

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Postgres connection for the running app |
| `DIRECT_URL` | Same **external** Postgres URL for `prisma migrate deploy` (required by schema) |
| `JWT_SECRET` | Auth token signing |
| `REDIS_URL` | BullMQ / Redis subscriber |
| `PORT` | Set by Render (usually `10000`) |

**Render Postgres:** use the **External** connection string (hostname like `dpg-....frankfurt-postgres.render.com`) for both `DATABASE_URL` and `DIRECT_URL`. Do not use the internal `dpg-...-a` host outside Render’s private network.

**Supabase:** use the pooler URL for `DATABASE_URL` and `db.<ref>.supabase.co:5432` for `DIRECT_URL`.

### Expo mobile (production builds)

**Pre-APK checklist:** [`docs/PRE_APK_CHECKLIST.md`](docs/PRE_APK_CHECKLIST.md)

EAS profiles are in [`mobile/eas.json`](mobile/eas.json). Set secrets in the [Expo dashboard](https://expo.dev) (preview + production), or use a gitignored `mobile/.env` before building:

```bash
EXPO_PUBLIC_API_URL=https://your-render-service.onrender.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GEMINI_KEY=...
```

See [`mobile/.env.example`](mobile/.env.example). Rebuild after any `EXPO_PUBLIC_*` change.

**Build test APK:**

```bash
cd mobile
npm install
eas login
eas build --platform android --profile preview
```

### Post-deploy smoke checks

```powershell
$env:API_HOST = "https://your-render-service.onrender.com"
$env:SMOKE_EMAIL = "demo1@bizsawa.com"
$env:SMOKE_PASSWORD = "password123"
.\scripts\smoke-production.ps1
```

Or bash: `API_HOST=... SMOKE_EMAIL=... SMOKE_PASSWORD=... ./scripts/smoke-production.sh`

### Render cron (cold start)

Set `KEEPALIVE_URL` to `https://your-render-service.onrender.com/api/public/health` on the cron service in [`render.yaml`](render.yaml), or create a Cron Job in the Render dashboard with the same URL every 5–10 minutes.

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
