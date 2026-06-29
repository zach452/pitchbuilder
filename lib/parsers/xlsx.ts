import * as XLSX from "xlsx";

export interface SheetData {
  sheet_name: string;
  headers: string[];
  rows: Record<string, string | number>[];
  row_count: number;
}

export interface XlsxParseResult {
  text: string; // human-readable preview text for LLM grounding
  sheets: SheetData[];
  metadata: Record<string, unknown>;
}

export function parseXlsxBuffer(buffer: Buffer, isCsv = false): XlsxParseResult {
  const workbook = isCsv
    ? XLSX.read(buffer, { type: "buffer", raw: false })
    : XLSX.read(buffer, { type: "buffer" });

  const sheets: SheetData[] = [];
  let previewText = "";

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<
      string,
      string | number
    >[];
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    sheets.push({
      sheet_name: sheetName,
      headers,
      rows: json,
      row_count: json.length,
    });

    previewText += `\n--- Sheet: ${sheetName} (${json.length} rows) ---\n`;
    previewText += `Columns: ${headers.join(", ")}\n`;
    const previewRows = json.slice(0, 10);
    for (const row of previewRows) {
      previewText += headers.map((h) => `${h}=${row[h]}`).join(" | ") + "\n";
    }
  }

  const allHeaders = sheets.flatMap((s) => s.headers);
  const detectedPlatform = detectPlatformFromHeaders(allHeaders);
  const detectedMetrics = detectMetricsFromHeaders(allHeaders);

  return {
    text: previewText,
    sheets,
    metadata: {
      sheet_names: workbook.SheetNames,
      detected_platform: detectedPlatform,
      detected_metrics: detectedMetrics,
      total_rows: sheets.reduce((a, s) => a + s.row_count, 0),
    },
  };
}

export function detectPlatformFromHeaders(headers: string[]): string | null {
  const norm = headers.map((h) => h.toLowerCase());
  const has = (...needles: string[]) =>
    needles.some((n) => norm.some((h) => h.includes(n)));

  if (has("campaign name") && has("amount spent") ) return "meta";
  if (has("reach") && has("frequency") && has("amount spent")) return "meta";
  if (has("campaign") && has("ad group") && has("search keyword")) return "google";
  if (has("campaign") && has("cost") && has("clicks") && has("impr.")) return "google";
  if (has("campaign") && has("cost") && has("ctr") && has("conv.")) return "google";
  if (has("video views") && has("youtube")) return "youtube";
  if (has("tiktok")) return "tiktok";
  if (has("applovin")) return "applovin";
  if (has("net sales") || has("total sales") || has("order id") || has("orders")) return "shopify";
  return null;
}

export function detectMetricsFromHeaders(headers: string[]): string[] {
  const norm = headers.map((h) => h.toLowerCase());
  const metricMap: Record<string, string[]> = {
    spend: ["spend", "amount spent", "cost"],
    impressions: ["impressions", "impr."],
    clicks: ["clicks"],
    ctr: ["ctr", "click-through rate"],
    cpc: ["cpc", "cost per click"],
    cpm: ["cpm"],
    conversions: ["conversions", "conv.", "purchases", "results"],
    roas: ["roas", "purchase roas"],
    cpa: ["cpa", "cost per conversion", "cost per result"],
    cvr: ["cvr", "conversion rate"],
    revenue: ["revenue", "net sales", "total sales"],
    orders: ["orders", "order id"],
    sessions: ["sessions"],
    aov: ["aov", "average order value"],
  };
  const found: string[] = [];
  for (const [metric, needles] of Object.entries(metricMap)) {
    if (needles.some((n) => norm.some((h) => h.includes(n)))) {
      found.push(metric);
    }
  }
  return found;
}
