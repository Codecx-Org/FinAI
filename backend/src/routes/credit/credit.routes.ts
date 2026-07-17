import type { FastifyInstance } from 'fastify';
import { CreditTrustService, getWeightsExplained } from '../../../services/credit-trust-service.js';
import { generateCreditNarration } from '../../../services/credit-narration-service.js';
import { LOAN_PRODUCTS } from '../../../data/loan-products.js';

const DISCLAIMER =
  'This trust score is illustrative and based only on data recorded in FinAI. It is not a credit bureau report, a loan approval, or financial advice. Confirm rates, limits, and eligibility with each lender.';

/**
 * Credit Routes (all protected — require JWT)
 * GET /api/credit/trust-preview - Deterministic trust score + LLM narrative + loan catalog
 */
export async function creditRoutes(fastify: FastifyInstance) {
  fastify.get('/credit/trust-preview', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['en', 'sw'] },
        },
      },
    },
  }, async (req, reply) => {
    const { id: businessId } = req.user as { id: number };
    const { language = 'en' } = req.query as { language?: 'en' | 'sw' };

    const trustService = new CreditTrustService();
    const trust = await trustService.computeTrustPreview(businessId);
    const narration = await generateCreditNarration(trust, language);

    return reply.send({
      success: true,
      generatedAt: new Date().toISOString(),
      language,
      trustScore: trust.trustScore,
      ratingLabel: trust.ratingLabel,
      illustrativeLoanCeiling: trust.illustrativeLoanCeiling,
      components: trust.components,
      weightsExplained: getWeightsExplained(),
      strings: {
        headline: narration.headline,
        summary: narration.summary,
      },
      actionableInsights: narration.actionableInsights,
      disclaimer: DISCLAIMER,
      loanProviders: LOAN_PRODUCTS,
      signals: {
        totalSales90d: Math.round(trust.snapshot.totalSales90d),
        paidOrders90d: trust.snapshot.paidOrders90d,
        totalOrders90d: trust.snapshot.totalOrders90d,
        productCount: trust.snapshot.productCount,
        monthsTenure: Number(trust.snapshot.monthsTenure.toFixed(1)),
      },
    });
  });
}
