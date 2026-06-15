import { Router, type Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { authenticate, type AuthenticatedRequest } from "../utils/auth-middleware.js";
import { CreditTrustService, getWeightsExplained } from "../services/credit-trust-service.js";
import { generateCreditNarration } from "../services/credit-narration-service.js";
import { LOAN_PRODUCTS } from "../data/loan-products.js";

const router = Router();

const DISCLAIMER =
  "This trust score is illustrative and based only on data recorded in FinAI. It is not a credit bureau report, a loan approval, or financial advice. Confirm rates, limits, and eligibility with each lender.";

/**
 * @route GET /api/credit/trust-preview
 * @desc Deterministic trust components + LLM narrative strings + loan provider catalog
 */
router.get(
  "/credit/trust-preview",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.user?.id;
    if (!businessId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const language = req.query.language === "sw" ? "sw" : "en";

    const trustService = new CreditTrustService();
    const trust = await trustService.computeTrustPreview(businessId);
    const narration = await generateCreditNarration(trust, language);

    return res.json({
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
  }),
);

export default router;
