import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { extractJson } from "../jsonExtract";
import { Recommendation, RoadmapItem } from "../types";
import { saveArtifact, getAllArtifacts } from "./artifacts";

export async function generateRecommendations(
  projectId: string
): Promise<{ recommendations: Recommendation[]; roadmap: RoadmapItem[] }> {
  const artifacts = getAllArtifacts(projectId);
  const system = loadPrompt("recommendations");
  const user = `All prior module outputs:\n${JSON.stringify(artifacts, null, 2).slice(
    0,
    12000
  )}\n\nProduce the recommendations JSON array now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 2000 });
  const recommendations = extractJson<Recommendation[]>(raw);

  // Build richer RoadmapItem objects from recommendations
  const roadmap: RoadmapItem[] = recommendations.map((r) => ({
    phase: r.timeframe as "30" | "60" | "90",
    recommendation: r.title,
    why_it_matters: r.rationale,
    business_impact: "Directional inference — validate with client data",
    complexity: r.priority_score >= 75 ? "Low" : r.priority_score >= 50 ? "Medium" : "High",
    timing: `Within ${r.timeframe} days`,
    owner: "Shared",
    kpi: "TBD — align in kickoff",
    dependencies: "None identified",
  }));

  saveArtifact(projectId, "recommendations", { recommendations, roadmap });
  return { recommendations, roadmap };
}
