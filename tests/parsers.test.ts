import { describe, it, expect } from "vitest";
import { parseXlsxBuffer, detectPlatformFromHeaders, detectMetricsFromHeaders } from "../lib/parsers/xlsx";
import { parseCsvBuffer } from "../lib/parsers/csv";
import { parseText } from "../lib/parsers/text";

describe("parseText", () => {
  it("counts lines and chars", () => {
    const result = parseText(Buffer.from("line1\nline2\nline3"));
    expect(result.metadata.line_count).toBe(3);
    expect(result.text).toContain("line2");
  });
});

describe("parseCsvBuffer", () => {
  it("parses headers and rows", () => {
    const csv = "Campaign,Amount spent,Clicks\nCampaign A,100,10\nCampaign B,200,20\n";
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.sheets[0].headers).toEqual(["Campaign", "Amount spent", "Clicks"]);
    expect(result.sheets[0].row_count).toBe(2);
    expect(result.metadata.detected_platform).toBe(null); // not enough meta-specific headers
  });

  it("detects meta platform from headers", () => {
    const csv = "Campaign name,Amount spent,Reach,Frequency\nCampaign A,100,500,2\n";
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.metadata.detected_platform).toBe("meta");
  });
});

describe("detectPlatformFromHeaders / detectMetricsFromHeaders", () => {
  it("detects shopify from net sales + order id", () => {
    expect(detectPlatformFromHeaders(["Order ID", "Net Sales", "Product"])).toBe("shopify");
  });

  it("detects multiple metrics from header list", () => {
    const metrics = detectMetricsFromHeaders(["Amount spent", "Clicks", "CTR", "Conv."]);
    expect(metrics).toContain("spend");
    expect(metrics).toContain("clicks");
    expect(metrics).toContain("ctr");
    expect(metrics).toContain("conversions");
  });
});

describe("parseXlsxBuffer via CSV path", () => {
  it("produces a human readable preview text", () => {
    const csv = "Campaign,Spend\nA,100\n";
    const result = parseXlsxBuffer(Buffer.from(csv), true);
    expect(result.text).toContain("Campaign");
    expect(result.text).toContain("Sheet:");
  });
});
