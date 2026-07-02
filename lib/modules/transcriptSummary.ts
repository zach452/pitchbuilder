import { callLLM } from "../llm";
import { loadPrompt } from "../prompts";
import { getEvidenceForProject, evidenceToPromptBlock } from "../evidence";
import { extractJson } from "../jsonExtract";
import { TranscriptSummary } from "../types";
import { saveArtifact } from "./artifacts";

export async function generateTranscriptSummary(projectId: string): Promise<TranscriptSummary | null> {
  const allEvidence = await getEvidenceForProject(projectId);
  const evidence = allEvidence.filter((e) => e.source_type === "transcript");
  if (evidence.length === 0) return null;
  const system = loadPrompt("fireflies_synthesizer");
  const user = `Transcript evidence:\n\n${evidenceToPromptBlock(evidence)}\n\nProduce the transcript synthesis JSON now.`;
  const raw = await callLLM(system, user, { jsonMode: true, maxTokens: 3000 });
  const parsed = extractJson<TranscriptSummary>(raw);
  await saveArtifact(projectId, "transcript_summary", parsed);
  return parsed;
}
