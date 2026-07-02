import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { getEvidenceForProject, evidenceToPromptBlock, createEvidence } from "../evidence";
import { extractJson } from "../jsonExtract";
import { PaidMediaAuditFinding, SourceType } from "../types";
import { saveArtifact } from "./artifacts";
import { spendConcentration } from "../scoring";
import { listFilesForProject } from "../projects";
import { parseCsvBuffer } from "../parsers/csv";
import { parseXlsxBuffer } from "../parsers/xlsx";
import fs from "fs";

const PLATFORM_TYPES: SourceType[] = [
  "platform_meta", "platform_google", "platform_tiktok", "platform_youtube", "platform_applovin",
];

interface NormalizedCampaign {
  name: string; platform: string; spend: number; impressions: number;
  clicks: number; conversions: number; revenue: number;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[$,%]/g, "").trim());
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

function normalizeCampaignsFromFile(platform: string, rows: Record<string, unknown>[]): NormalizedCampaign[] {
  return rows.map((row) => ({
    name: String(pick(row, ["campaign name", "campaign"]) ?? "Unnamed campaign"),
    platform,
    spend: num(pick(row, ["amount spent", "spend", "cost"])),
    impressions: num(pick(row, ["impressions", "impr."])),
    clicks: num(pick(row, ["clicks", "link clicks"])),
    conversions: num(pick(row, ["conversions", "results", "purchases", "conv."])),
    revenue: num(pick(row, ["purchase conversion value", "conv. value", "revenue"])),
  })).filter((c) => c.spend > 0 || c.impressions > 0 || c.clicks > 0);
}

export async function generatePaidMediaAudit(
  projectId: string
): Promise<{ findings: PaidMediaAuditFinding[]; computed: Record<string, unknown> } | null> {
  const allFiles = await listFilesForProject(projectId);
  const files = allFiles.filter((f) => PLATFORM_TYPES.includes(f.source_type));
  if (files.length === 0) return null;

  let allCampaigns: NormalizedCampaign[] = [];
  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file.stored_path);
      const result = file.ext === ".csv" ? parseCsvBuffer(buffer) : parseXlsxBuffer(buffer);
      for (const sheet of result.sheets) {
        allCampaigns = allCampaigns.concat(
          normalizeCampaignsFromFile(file.source_type.replace("platform_", ""), sheet.rows)
        );
      }
    } catch { /* skip unreadable file */ }
  }

  if (allCampaigns.length === 0) return null;

  const totalSpend = allCampaigns.reduce((a, c) => a + c.spend, 0);
  const totalConversions = allCampaigns.reduce((a, c) => a + c.conversions, 0);
  const totalRevenue = allCampaigns.reduce((a, c) => a + c.revenue, 0);
  const totalClicks = allCampaigns.reduce((a, c) => a + c.clicks, 0);
  const totalImpressions = allCampaigns.reduce((a, c) => a + c.impressions, 0);
  const concentration = spendConcentration(allCampaigns.map((c) => ({ name: c.name, spend: c.spend })));

  const computed = {
    total_spend: Math.round(totalSpend * 100) / 100,
    total_conversions: Math.round(totalConversions * 100) / 100,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    blended_cpa: totalConversions > 0 ? Math.round((totalSpend / totalConversions) * 100) / 100 : null,
    blended_roas: totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : null,
    blended_ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : null,
    spend_concentration_top5_pct: concentration.top5Pct,
    spend_concentration_top10_pct: concentration.top10Pct,
    top_campaigns: concentration.ranked.slice(0, 10),
    campaign_count: allCampaigns.length,
  };

  const computedEvidence = await createEvidence({
    project_id: projectId,
    source_file: files.map((f) => f.original_name).join(", "),
    source_type: files[0].source_type,
    extracted_text: `Computed paid media metrics across ${files.length} platform file(s): ${JSON.stringify(computed)}`,
    metric_name: "paid_media_computed_summary",
    metric_value: JSON.stringify(computed),
    confidence: "High",
    tags: ["computed", "paid_media"],
  });

  const allEvidence = await getEvidenceForProject(projectId);
  const evidence = allEvidence.filter((e) =>
    PLATFORM_TYPES.includes(e.source_type) || e.id === computedEvidence.id
  );

  const system = loadPrompt("paid_media_audit");
  const user = `Computed normalized metrics:\n${JSON.stringify(computed, null, 2)}\n\nSupporting evidence:\n${evidenceToPromptBlock(evidence)}\n\nProduce 5-8 findings as a JSON array now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const findings = extractJson<PaidMediaAuditFinding[]>(raw);

  await saveArtifact(projectId, "paid_media_findings", { findings, computed });
  return { findings, computed };
}
