/**
 * PM2 Ecosystem Configuration
 *
 * Manages all FinAI services:
 * 1. Core API  (TypeScript/Fastify) — HTTP server
 * 2. AI Service (Python/FastAPI)    — LLM agent
 * 3. WhatsApp   (TypeScript)        — WhatsApp bridge
 *
 * Usage:
 *   pm2 start ecosystem.config.js         # Start all services
 *   pm2 restart all                        # Restart all
 *   pm2 logs                               # Tail all logs
 *   pm2 monit                              # Live monitoring dashboard
 *   pm2 save && pm2 startup               # Auto-start on system reboot
 */
module.exports = {
  apps: [
    // ─── 1. Core API (Fastify) ───────────────────────────────────────────────
    {
      name: 'finai-core-api',
      script: 'bun',
      args: 'run src/server.ts',
      cwd: './backend',
      instances: process.env.USE_CLUSTER === 'true' ? 'max' : 1,
      exec_mode: process.env.USE_CLUSTER === 'true' ? 'cluster' : 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/core-api-error.log',
      out_file: './logs/core-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Auto-restart on crash with exponential backoff
      autorestart: true,
      restart_delay: 1000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
    },

    // ─── 2. Python AI Service (FastAPI) ─────────────────────────────────────
    {
      name: 'finai-ai-service',
      script: 'python',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload',
      cwd: './ai-service',
      interpreter: 'none',
      watch: false,
      max_memory_restart: '768M',
      env: {
        PYTHONUNBUFFERED: '1',
        AI_SERVICE_PORT: 8000,
      },
      env_production: {
        PYTHONUNBUFFERED: '1',
        AI_SERVICE_PORT: 8000,
      },
      error_file: './logs/ai-service-error.log',
      out_file: './logs/ai-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      restart_delay: 2000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
    },

    // ─── 3. WhatsApp Service ────────────────────────────────────────────────
    {
      name: 'finai-whatsapp',
      script: 'bun',
      args: 'run chatbot/whatsapp-service.ts',
      cwd: './backend',
      instances: 1, // WhatsApp sessions must be single-instance
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '384M',
      env: {
        NODE_ENV: 'development',
        WHATSAPP_INTERNAL_PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        WHATSAPP_INTERNAL_PORT: 3001,
      },
      error_file: './logs/whatsapp-error.log',
      out_file: './logs/whatsapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      restart_delay: 5000, // Give time for WhatsApp session to close cleanly
      max_restarts: 5,
    },
  ],
};
