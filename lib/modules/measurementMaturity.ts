import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { getEvidenceForProject, evidenceToPromptBlock } from "../evidence";
import { extractJson } from "../jsonExtract";
import { MeasurementPlan } from "../types";
import { saveArtifact } from "./artifacts";
import { measurementMaturityScore } from "../scoring";
import { listFilesForProject } from "../projects";

export async function generateMeasurementMaturity(projectId: string): Promise<MeasurementPlan> {
  const evidence = await getEvidenceForProject(projectId);
  const files = await listFilesForProject(projectId);

  const hasPlatformData = files.some((f) => f.source_type.startsWith("platform_"));
  const hasShopify = files.some((f) => f.source_type === "shopify");
  const heuristicScore = measurementMaturityScore({
    hasPlatformData,
    hasShopifyOrGA4Reconciliation: hasPlatformData && hasShopify,
    hasSourceOfTruthHierarchy: false,
    hasIncrementalityOrForecastingRoadmap: false,
    hasOngoingMmmOrMtaWithFinanceAlignment: false,
  });

  const system = loadPrompt("measurement_maturity");
  const user = `Heuristic baseline score: ${heuristicScore}\n\nEvidence:\n${evidenceToPromptBlock(evidence)}\n\nProduce the measurement maturity JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 1500 });
  const parsed = extractJson<MeasurementPlan>(raw);
  await saveArtifact(projectId, "measurement_plan", parsed);
  return parsed;
}
