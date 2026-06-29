// Pure scoring functions used across the audit & creative modules.

export type Grade = "A" | "B" | "C" | "D" | "F";

export function creativeGrade(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export type MaturityScore = 1 | 2 | 3 | 4 | 5;

export interface MaturityInputs {
  hasPlatformData: boolean;
  hasShopifyOrGA4Reconciliation: boolean;
  hasSourceOfTruthHierarchy: boolean;
  hasIncrementalityOrForecastingRoadmap: boolean;
  hasOngoingMmmOrMtaWithFinanceAlignment: boolean;
}

export function measurementMaturityScore(inputs: MaturityInputs): MaturityScore {
  if (inputs.hasOngoingMmmOrMtaWithFinanceAlignment) return 5;
  if (inputs.hasIncrementalityOrForecastingRoadmap) return 4;
  if (inputs.hasSourceOfTruthHierarchy) return 3;
  if (inputs.hasShopifyOrGA4Reconciliation) return 2;
  if (inputs.hasPlatformData) return 1;
  return 1;
}

/**
 * Audit finding priority score.
 * priority = business_impact * evidence_strength * urgency / complexity
 * Each input is expected on a 1-5 scale; complexity must be >= 1 to avoid
 * divide-by-zero.
 */
export function auditFindingPriority(params: {
  businessImpact: number;
  evidenceStrength: number;
  urgency: number;
  complexity: number;
}): number {
  const complexity = Math.max(params.complexity, 1);
  const raw =
    (params.businessImpact * params.evidenceStrength * params.urgency) / complexity;
  return Math.round(raw * 100) / 100;
}

export function spendConcentration(
  campaigns: { name: string; spend: number }[]
): { top5Pct: number; top10Pct: number; totalSpend: number; ranked: { name: string; spend: number; pct: number }[] } {
  const totalSpend = campaigns.reduce((a, c) => a + c.spend, 0);
  const sorted = [...campaigns].sort((a, b) => b.spend - a.spend);
  const ranked = sorted.map((c) => ({
    ...c,
    pct: totalSpend > 0 ? Math.round((c.spend / totalSpend) * 10000) / 100 : 0,
  }));
  const top5 = ranked.slice(0, 5).reduce((a, c) => a + c.spend, 0);
  const top10 = ranked.slice(0, 10).reduce((a, c) => a + c.spend, 0);
  return {
    top5Pct: totalSpend > 0 ? Math.round((top5 / totalSpend) * 10000) / 100 : 0,
    top10Pct: totalSpend > 0 ? Math.round((top10 / totalSpend) * 10000) / 100 : 0,
    totalSpend,
    ranked,
  };
}
