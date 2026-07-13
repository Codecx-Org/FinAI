# FinAI — AI-Powered Business Assistant for Kenyan SMEs

FinAI helps small business owners in Kenya manage products, customers, orders, payments, and expenses through a conversational AI interface — available in English and Kiswahili.

---

## Architecture

```
Mobile App (React Native / TypeScript)
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│    Core API  (Fastify / TypeScript) │  :3000
│    /api/*  — all business routes    │
└──────────────────┬──────────────────┘
                   │ HTTP (internal)
         ┌─────────▼──────────┐
         │  AI Service        │  :8000
         │  (FastAPI/Python)  │
         │  LangGraph +       │
         │  Gemini 2.0 Flash  │
         └─────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
PostgreSQL      Redis          WhatsApp
(Prisma ORM)  (BullMQ +      Service :3001
               History)
```

### Services
| Service | Language | Framework | Port |
|---|---|---|---|
| Core API | TypeScript | Fastify 5 | 3000 |
| AI Service | Python | FastAPI + LangGraph | 8000 |
| WhatsApp | TypeScript | WPPConnect | 3001 |

---

## AI Model: Google Gemini 2.0 Flash

**Why Gemini 2.0 Flash?**
- Best Swahili support of any frontier model
- 1M token context window
- ~500ms median latency (critical for mobile)
- 10x cheaper than GPT-4o

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) ≥ 1.0
- Python 3.12+
- Docker (for local Postgres + Redis)
- [PM2](https://pm2.keymetrics.io/) for process management

### 1. Start Infrastructure
```bash
docker-compose up -d
# Starts PostgreSQL :5432 and Redis :6379
```

### 2. Set Up Environment Variables
```bash
# Root reference
cp .env.example .env  # then fill in values

# Core API
cp backend/.env.example backend/.env

# AI Service
cp ai-service/.env.example ai-service/.env
```

**Required keys:**
| Key | Where to get |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) (free tier) |
| `JWT_SECRET` | `openssl rand -hex 64` |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `MPESA_CONSUMER_KEY` | [developer.safaricom.co.ke](https://developer.safaricom.co.ke) |
| `MPESA_CALLBACK_URL` | Public HTTPS URL for M-Pesa webhooks |
| `LANGSMITH_API_KEY` | [smith.langchain.com](https://smith.langchain.com) (optional) |

### 3. Set Up the Database
```bash
cd backend
bun run db:migrate:deploy
bun run seed  # optional test data
```

### 4. Set Up Python AI Service
```bash
cd ai-service
python -m venv .venv
.venv/Scripts/activate  # Windows
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 5. Start All Services
```bash
# Option A: PM2 (recommended — auto-restart on crash)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs

# Option B: Manual (3 separate terminals)
# Terminal 1:
cd backend && bun run src/server.ts

# Terminal 2:
cd ai-service && .venv/Scripts/activate && uvicorn app.main:app --reload

# Terminal 3 (optional — WhatsApp integration):
cd backend && bun run chatbot/whatsapp-service.ts
```

---

## API Reference

### Core API (`:3000`)

#### Auth (Public)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new business |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/google` | Google OAuth login |

#### Protected (Bearer token required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products |
| `POST` | `/api/products` | Add product |
| `GET` | `/api/customers` | List customers |
| `POST` | `/api/customers` | Add customer |
| `GET` | `/api/orders` | List orders |
| `POST` | `/api/orders` | Create order |
| `GET` | `/api/sales` | List sales |
| `POST` | `/api/sales` | Record sale |
| `GET` | `/api/expenses` | List expenses |
| `POST` | `/api/expenses` | Add expense |
| `POST` | `/api/payments/initiate` | M-Pesa STK Push |
| `GET` | `/api/analytics/dashboard` | Analytics bundle |
| `GET` | `/api/credit/trust-preview` | Credit score |
| `POST` | `/api/chatbot/chat` | Chat with AI |
| `GET` | `/api/chatbot/insights` | AI insights |

#### Public
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Core API health |
| `POST` | `/api/webhook/mpesa` | M-Pesa callback |

### AI Service (`:8000`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | AI service health + model info |
| `POST` | `/chat` | Chat with Gemini agent |
| `GET` | `/insights?business_id=N` | Business health insights |
| `GET` | `/analytics-insights?business_id=N` | Deep strategic analysis |
| `POST` | `/clear-history` | Clear conversation history |
| `GET` | `/docs` | Interactive API docs (Swagger) |

---

## Process Management (PM2)

```bash
pm2 start ecosystem.config.js    # Start all services
pm2 status                        # View running processes
pm2 logs finai-core-api           # Tail Core API logs
pm2 logs finai-ai-service         # Tail AI service logs
pm2 restart all                   # Restart everything
pm2 save && pm2 startup           # Auto-start on reboot
pm2 monit                         # Live monitoring dashboard
```

---

## Local M-Pesa Testing

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Set in backend/.env:
MPESA_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok.io/api/webhook/mpesa
```

---

## Project Structure

```
FinAI/
├── backend/                # TypeScript — Fastify Core API
│   ├── src/
│   │   ├── routes/         # Domain-separated route modules
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   ├── sales/
│   │   │   ├── expenses/
│   │   │   ├── payments/
│   │   │   ├── analytics/
│   │   │   ├── credit/
│   │   │   └── chatbot/    # Proxy to AI service
│   │   └── server.ts
│   ├── chatbot/            # MCP-based agent (legacy, kept for WhatsApp)
│   ├── services/           # Business logic services
│   ├── routes/             # Legacy Express routes (kept for reference)
│   └── prisma/             # Database schema
│
├── ai-service/             # Python — FastAPI + LangGraph
│   ├── app/
│   │   ├── agents/         # LangGraph agent definition
│   │   ├── tools/          # Tool functions (products, orders, etc.)
│   │   ├── services/       # Redis + Database services
│   │   └── routes/         # FastAPI endpoints
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/               # React web app
├── mobile/                 # React Native mobile app
├── docker-compose.yml      # Local dev stack (Postgres + Redis)
├── ecosystem.config.js     # PM2 process manager config
└── .env.example            # All environment variables documented
```
