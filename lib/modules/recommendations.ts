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

  const roadmap: RoadmapItem[] = ["30", "60", "90"].map((phase) => ({
    phase: phase as "30" | "60" | "90",
    items: recommendations
      .filter((r) => r.timeframe === phase)
      .map((r) => r.title),
  }));

  saveArtifact(projectId, "recommendations", { recommendations, roadmap });
  return { recommendations, roadmap };
}
