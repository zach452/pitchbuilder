import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { extractJson } from "../jsonExtract";
import { QAItem } from "../types";
import { saveArtifact, getAllArtifacts } from "./artifacts";

export async function generateQAPrep(projectId: string): Promise<QAItem[]> {
  const artifacts = getAllArtifacts(projectId);
  const system = loadPrompt("anticipated_qa");
  const user = `All prior module outputs:\n${JSON.stringify(artifacts, null, 2).slice(
    0,
    12000
  )}\n\nProduce the anticipated Q&A JSON array now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 2500 });
  const qa = extractJson<QAItem[]>(raw);
  saveArtifact(projectId, "qa_items", qa);
  return qa;
}
