import { describe, expect, it } from "@jest/globals";
import { buildTrustFromSnapshot, type TrustMetricsSnapshot } from "../services/credit-trust-service.js";

const emptySnapshot: TrustMetricsSnapshot = {
  totalSales90d: 0,
  salesDaysWithActivity28d: 0,
  dailySalesLast28d: Array(28).fill(0),
  totalOrders90d: 0,
  paidOrders90d: 0,
  productCount: 0,
  productsHealthy: 0,
  avgMarginLast30d: null,
  daysWithMarginData: 0,
  monthsTenure: 2,
};

const strongSnapshot: TrustMetricsSnapshot = {
  totalSales90d: 800_000,
  salesDaysWithActivity28d: 24,
  dailySalesLast28d: Array(28)
    .fill(0)
    .map((_, i) => (i % 3 === 0 ? 5000 : 4500)),
  totalOrders90d: 40,
  paidOrders90d: 38,
  productCount: 10,
  productsHealthy: 9,
  avgMarginLast30d: 35,
  daysWithMarginData: 20,
  monthsTenure: 18,
};

describe("CreditTrustService buildTrustFromSnapshot", () => {
  it("is deterministic for the same snapshot", () => {
    const a = buildTrustFromSnapshot(strongSnapshot);
    const b = buildTrustFromSnapshot(strongSnapshot);
    expect(a.trustScore).toBe(b.trustScore);
    expect(a.components.map((c) => c.id)).toEqual(b.components.map((c) => c.id));
  });

  it("scores a strong synthetic profile higher than an empty profile", () => {
    const poor = buildTrustFromSnapshot(emptySnapshot);
    const rich = buildTrustFromSnapshot(strongSnapshot);
    expect(rich.trustScore).toBeGreaterThan(poor.trustScore);
  });

  it("returns six components with weights summing to 100", () => {
    const r = buildTrustFromSnapshot(strongSnapshot);
    expect(r.components).toHaveLength(6);
    const w = r.components.reduce((s, c) => s + c.weight, 0);
    expect(w).toBe(100);
  });

  it("sets illustrative loan ceiling within bounds", () => {
    const r = buildTrustFromSnapshot(strongSnapshot);
    expect(r.illustrativeLoanCeiling).toBeGreaterThanOrEqual(25_000);
    expect(r.illustrativeLoanCeiling).toBeLessThanOrEqual(500_000);
  });
});
