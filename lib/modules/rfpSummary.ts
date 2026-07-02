import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { getEvidenceForProject, evidenceToPromptBlock } from "../evidence";
import { extractJson } from "../jsonExtract";
import { RfpSummary } from "../types";
import { saveArtifact } from "./artifacts";

export async function generateRfpSummary(projectId: string): Promise<RfpSummary> {
  const allEvidence = await getEvidenceForProject(projectId);
  const evidence = allEvidence.filter((e) => e.source_type === "rfp");
  const useEvidence = evidence.length ? evidence : allEvidence;
  const system = loadPrompt("rfp_decoder");
  const user = `Project evidence (RFP-tagged where available, otherwise all evidence):\n\n${evidenceToPromptBlock(useEvidence)}\n\nProduce the RFP decode JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const parsed = extractJson<RfpSummary>(raw);
  await saveArtifact(projectId, "rfp_summary", parsed);
  return parsed;
}
