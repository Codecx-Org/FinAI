import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { TrustComputationResult } from "./credit-trust-service.js";

const NarrationSchema = z.object({
  headline: z.string().max(200),
  summary: z.string().max(800),
  actionableInsights: z
    .array(
      z.object({
        title: z.string().max(120),
        detail: z.string().max(400),
      }),
    )
    .max(6),
});

export type CreditNarration = z.infer<typeof NarrationSchema>;

function stripJsonFences(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function defaultNarration(trustScore: number, language: string): CreditNarration {
  if (language === "sw") {
    return {
      headline: `Alama ya uaminifu: ${trustScore}/100`,
      summary:
        "Hii ni muhtasari wa kifedha unaotegemea mauzo, malipo, hesabu, na muda wa biashara kwenye FinAI. Si mkopo halisi — thibitisha na benki au SACCO kabla ya maombi.",
      actionableInsights: [
        {
          title: "Ongeza mauzo yaliyorekodi",
          detail: "Hakikisha mauzo yote yanaingia mfumo ili alama ya uaminifu ionekane kwa usahihi.",
        },
        {
          title: "Maliza malipo ya agizo",
          detail: "Weka agizo kama 'paid' mara malipo yanapothibitishwa.",
        },
      ],
    };
  }
  return {
    headline: `Your trust snapshot: ${trustScore}/100`,
    summary:
      "This score summarizes on-platform sales, order payments, inventory, margins, and tenure. It is illustrative only—not a lender decision. Always confirm terms with a bank or SACCO.",
    actionableInsights: [
      {
        title: "Record all sales",
        detail: "Enter sales consistently so your profile reflects true business activity.",
      },
      {
        title: "Close the payment loop",
        detail: "Mark orders as paid when M-Pesa or cash is received to strengthen payment discipline.",
      },
    ],
  };
}

/**
 * LLM generates narrative strings only; numeric trust values come from CreditTrustService.
 */
export async function generateCreditNarration(
  trust: TrustComputationResult,
  language: string,
): Promise<CreditNarration> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    return defaultNarration(trust.trustScore, language);
  }

  const payload = {
    trustScore: trust.trustScore,
    ratingLabel: trust.ratingLabel,
    components: trust.components.map((c) => ({
      id: c.id,
      label: c.label,
      score: c.score,
      dataQuality: c.dataQuality,
    })),
    snapshot: {
      totalSales90d: Math.round(trust.snapshot.totalSales90d),
      paidOrderRatio:
        trust.snapshot.totalOrders90d > 0
          ? Number((trust.snapshot.paidOrders90d / trust.snapshot.totalOrders90d).toFixed(3))
          : null,
      productCount: trust.snapshot.productCount,
      avgMarginLast30d: trust.snapshot.avgMarginLast30d,
      monthsTenure: Number(trust.snapshot.monthsTenure.toFixed(1)),
    },
  };

  const langLine =
    language === "sw"
      ? "Write all user-facing strings in Kiswahili (professional, plain)."
      : "Write all user-facing strings in English.";

  const prompt = `You are a financial coach for Kenyan SMEs using FinAI.
${langLine}

Return ONLY a JSON object (no markdown fences) with this exact shape:
{"headline":"string","summary":"string","actionableInsights":[{"title":"string","detail":"string"}]}

Rules:
- Do NOT invent numeric trust scores; trustScore is ${trust.trustScore} and is fixed.
- headline: one short line.
- summary: 2-4 sentences explaining what drives the score in business terms, referencing strengths/weaknesses qualitatively.
- actionableInsights: 3 to 5 items tailored to the component scores (lower scores → concrete improvement tips). No legal promises.

Data:
${JSON.stringify(payload)}`;

  try {
    const llm = new ChatOpenAI({
      model: process.env.CHAT_MODEL || "google/gemini-2.0-flash-001",
      apiKey,
      temperature: 0.4,
      configuration: { baseURL: "https://openrouter.ai/api/v1" },
    });

    const res = await llm.invoke([new HumanMessage({ content: prompt })]);
    let content = typeof res.content === "string" ? res.content : String(res.content ?? "");
    content = stripJsonFences(content);

    const parsed = JSON.parse(content) as unknown;
    const safe = NarrationSchema.safeParse(parsed);
    if (!safe.success) {
      console.warn("[CREDIT_NARRATION] Zod validation failed:", safe.error?.format?.());
      return defaultNarration(trust.trustScore, language);
    }
    return safe.data;
  } catch (e) {
    console.warn("[CREDIT_NARRATION] LLM failed:", e);
    return defaultNarration(trust.trustScore, language);
  }
}
