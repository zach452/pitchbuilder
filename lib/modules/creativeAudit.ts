import fs from "fs";
import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { evidenceToPromptBlock, createEvidence, getEvidenceForProject } from "../evidence";
import { extractJson } from "../jsonExtract";
import { CreativeAssetScore } from "../types";
import { saveArtifact } from "./artifacts";
import { listFilesForProject } from "../projects";
import { parseCsvBuffer } from "../parsers/csv";
import { parseXlsxBuffer } from "../parsers/xlsx";
import { creativeGrade } from "../scoring";

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

export async function generateCreativeAudit(
  projectId: string
): Promise<{ scores: CreativeAssetScore[]; gradeDistribution: Record<string, number>; findings: string[] } | null> {
  const allFiles = await listFilesForProject(projectId);
  const files = allFiles.filter((f) => f.source_type === "creative_scorecard");
  if (files.length === 0) return null;

  const scores: CreativeAssetScore[] = [];
  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file.stored_path);
      const result = file.ext === ".csv" ? parseCsvBuffer(buffer) : parseXlsxBuffer(buffer);
      for (const sheet of result.sheets) {
        for (const row of sheet.rows) {
          const name = String(pick(row, ["asset", "creative", "name", "ad name"]) ?? "Unnamed asset");
          const rawScore = num(pick(row, ["score", "overall score", "total score", "grade %"]));
          if (rawScore === 0 && !pick(row, ["score"])) continue;
          scores.push({ asset_name: name, score: rawScore, grade: creativeGrade(rawScore), notes: "" });
        }
      }
    } catch { /* skip */ }
  }

  if (scores.length === 0) return null;

  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const s of scores) gradeDistribution[s.grade]++;

  await createEvidence({
    project_id: projectId,
    source_file: files.map((f) => f.original_name).join(", "),
    source_type: "creative_scorecard",
    extracted_text: `Creative scorecard parsed: ${scores.length} assets. Grade distribution: ${JSON.stringify(gradeDistribution)}`,
    metric_name: "creative_grade_distribution",
    metric_value: JSON.stringify(gradeDistribution),
    confidence: "High",
    tags: ["computed", "creative"],
  });

  const allEvidence = await getEvidenceForProject(projectId);
  const evidence = allEvidence.filter((e) => e.source_type === "creative_scorecard");
  const system = loadPrompt("creative_audit");
  const user = `Parsed creative scores: ${JSON.stringify(scores)}\n\nGrade distribution: ${JSON.stringify(gradeDistribution)}\n\nSupporting evidence:\n${evidenceToPromptBlock(evidence)}\n\nProduce the creative audit JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 2000 });
  const parsed = extractJson<{ grade_distribution: Record<string, number>; findings: string[] }>(raw);

  const result = { scores, gradeDistribution: parsed.grade_distribution ?? gradeDistribution, findings: parsed.findings ?? [] };
  await saveArtifact(projectId, "creative_findings", result);
  return result;
}
