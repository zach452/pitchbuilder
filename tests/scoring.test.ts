import { describe, it, expect } from "vitest";
import {
  creativeGrade,
  measurementMaturityScore,
  auditFindingPriority,
  spendConcentration,
} from "../lib/scoring";

describe("creativeGrade", () => {
  it("grades A for 85-100", () => {
    expect(creativeGrade(85)).toBe("A");
    expect(creativeGrade(100)).toBe("A");
  });
  it("grades B for 70-84", () => {
    expect(creativeGrade(70)).toBe("B");
    expect(creativeGrade(84)).toBe("B");
  });
  it("grades C for 55-69", () => {
    expect(creativeGrade(55)).toBe("C");
    expect(creativeGrade(69)).toBe("C");
  });
  it("grades D for 40-54", () => {
    expect(creativeGrade(40)).toBe("D");
    expect(creativeGrade(54)).toBe("D");
  });
  it("grades F below 40", () => {
    expect(creativeGrade(39)).toBe("F");
    expect(creativeGrade(0)).toBe("F");
  });
});

describe("measurementMaturityScore", () => {
  it("defaults to 1 with no signals", () => {
    expect(
      measurementMaturityScore({
        hasPlatformData: false,
        hasShopifyOrGA4Reconciliation: false,
        hasSourceOfTruthHierarchy: false,
        hasIncrementalityOrForecastingRoadmap: false,
        hasOngoingMmmOrMtaWithFinanceAlignment: false,
      })
    ).toBe(1);
  });

  it("scores 1 for platform-only", () => {
    expect(
      measurementMaturityScore({
        hasPlatformData: true,
        hasShopifyOrGA4Reconciliation: false,
        hasSourceOfTruthHierarchy: false,
        hasIncrementalityOrForecastingRoadmap: false,
        hasOngoingMmmOrMtaWithFinanceAlignment: false,
      })
    ).toBe(1);
  });

  it("scores 2 with reconciliation", () => {
    expect(
      measurementMaturityScore({
        hasPlatformData: true,
        hasShopifyOrGA4Reconciliation: true,
        hasSourceOfTruthHierarchy: false,
        hasIncrementalityOrForecastingRoadmap: false,
        hasOngoingMmmOrMtaWithFinanceAlignment: false,
      })
    ).toBe(2);
  });

  it("scores 5 with full MMM/MTA finance alignment regardless of other flags", () => {
    expect(
      measurementMaturityScore({
        hasPlatformData: true,
        hasShopifyOrGA4Reconciliation: true,
        hasSourceOfTruthHierarchy: true,
        hasIncrementalityOrForecastingRoadmap: true,
        hasOngoingMmmOrMtaWithFinanceAlignment: true,
      })
    ).toBe(5);
  });
});

describe("auditFindingPriority", () => {
  it("computes business_impact * evidence_strength * urgency / complexity", () => {
    const result = auditFindingPriority({
      businessImpact: 4,
      evidenceStrength: 5,
      urgency: 3,
      complexity: 2,
    });
    expect(result).toBe(30); // (4*5*3)/2 = 30
  });

  it("guards against divide by zero complexity", () => {
    const result = auditFindingPriority({
      businessImpact: 4,
      evidenceStrength: 5,
      urgency: 3,
      complexity: 0,
    });
    expect(result).toBe(60); // complexity clamped to 1
  });
});

describe("spendConcentration", () => {
  it("computes top5/top10 spend share correctly", () => {
    const campaigns = [
      { name: "A", spend: 500 },
      { name: "B", spend: 300 },
      { name: "C", spend: 100 },
      { name: "D", spend: 100 },
    ];
    const result = spendConcentration(campaigns);
    expect(result.totalSpend).toBe(1000);
    expect(result.top5Pct).toBe(100); // only 4 campaigns, all in top5
    expect(result.ranked[0].name).toBe("A");
    expect(result.ranked[0].pct).toBe(50);
  });

  it("handles zero total spend without dividing by zero", () => {
    const result = spendConcentration([{ name: "A", spend: 0 }]);
    expect(result.top5Pct).toBe(0);
    expect(result.totalSpend).toBe(0);
  });
});
