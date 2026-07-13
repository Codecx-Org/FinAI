import * as wppconnect from '@wppconnect-team/wppconnect';
import { ChatbotAgent } from './agent.js';
import { BusinessService } from '../services/business-service.js';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const businessService = new BusinessService();

/**
 * Per-phone session state: chat history + a fully initialized agent per business.
 * Agents are created lazily on first message from a business owner.
 */
const sessions = new Map<string, { history: any[]; agent: ChatbotAgent }>();

/**
 * Normalizes WhatsApp phone number to local format for DB lookup
 * e.g. 254712345678 -> 0712345678
 */
function normalizeToDBFormat(whatsappId: string): string {
    const number = whatsappId.split('@')[0] as string;
    if (number.startsWith('254')) {
        return '0' + number.slice(3);
    }
    return number;
}

/**
 * Normalizes DB format to WhatsApp ID
 * e.g. 0712345678 -> 254712345678@c.us
 */
function normalizeToWhatsAppId(dbPhone: string): string {
    if (dbPhone.startsWith('0')) {
        return '254' + dbPhone.slice(1) + '@c.us';
    }
    if (!dbPhone.includes('@')) {
        return dbPhone + '@c.us';
    }
    return dbPhone;
}

/**
 * Get or create a fully initialized ChatbotAgent for a specific business.
 * Each business gets its own agent with its own MCP subprocess connection.
 */
async function getOrCreateSession(from: string, businessId: number) {
    if (!sessions.has(from)) {
        console.log(`[WhatsApp] Creating new agent session for business ${businessId}`);
        const agent = new ChatbotAgent();
        await agent.setBusinessContext(businessId);
        await agent.initialize();
        sessions.set(from, { history: [], agent });
        console.log(`[WhatsApp] Agent ready for business ${businessId}`);
    }
    return sessions.get(from)!;
}

async function start() {
    console.log('[WhatsApp] Creating WhatsApp session...');

    const client = await wppconnect.create({
        session: 'finai-chatbot',
        catchQR: (_base64Qrimg, asciiQR) => {
            console.log('Terminal QR Code:');
            console.log(asciiQR);
        },
        statusFind: (statusSession) => {
            console.log('Session Status:', statusSession);
        },
        headless: false,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        browserWS: '',
        browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process',
        ],
        puppeteerOptions: {
            dumpio: false,
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--disable-extensions',
                '--disable-features=site-per-process',
                '--window-size=1280,800',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ],
            headless: false,
            timeout: 0,
        },
    });

    console.log('[WhatsApp] Client Ready!');

    client.onMessage(async (message) => {
        if (message.isGroupMsg) return;
        if (message.type !== 'chat') return; // Text messages only

        const from = message.from;
        const dbPhone = normalizeToDBFormat(from);

        // Find the business owner by WhatsApp phone number
        const business = await businessService.getBusinessByWhatsapp(dbPhone);
        if (!business) {
            console.log(`[WhatsApp] Unrecognized number: ${from} (DB: ${dbPhone})`);
            await client.sendText(from,
                'Welcome to Fin-AI! This WhatsApp number is not yet registered as a business owner. Please register on our platform to use the chatbot.'
            );
            return;
        }

        try {
            // Lazily initialize agent for this business on first message
            const session = await getOrCreateSession(from, business.id);
            const { history, agent } = session;

            console.log(`[WhatsApp] Processing message from ${business.name}: ${message.body}`);
            const response = await agent.chat(message.body, history, business.id);

            if (typeof response === 'string') {
                await client.sendText(from, response);

                history.push({ role: 'user', content: message.body });
                history.push({ role: 'assistant', content: response });

                // Keep last 20 messages (10 turns) to avoid context bloat
                if (history.length > 20) {
                    history.splice(0, 2);
                }
            }
        } catch (error: any) {
            console.error('[WhatsApp] Agent error:', error);
            await client.sendText(from,
                '⚠️ Sorry, I encountered an error processing your request. Please try again in a moment.'
            );
        }
    });

    // -------------------------------------------------------------------------
    // Internal HTTP server — used by MCP tools to send outgoing messages
    // -------------------------------------------------------------------------
    const app = express();
    app.use(express.json());

    app.post('/send-text', async (req, res) => {
        const { to, text } = req.body;
        const target = normalizeToWhatsAppId(to);
        console.log(`[WhatsApp] Sending text to ${target}`);
        try {
            await client.sendText(target, text);
            res.json({ success: true });
        } catch (err: any) {
            console.error('[WhatsApp] Failed to send text:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post('/send-media', async (req, res) => {
        const { to, imageUrl, caption } = req.body;
        const target = normalizeToWhatsAppId(to);
        console.log(`[WhatsApp] Sending media to ${target}`);

        let localPath = imageUrl;
        try {
            if (imageUrl.startsWith('http')) {
                const fileName = `temp_${Date.now()}.png`;
                const filePath = path.join(process.cwd(), 'tmp', fileName);
                fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true });

                const response = await axios({ url: imageUrl, method: 'GET', responseType: 'stream' });
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);

                await new Promise<void>((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                localPath = filePath;
            }

            await client.sendImage(target, localPath, 'media', caption);

            if (imageUrl.startsWith('http') && fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }

            res.json({ success: true });
        } catch (err: any) {
            console.error('[WhatsApp] Failed to send media:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    const PORT = process.env.WHATSAPP_INTERNAL_PORT || 3001;
    app.listen(PORT, () => {
        console.log(`[WhatsApp] Outgoing webhook server running on port ${PORT}`);
    });
}

start().catch((error) => {
    console.error('[WhatsApp] Fatal error starting service:', error);
    process.exit(1);
});
