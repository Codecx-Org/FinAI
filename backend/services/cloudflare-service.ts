import axios from 'axios';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
const CF_API_TOKEN  = process.env.CF_API_TOKEN!;

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`;

const cfHeaders = () => ({
  Authorization: `Bearer ${CF_API_TOKEN}`,
  'Content-Type': 'application/json',
});

// ─── TEXT ────────────────────────────────────────────────────────────────────
export async function cfGenerateText(
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: systemPrompt || 'You are a professional business assistant for African small business owners.',
    },
    { role: 'user', content: userPrompt },
  ];

  const response = await axios.post(
    `${CF_BASE}/@cf/meta/llama-3-8b-instruct`,
    { messages },
    { headers: cfHeaders() }
  );

  const text: string = response.data?.result?.response;
  if (!text) throw new Error('Empty text response from Cloudflare AI');
  return text;
}

// ─── IMAGE ───────────────────────────────────────────────────────────────────
// Cloudflare returns: { result: { image: "<base64 string>" }, success: true }
// content-type is application/json, NOT binary
export async function cfGenerateImage(prompt: string): Promise<Buffer> {
  const response = await axios.post(
    `${CF_BASE}/@cf/black-forest-labs/flux-1-schnell`,
    { prompt },
    { headers: cfHeaders() }
    // No responseType: 'arraybuffer' — let axios parse the JSON normally
  );

  // Extract base64 string from JSON envelope
  const base64: string | undefined = response.data?.result?.image;

  if (!base64) {
    console.error('[CF Image] Unexpected response shape:', JSON.stringify(response.data).slice(0, 300));
    throw new Error('Cloudflare returned no image data');
  }

  // Convert base64 → Buffer
  return Buffer.from(base64, 'base64');
}