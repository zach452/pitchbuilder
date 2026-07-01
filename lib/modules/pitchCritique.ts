import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { extractJson } from "../jsonExtract";
import { PitchCritique } from "../types";
import { saveArtifact, getAllArtifacts } from "./artifacts";

export async function generatePitchCritique(projectId: string): Promise<PitchCritique> {
  const artifacts = getAllArtifacts(projectId);
  const system = loadPrompt("pitch_critique");
  const user = `## Full Pitch Package (all modules)
${JSON.stringify(artifacts, null, 2).slice(0, 14000)}

Score and critique this pitch package now. Return valid JSON.`;

  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const result = extractJson<PitchCritique>(raw);

  // Ensure overall_score is populated as average of numeric scores
  if (result.scores && typeof result.overall_score !== "number") {
    const vals = Object.values(result.scores).filter((v) => typeof v === "number") as number[];
    result.overall_score = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : 0;
  }

  saveArtifact(projectId, "critique", result);
  return result;
}
