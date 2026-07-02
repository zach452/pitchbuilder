import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { extractJson } from "../jsonExtract";
import { FourCsAnalysis } from "../types";
import { saveArtifact, getAllArtifacts } from "./artifacts";
import { evidenceToPromptBlock, getEvidenceForProject } from "../evidence";

export async function generateFourCs(projectId: string): Promise<FourCsAnalysis> {
  const artifacts = await getAllArtifacts(projectId);
  const evidence = await getEvidenceForProject(projectId);
  const system = loadPrompt("four_cs");
  const evidenceBlock = evidenceToPromptBlock(evidence, 120);

  const user = `## Evidence Vault (extracted from uploaded materials)
${evidenceBlock}

## Prior module outputs
${JSON.stringify({ rfp_summary: artifacts.rfp_summary, transcript_summary: artifacts.transcript_summary, business_diagnosis: artifacts.business_diagnosis }, null, 2).slice(0, 6000)}

Produce the Four C's + Comms Compass + SOAP JSON now.`;

  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const result = extractJson<FourCsAnalysis>(raw);
  await saveArtifact(projectId, "four_cs", result);
  return result;
}
