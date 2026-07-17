# FinAI Project Setup Guide for Nathaneal

Welcome to FinAI! This document will guide you step-by-step to get the entire multi-service ecosystem (Backend, AI Service, Mobile App, Frontend, Database, and Redis) up and running on your local machine.

---

## 🏗️ Architecture Overview

The system runs on the following services:
```
                                 [ Web Frontend (:3000) ]
                                            │
                                            ▼
[ Mobile App (Expo) ] ◄───► [ Backend API (Bun/Fastify) :3001 ] ◄───► [ AI Service (Python) :8000 ]
                                  │                      │
                                  ▼                      ▼
                       [ PostgreSQL :5432 ]       [ Redis :6379 ]
```

---

## 📋 Prerequisites

Please ensure the following tools are installed on your system:

| Tool | Recommended Version | Download / Install Command |
| :--- | :--- | :--- |
| **Bun** | `1.0+` | Windows (PowerShell): `powershell -c "irm bun.sh/install.ps1 \| iex"` <br> macOS/Linux: `curl -fsSL https://bun.sh/install \| bash` |
| **Python** | `3.10` to `3.12` | [Download Python](https://www.python.org/downloads/) (Check "Add Python to PATH" on Windows) |
| **Docker Desktop** | Latest | [Download Docker Desktop](https://www.docker.com/products/docker-desktop) (Required for Database & Redis) |
| **Node.js** | `18+` or `20+` | [Download Node.js](https://nodejs.org/) (Required for Expo & Frontend) |

---

## ⚙️ Step 1: Clone the Repo & Checkout Branch

Clone the repository and switch to the development branch:

```bash
# Clone the repository
git clone https://github.com/Codecx-Org/FinAI.git
cd FinAI

# Checkout to the 'linus' branch
git checkout linus
```

---

## 🐳 Step 2: Spin Up Infrastructure (Docker)

Start the pre-configured PostgreSQL database and Redis cache:

```bash
# Run this from the root directory of the FinAI repository
docker-compose up -d
```

Verify they are successfully running:
```bash
docker ps
# You should see 'finai-postgres' on port 5432 and 'finai-redis' on port 6379.
```

---

## 🔌 Step 3: Configure Environment Variables

Three `.env` files must be populated. You can copy the template or pre-configured `.env` files in their respective folders:

### 3a. Backend Environment (`backend/.env`)
Create or edit `backend/.env`:
```env
PORT=3001
JWT_SECRET=e12cea5dcf7fdb679001ff5f0dfa9cbfc8abec9c7e33d0a6ff5b837f4b8db82cfec8886cca9f802df922dafb883d012145dbd788c1a4fee23fa489680abdd96c
INTERNAL_API_SECRET=e12cea5dcf7fdb679001ff5f0dfa9cbfc8abec9c7e33d0a6ff5b837f4b8db82cfec8886cca9f802df922dafb883d012145dbd788c1a4fee23fa489680abdd96c
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finai?schema=public"
REDIS_URL="redis://localhost:6379"
```

### 3b. AI Service Environment (`ai-service/.env`)
Create or edit `ai-service/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
INTERNAL_API_SECRET=e12cea5dcf7fdb679001ff5f0dfa9cbfc8abec9c7e33d0a6ff5b837f4b8db82cfec8886cca9f802df922dafb883d012145dbd788c1a4fee23fa489680abdd96c
```

### 3c. Mobile App Environment (`mobile/.env`)
Create or edit `mobile/.env`:
```env
# If testing using a physical phone with Expo Go over local network,
# replace localhost with your machine's local IP address (e.g. 192.168.1.100) or ngrok URL.
EXPO_PUBLIC_API_URL="http://localhost:3001/api"
```

---

## 🚀 Step 4: Install & Start Core Services

Open separate terminal windows/panes to run the different services:

### Window 1: Core API Backend
```bash
cd backend
bun install

# Run database migrations
bun run db:migrate:deploy

# (Optional) Seed the database with mock store data
bun run seed

# Start backend server in watch/development mode
bun run dev
# The backend will start on http://localhost:3001
```

### Window 2: AI Service
```bash
cd ai-service

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start AI Server (runs on port 8000)
uvicorn app.main:app --reload --port 8000
```

### Window 3: Web Dashboard / Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Window 4: Mobile App (Expo)
```bash
cd mobile
npm install

# Start metro bundler
npx expo start --clear
```

---

## 📱 Running the Mobile App on Your Device

To run the mobile app on a physical Android or iOS device:
1. Download **Expo Go** from the App Store / Google Play Store.
2. Ensure your phone and computer are connected to the **same Wi-Fi network**.
3. Scan the QR code displayed in the Expo Terminal.
4. **Note**: If your Wi-Fi subnet blocks LAN routing, you can run an `ngrok` tunnel to forward the backend port `3001`:
   ```bash
   ngrok http 3001
   ```
   Then paste the public `ngrok` URL into `mobile/.env` as the value of `EXPO_PUBLIC_API_URL`.

---

## 🧪 Quick Verification Links

Once all services are up, you can verify their status:
- **Backend API Health**: [http://localhost:3001/health](http://localhost:3001/health)
- **AI Service Health**: [http://localhost:8000/health](http://localhost:8000/health)
- **AI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database/Redis**: Runs in the background via Docker.
