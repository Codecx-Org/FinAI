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
const agent = new ChatbotAgent();

const sessions = new Map<string, any[]>(); // phone -> chatHistory

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

async function start() {
    console.log("Initializing Chatbot Agent...");
    await agent.initialize();

    console.log("Creating WhatsApp session...");
    const client = await wppconnect.create({
        session: 'finai-chatbot',
        catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
            console.log('Terminal QR Code:');
            console.log(asciiQR);
        },
        statusFind: (statusSession, session) => {
            console.log('Session Status: ', statusSession);
        },
        headless: false,
        devtools: false,
        useChrome: true,
        debug: true,
        logQR: true,
        browserWS: '',
        browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',         // Prevents crashes in low-memory/Docker environments
            '--disable-gpu',                   // Often helps stability on servers
            '--no-zygote',                     // Reduces memory usage
            '--single-process'
        ],
        puppeteerOptions: {
            // Point to your installed Brave (change only if which command shows different path)
            dumpio: true,

            // Alternative if the above doesn't work:
            // executablePath: '/usr/bin/brave-browser-stable',

            ignoreDefaultArgs: ['--enable-automation'],     // Brave sometimes complains about this flag
            args: [
                '--no-sandbox',                     // Still required on most Ubuntu setups
                '--disable-dev-shm-usage',          // Prevents /dev/shm crashes (common fix)
                '--disable-gpu',                    // Often needed for stable headless on Linux
                '--no-zygote',                      // Reduces memory/zygote issues
                '--disable-extensions',             // Explicit (already default, but safe)
                '--disable-features=site-per-process',  // Helps with WhatsApp Web rendering in some cases
                '--window-size=1280,800',           // Give it a reasonable viewport size
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',  // Fake a real browser UA (helps avoid detection)
            ],
            headless: false,
            // Optional: if you want visible browser for debugging first time
            // headless: false,
            timeout: 0, // Increase timeout for slower environments
        },
    });

    console.log("WhatsApp Client Ready!");

    client.onMessage(async (message) => {
        if (message.isGroupMsg) return;
        if (message.type !== 'chat') return; // Only text for now

        const from = message.from;
        const dbPhone = normalizeToDBFormat(from);

        // Find business owner
        const business = await businessService.getBusinessByWhatsapp(dbPhone);
        if (!business) {
            console.log(`Unrecognized number: ${from} (DB: ${dbPhone})`);
            await client.sendText(from, "Welcome to Fin-AI! This WhatsApp number is not yet registered as a business owner. Please register on our platform to use the chatbot.");
            return;
        }

        const history = sessions.get(from) || [];

        try {
            console.log(`Processing message from ${business.name}: ${message.body}`);
            const response = await agent.chat(message.body, history, business.id);

            if (typeof response === 'string') {
                await client.sendText(from, response);

                history.push({ role: "user", content: message.body });
                history.push({ role: "assistant", content: response });

                if (history.length > 20) {
                    history.splice(0, 2);
                }
                sessions.set(from, history);
            }
        } catch (error: any) {
            console.error("Agent error:", error);
            await client.sendText(from, "⚠️ Sorry, I encountered an error processing your request. Please try again in a moment.");
        }
    });

    // Outgoing messages server (Internal API for MCP Tools)
    const app = express();
    app.use(express.json());

    app.post('/send-text', async (req, res) => {
        const { to, text } = req.body;
        const target = normalizeToWhatsAppId(to);
        console.log(`Sending text to ${target}: ${text}`);
        try {
            await client.sendText(target, text);
            res.json({ success: true });
        } catch (err: any) {
            console.error("Failed to send text:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post('/send-media', async (req, res) => {
        const { to, imageUrl, caption } = req.body;
        const target = normalizeToWhatsAppId(to);
        console.log(`Sending media to ${target} with caption: ${caption}`);

        try {
            // If imageUrl is local path, use it, otherwise download
            let localPath = imageUrl;
            if (imageUrl.startsWith('http')) {
                const fileName = `temp_${Date.now()}.png`;
                const filePath = path.join(process.cwd(), fileName);
                const response = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream'
                });
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                localPath = filePath;
            }

            await client.sendImage(target, localPath, 'media', caption);

            // Clean up temp file if downloaded
            if (imageUrl.startsWith('http')) {
                fs.unlinkSync(localPath);
            }

            res.json({ success: true });
        } catch (err: any) {
            console.error("Failed to send media:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    const PORT = process.env.WHATSAPP_INTERNAL_PORT || 3001;
    app.listen(PORT, () => {
        console.log(`WhatsApp Outgoing Webhook Server running on port ${PORT}`);
    });
}

start().catch((error) => {
  console.error("Fatal error starting WhatsApp service:", error);
  process.exit(1);
});
