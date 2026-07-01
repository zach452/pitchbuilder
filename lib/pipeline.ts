import { setGenerationStatus } from "./projects";
import { generateRfpSummary } from "./modules/rfpSummary";
import { generateTranscriptSummary } from "./modules/transcriptSummary";
import { generateBusinessDiagnosis } from "./modules/businessDiagnosis";
import { generatePaidMediaAudit } from "./modules/paidMediaAudit";
import { generateCreativeAudit } from "./modules/creativeAudit";
import { generateShopifyAnalysis } from "./modules/shopifyAnalysis";
import { generateMeasurementMaturity } from "./modules/measurementMaturity";
import { generateWinStrategy } from "./modules/winStrategy";
import { generateRecommendations } from "./modules/recommendations";
import { generateSlides, generateTalkTracks } from "./modules/slideArchitect";
import { generateQAPrep } from "./modules/qaPrep";
import { generateFourCs } from "./modules/fourCs";
import { generatePitchCritique } from "./modules/pitchCritique";

export async function runFullPipeline(projectId: string): Promise<void> {
  try {
    setGenerationStatus(projectId, "running", "rfp_summary");
    await generateRfpSummary(projectId);

    setGenerationStatus(projectId, "running", "transcript_summary");
    await generateTranscriptSummary(projectId);

    setGenerationStatus(projectId, "running", "paid_media_audit");
    await generatePaidMediaAudit(projectId);

    setGenerationStatus(projectId, "running", "creative_audit");
    await generateCreativeAudit(projectId);

    setGenerationStatus(projectId, "running", "shopify_analysis");
    await generateShopifyAnalysis(projectId);

    setGenerationStatus(projectId, "running", "business_diagnosis");
    await generateBusinessDiagnosis(projectId);

    setGenerationStatus(projectId, "running", "measurement_maturity");
    await generateMeasurementMaturity(projectId);

    setGenerationStatus(projectId, "running", "win_strategy");
    await generateWinStrategy(projectId);

    setGenerationStatus(projectId, "running", "recommendations");
    await generateRecommendations(projectId);

    setGenerationStatus(projectId, "running", "slides");
    const slides = await generateSlides(projectId);

    setGenerationStatus(projectId, "running", "talk_tracks");
    await generateTalkTracks(projectId, slides);

    setGenerationStatus(projectId, "running", "qa_prep");
    await generateQAPrep(projectId);

    setGenerationStatus(projectId, "running", "four_cs");
    await generateFourCs(projectId);

    setGenerationStatus(projectId, "running", "critique");
    await generatePitchCritique(projectId);

    setGenerationStatus(projectId, "done", "complete");
  } catch (err) {
    setGenerationStatus(
      projectId,
      "error",
      null,
      err instanceof Error ? err.message : String(err)
    );
  }
}
