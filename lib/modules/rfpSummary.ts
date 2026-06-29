import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { getEvidenceForProject, evidenceToPromptBlock } from "../evidence";
import { extractJson } from "../jsonExtract";
import { RfpSummary } from "../types";
import { saveArtifact } from "./artifacts";

export async function generateRfpSummary(projectId: string): Promise<RfpSummary> {
  const evidence = getEvidenceForProject(projectId).filter((e) => e.source_type === "rfp");
  const allEvidence = evidence.length ? evidence : getEvidenceForProject(projectId);
  const system = loadPrompt("rfp_decoder");
  const user = `Project evidence (RFP-tagged where available, otherwise all evidence):\n\n${evidenceToPromptBlock(
    allEvidence
  )}\n\nProduce the RFP decode JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const parsed = extractJson<RfpSummary>(raw);
  saveArtifact(projectId, "rfp_summary", parsed);
  return parsed;
}
