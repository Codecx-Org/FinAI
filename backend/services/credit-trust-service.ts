/**
 * Trust score v1: deterministic 0–100 component scores from Prisma aggregates only.
 * Not a regulated credit score. Gaps: no M-Pesa ledger, no app usage, no reviews (see plan).
 */
import prisma from "../utils/prisma.js";
import { AnalyticsService } from "./analytics-service.js";
import { subDays, format } from "date-fns";

export type DataQuality = "full" | "partial" | "none";

export interface TrustComponent {
  id: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  dataQuality: DataQuality;
  /** Short deterministic note for UI */
  detail: string;
}

/** Weights sum to 100. Tuned for v1 explainability. */
export const TRUST_WEIGHTS = {
  sales_volume: 22,
  sales_stability: 18,
  payment_discipline: 18,
  inventory_health: 14,
  profitability: 16,
  tenure: 12,
} as const;

export interface TrustMetricsSnapshot {
  totalSales90d: number;
  salesDaysWithActivity28d: number;
  dailySalesLast28d: number[];
  totalOrders90d: number;
  paidOrders90d: number;
  productCount: number;
  productsHealthy: number;
  avgMarginLast30d: number | null;
  daysWithMarginData: number;
  monthsTenure: number;
}

export interface TrustComputationResult {
  trustScore: number;
  ratingLabel: string;
  components: TrustComponent[];
  /** Non-PII aggregates for LLM narration */
  snapshot: TrustMetricsSnapshot;
  /** Illustrative ceiling from recent sales (not a lender offer) */
  illustrativeLoanCeiling: number;
}

const WEIGHTING_EXPLAINED = [
  {
    id: "sales_volume",
    label: "Sales volume (22%)",
    description:
      "Rewards consistent recorded sales in the last 90 days. More revenue on-platform improves this factor.",
  },
  {
    id: "sales_stability",
    label: "Sales stability (18%)",
    description:
      "Measures how evenly sales arrive day-to-day over the last 28 days. Lower volatility scores higher.",
  },
  {
    id: "payment_discipline",
    label: "Order payment discipline (18%)",
    description:
      "Share of orders marked paid vs total orders (90 days). Does not include external invoice data.",
  },
  {
    id: "inventory_health",
    label: "Inventory health (14%)",
    description:
      "Stock levels vs minimum thresholds where set, plus avoiding zero-stock SKUs where possible.",
  },
  {
    id: "profitability",
    label: "Profitability signal (16%)",
    description:
      "Average daily margin (revenue minus recorded expenses) over the last 30 days where data exists.",
  },
  {
    id: "tenure",
    label: "Business tenure (12%)",
    description: "Months since the business record was created on FinAI.",
  },
];

export function ratingLabelFromScore(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs attention";
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** 0–100 from 90d revenue; neutral 50 if no data */
function scoreSalesVolume(totalSales90d: number, quality: DataQuality): number {
  if (quality === "none") return 50;
  const ref = 500_000;
  const raw = 25 + 75 * clamp01(Math.log1p(totalSales90d) / Math.log1p(ref));
  return Math.round(raw);
}

function scoreSalesStability(daily: number[], quality: DataQuality): number {
  if (quality === "none" || daily.length < 7) return quality === "none" ? 50 : 55;
  const mean = daily.reduce((a, b) => a + b, 0) / daily.length;
  if (mean <= 0) return 45;
  const variance = daily.reduce((s, v) => s + (v - mean) ** 2, 0) / daily.length;
  const cv = Math.sqrt(variance) / mean;
  const stability = clamp01(1 - Math.min(cv, 2) / 2);
  return Math.round(40 + 60 * stability);
}

function scorePaymentDiscipline(paid: number, total: number, quality: DataQuality): number {
  if (quality === "none" || total === 0) return quality === "none" ? 50 : 52;
  const ratio = paid / total;
  return Math.round(35 + 65 * clamp01(ratio));
}

function scoreInventory(healthy: number, total: number, quality: DataQuality): number {
  if (quality === "none" || total === 0) return quality === "none" ? 50 : 48;
  const ratio = healthy / total;
  return Math.round(30 + 70 * clamp01(ratio));
}

function scoreProfitability(avgMargin: number | null, days: number, quality: DataQuality): number {
  if (quality === "none" || avgMargin === null || days < 3) return quality === "none" ? 50 : 52;
  const m = avgMargin;
  const normalized = clamp01((m + 20) / 60);
  return Math.round(25 + 75 * normalized);
}

function scoreTenure(months: number): number {
  return Math.round(Math.min(100, 15 + (85 * clamp01(months / 24))));
}

function component(
  id: keyof typeof TRUST_WEIGHTS,
  label: string,
  score: number,
  weight: number,
  dataQuality: DataQuality,
  detail: string,
): TrustComponent {
  const contribution = Math.round((score * weight) / 100);
  return { id, label, score, weight, contribution, dataQuality, detail };
}

export function buildTrustFromSnapshot(s: TrustMetricsSnapshot): TrustComputationResult {
  const qVol: DataQuality = s.totalSales90d > 0 ? "full" : "none";
  const qStab: DataQuality =
    s.dailySalesLast28d.filter((v) => v > 0).length >= 10 ? "full" : s.dailySalesLast28d.some((v) => v > 0) ? "partial" : "none";
  const qPay: DataQuality = s.totalOrders90d >= 5 ? "full" : s.totalOrders90d > 0 ? "partial" : "none";
  const qInv: DataQuality = s.productCount >= 3 ? "full" : s.productCount > 0 ? "partial" : "none";
  const qProf: DataQuality =
    s.daysWithMarginData >= 10 ? "full" : s.daysWithMarginData >= 3 ? "partial" : "none";

  const salesVol = scoreSalesVolume(s.totalSales90d, qVol);
  const salesStab = scoreSalesStability(s.dailySalesLast28d, qStab);
  const pay = scorePaymentDiscipline(s.paidOrders90d, s.totalOrders90d, qPay);
  const inv = scoreInventory(s.productsHealthy, s.productCount || 1, qInv);
  const prof = scoreProfitability(s.avgMarginLast30d, s.daysWithMarginData, qProf);
  const ten = scoreTenure(s.monthsTenure);

  const components: TrustComponent[] = [
    component("sales_volume", "Sales volume", salesVol, TRUST_WEIGHTS.sales_volume, qVol, `KES ${Math.round(s.totalSales90d).toLocaleString("en-KE")} (90d)`),
    component("sales_stability", "Sales stability", salesStab, TRUST_WEIGHTS.sales_stability, qStab, `${s.salesDaysWithActivity28d} active days (28d)`),
    component("payment_discipline", "Payment discipline", pay, TRUST_WEIGHTS.payment_discipline, qPay, `${s.paidOrders90d}/${s.totalOrders90d} orders paid (90d)`),
    component(
      "inventory_health",
      "Inventory health",
      inv,
      TRUST_WEIGHTS.inventory_health,
      qInv,
      s.productCount === 0 ? "No products recorded" : `${s.productsHealthy}/${s.productCount} SKUs healthy`,
    ),
    component("profitability", "Profitability", prof, TRUST_WEIGHTS.profitability, qProf, s.avgMarginLast30d !== null ? `Avg margin ${s.avgMarginLast30d.toFixed(1)}% (30d)` : "Limited margin data"),
    component("tenure", "Business tenure", ten, TRUST_WEIGHTS.tenure, "full", `${s.monthsTenure.toFixed(1)} months on platform`),
  ];

  const rawTrust =
    (salesVol * TRUST_WEIGHTS.sales_volume) / 100 +
    (salesStab * TRUST_WEIGHTS.sales_stability) / 100 +
    (pay * TRUST_WEIGHTS.payment_discipline) / 100 +
    (inv * TRUST_WEIGHTS.inventory_health) / 100 +
    (prof * TRUST_WEIGHTS.profitability) / 100 +
    (ten * TRUST_WEIGHTS.tenure) / 100;
  const trustScore = Math.min(100, Math.max(0, Math.round(rawTrust)));

  const illustrativeLoanCeiling = Math.min(
    500_000,
    Math.max(25_000, Math.round(s.totalSales90d * 0.12)),
  );

  return {
    trustScore,
    ratingLabel: ratingLabelFromScore(trustScore),
    components,
    snapshot: s,
    illustrativeLoanCeiling,
  };
}

export function getWeightsExplained() {
  return WEIGHTING_EXPLAINED;
}

export class CreditTrustService {
  private analytics = new AnalyticsService();

  async loadSnapshot(businessId: number): Promise<TrustMetricsSnapshot> {
    const now = new Date();
    const d90 = subDays(now, 90);
    const d28 = subDays(now, 28);

    const [salesAgg, salesDaily, ordersGrouped, products, business, profitMonth] = await Promise.all([
      prisma.sales.aggregate({
        where: { businessId, createdAt: { gte: d90 } },
        _sum: { totalAmount: true },
      }),
      prisma.sales.findMany({
        where: { businessId, createdAt: { gte: d28 } },
        select: { totalAmount: true, createdAt: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { businessId, createdAt: { gte: d90 } },
        _count: { id: true },
      }),
      prisma.product.findMany({
        where: { businessId },
        select: { stockQuantity: true, minStockLevel: true },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { createdAt: true },
      }),
      this.analytics.getProfitAnalytics(businessId, "month"),
    ]);

    const totalSales90d = Number(salesAgg._sum.totalAmount ?? 0);

    const byDay: Record<string, number> = {};
    for (const row of salesDaily) {
      const key = format(row.createdAt, "yyyy-MM-dd");
      byDay[key] = (byDay[key] ?? 0) + Number(row.totalAmount ?? 0);
    }
    const dailySalesLast28d: number[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = subDays(now, i);
      dailySalesLast28d.push(byDay[format(d, "yyyy-MM-dd")] ?? 0);
    }
    const salesDaysWithActivity28d = dailySalesLast28d.filter((v) => v > 0).length;

    let paidOrders90d = 0;
    let totalOrders90d = 0;
    for (const row of ordersGrouped) {
      const c = row._count.id;
      totalOrders90d += c;
      if (row.status === "paid") paidOrders90d += c;
    }

    const productCount = products.length;
    let productsHealthy = 0;
    for (const p of products) {
      if (p.stockQuantity <= 0) continue;
      const min = p.minStockLevel;
      if (min != null && min > 0) {
        if (p.stockQuantity >= min * 0.5) productsHealthy++;
      } else if (p.stockQuantity > 0) {
        productsHealthy++;
      }
    }

    const margins = profitMonth.map((x: { margin: number }) => Number(x.margin));
    const daysWithMarginData = margins.filter((m) => Number.isFinite(m)).length;
    const avgMarginLast30d =
      daysWithMarginData > 0 ? margins.reduce((a, b) => a + b, 0) / daysWithMarginData : null;

    const created = business?.createdAt ?? now;
    const monthsTenure = Math.max(0, (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

    return {
      totalSales90d,
      salesDaysWithActivity28d,
      dailySalesLast28d,
      totalOrders90d,
      paidOrders90d,
      productCount,
      productsHealthy,
      avgMarginLast30d,
      daysWithMarginData,
      monthsTenure,
    };
  }

  async computeTrustPreview(businessId: number): Promise<TrustComputationResult> {
    const snapshot = await this.loadSnapshot(businessId);
    return buildTrustFromSnapshot(snapshot);
  }
}
