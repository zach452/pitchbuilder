import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { extractJson } from "../jsonExtract";
import { WinStrategy } from "../types";
import { saveArtifact, getAllArtifacts } from "./artifacts";

export async function generateWinStrategy(projectId: string): Promise<WinStrategy> {
  const artifacts = await getAllArtifacts(projectId);
  const system = loadPrompt("win_strategy");
  const user = `All prior module outputs for this project:\n${JSON.stringify(artifacts, null, 2).slice(0, 12000)}\n\nProduce the win strategy JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const parsed = extractJson<WinStrategy>(raw);
  await saveArtifact(projectId, "win_strategy", parsed);
  return parsed;
}
