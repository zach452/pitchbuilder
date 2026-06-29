import fs from "fs";
import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { evidenceToPromptBlock, createEvidence, getEvidenceForProject } from "../evidence";
import { extractJson } from "../jsonExtract";
import { ShopifyFinding } from "../types";
import { saveArtifact } from "./artifacts";
import { listFilesForProject } from "../projects";
import { parseCsvBuffer } from "../parsers/csv";
import { parseXlsxBuffer } from "../parsers/xlsx";
import { getArtifact } from "./artifacts";

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[%,$]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find((k) => k.toLowerCase().includes(c));
    if (found) return row[found];
  }
  return undefined;
}

export async function generateShopifyAnalysis(
  projectId: string
): Promise<{ findings: ShopifyFinding[]; computed: Record<string, unknown> } | null> {
  const files = listFilesForProject(projectId).filter((f) => f.source_type === "shopify");
  if (files.length === 0) return null;

  let netSales = 0;
  let orders = 0;
  let sessions = 0;
  const productRevenue: Record<string, number> = {};

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file.stored_path);
      const result = file.ext === ".csv" ? parseCsvBuffer(buffer) : parseXlsxBuffer(buffer);
      for (const sheet of result.sheets) {
        for (const row of sheet.rows) {
          const sales = num(pick(row, ["net sales", "total sales", "revenue"]));
          netSales += sales;
          const orderIdValue = pick(row, ["order id"]);
          const ordersColumnValue = pick(row, ["orders"]);
          if (orderIdValue !== undefined) {
            // Order-level export: each row represents one order.
            orders += 1;
          } else if (ordersColumnValue !== undefined) {
            // Aggregated export with an explicit orders count column.
            orders += num(ordersColumnValue);
          }
          sessions += num(pick(row, ["sessions"]));
          const product = pick(row, ["product", "product title", "item"]);
          if (product) {
            const key = String(product);
            productRevenue[key] = (productRevenue[key] ?? 0) + sales;
          }
        }
      }
    } catch {
      // skip
    }
  }

  const aov = orders > 0 ? netSales / orders : null;
  const cvr = sessions > 0 && orders > 0 ? (orders / sessions) * 100 : null;

  // Tie to paid spend if the paid media module has already run for MER.
  const paidArtifact = getArtifact<{ computed: { total_spend: number } }>(
    projectId,
    "paid_media_findings"
  );
  const mer =
    paidArtifact && paidArtifact.computed.total_spend > 0
      ? netSales / paidArtifact.computed.total_spend
      : null;

  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }));

  const computed = {
    net_sales: Math.round(netSales * 100) / 100,
    orders,
    sessions,
    aov: aov ? Math.round(aov * 100) / 100 : null,
    cvr_pct: cvr ? Math.round(cvr * 100) / 100 : null,
    mer: mer ? Math.round(mer * 100) / 100 : null,
    top_products: topProducts,
  };

  createEvidence({
    project_id: projectId,
    source_file: files.map((f) => f.original_name).join(", "),
    source_type: "shopify",
    extracted_text: `Computed Shopify metrics: ${JSON.stringify(computed)}`,
    metric_name: "shopify_computed_summary",
    metric_value: JSON.stringify(computed),
    confidence: "High",
    tags: ["computed", "shopify"],
  });

  const evidence = getEvidenceForProject(projectId).filter((e) => e.source_type === "shopify");
  const system = loadPrompt("shopify_analysis");
  const user = `Computed Shopify metrics:\n${JSON.stringify(
    computed,
    null,
    2
  )}\n\nSupporting evidence:\n${evidenceToPromptBlock(evidence)}\n\nProduce the Shopify findings JSON array now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 2000 });
  const findings = extractJson<ShopifyFinding[]>(raw);

  saveArtifact(projectId, "shopify_findings", { findings, computed });
  return { findings, computed };
}
