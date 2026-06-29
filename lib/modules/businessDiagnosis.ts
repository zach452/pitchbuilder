import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { getEvidenceForProject, evidenceToPromptBlock } from "../evidence";
import { extractJson } from "../jsonExtract";
import { BusinessDiagnosis } from "../types";
import { saveArtifact } from "./artifacts";

export async function generateBusinessDiagnosis(projectId: string): Promise<BusinessDiagnosis> {
  const evidence = getEvidenceForProject(projectId);
  const system = loadPrompt("business_diagnosis");
  const user = `All project evidence:\n\n${evidenceToPromptBlock(evidence)}\n\nProduce the business diagnosis JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const parsed = extractJson<BusinessDiagnosis>(raw);
  saveArtifact(projectId, "business_diagnosis", parsed);
  return parsed;
}
