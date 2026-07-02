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
    await setGenerationStatus(projectId, "running", "rfp_summary");
    await generateRfpSummary(projectId);

    await setGenerationStatus(projectId, "running", "transcript_summary");
    await generateTranscriptSummary(projectId);

    await setGenerationStatus(projectId, "running", "paid_media_audit");
    await generatePaidMediaAudit(projectId);

    await setGenerationStatus(projectId, "running", "creative_audit");
    await generateCreativeAudit(projectId);

    await setGenerationStatus(projectId, "running", "shopify_analysis");
    await generateShopifyAnalysis(projectId);

    await setGenerationStatus(projectId, "running", "business_diagnosis");
    await generateBusinessDiagnosis(projectId);

    await setGenerationStatus(projectId, "running", "measurement_maturity");
    await generateMeasurementMaturity(projectId);

    await setGenerationStatus(projectId, "running", "win_strategy");
    await generateWinStrategy(projectId);

    await setGenerationStatus(projectId, "running", "recommendations");
    await generateRecommendations(projectId);

    await setGenerationStatus(projectId, "running", "slides");
    const slides = await generateSlides(projectId);

    await setGenerationStatus(projectId, "running", "talk_tracks");
    await generateTalkTracks(projectId, slides);

    await setGenerationStatus(projectId, "running", "qa_prep");
    await generateQAPrep(projectId);

    await setGenerationStatus(projectId, "running", "four_cs");
    await generateFourCs(projectId);

    await setGenerationStatus(projectId, "running", "critique");
    await generatePitchCritique(projectId);

    await setGenerationStatus(projectId, "done", "complete");
  } catch (err) {
    await setGenerationStatus(
      projectId, "error", null,
      err instanceof Error ? err.message : String(err)
    );
  }
}
