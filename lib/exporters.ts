import { Project } from "./types";
import { getAllArtifacts } from "./modules/artifacts";
import {
  RfpSummary, TranscriptSummary, BusinessDiagnosis, WinStrategy,
  Slide, TalkTrack, PaidMediaAuditFinding, ShopifyFinding, Recommendation,
} from "./types";

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}\n`;
}

function list(items?: string[]): string {
  if (!items || items.length === 0) return "_None recorded._";
  return items.map((i) => `- ${i}`).join("\n");
}

export async function buildMarkdownExport(project: Project): Promise<string> {
  const artifacts = await getAllArtifacts(project.id);
  const rfp = artifacts.rfp_summary as RfpSummary | undefined;
  const transcript = artifacts.transcript_summary as TranscriptSummary | undefined;
  const diagnosis = artifacts.business_diagnosis as BusinessDiagnosis | undefined;
  const paidMedia = artifacts.paid_media_findings as { findings: PaidMediaAuditFinding[] } | undefined;
  const shopify = artifacts.shopify_findings as { findings: ShopifyFinding[] } | undefined;
  const winStrategy = artifacts.win_strategy as WinStrategy | undefined;
  const recs = artifacts.recommendations as { recommendations: Recommendation[] } | undefined;
  const slides = artifacts.slides as Slide[] | undefined;

  let md = `# Pitch Strategy Package: ${project.name}\n\n`;
  md += `**Prospect:** ${project.prospect_name}  \n**Category:** ${project.category}  \n**Pitch Stage:** ${project.pitch_stage}  \n**Due Date:** ${project.due_date ?? "Not set"}\n\n`;

  if (rfp) {
    md += section("RFP Summary", rfp.executive_summary);
    md += section("Business Objectives", list(rfp.business_objectives));
    md += section("Stated KPIs", list(rfp.stated_kpis));
    md += section("Win Conditions", list(rfp.win_conditions));
    md += section("Lose Conditions", list(rfp.lose_conditions));
    md += section("Hidden Questions", list(rfp.hidden_questions));
  }
  if (transcript) {
    md += section("What We Heard", list(transcript.what_we_heard));
    md += section("What They Really Need", list(transcript.what_they_really_need));
  }
  if (diagnosis) {
    md += section("Business Diagnosis", diagnosis.diagnosis_paragraph);
    md += section("Growth Levers", list(diagnosis.growth_levers));
    md += section("Blockers", list(diagnosis.blockers));
  }
  if (paidMedia?.findings) {
    md += `## Paid Media Audit Findings\n\n`;
    for (const f of paidMedia.findings) {
      md += `**${f.headline}** (${f.severity})\n\n${f.business_impact}\n\n_Recommendation:_ ${f.recommendation}\n\n`;
    }
  }
  if (shopify?.findings) {
    md += `## Shopify / Business Health Findings\n\n`;
    for (const f of shopify.findings) {
      md += `**${f.headline}** (${f.severity})\n\n${f.detail}\n\n_Recommendation:_ ${f.recommendation}\n\n`;
    }
  }
  if (winStrategy) {
    md += section("Winning Thesis", winStrategy.winning_thesis);
    md += `## Strategic Pillars\n\n`;
    for (const p of winStrategy.pillars) {
      md += `### ${p.title}\n- Problem: ${p.problem}\n- Opportunity: ${p.opportunity}\n- Recommendation: ${p.recommendation}\n- Proof: ${p.proof}\n- Impact: ${p.impact}\n\n`;
    }
    md += section("Deal Risks", list(winStrategy.deal_risks));
  }
  if (recs?.recommendations) {
    md += `## Recommendations\n\n`;
    for (const r of recs.recommendations) {
      md += `- **[${r.timeframe} days]** ${r.title} (priority ${r.priority_score}) — ${r.rationale}\n`;
    }
    md += "\n";
  }
  if (slides) {
    md += `## Slide Outline\n\n`;
    for (const s of slides) {
      md += `### Slide ${s.slide_number}: ${s.slide_title}\n**Key message:** ${s.key_message}\n\n${list(s.supporting_points)}\n\n_Talk track:_ ${s.talk_track}\n\n`;
    }
  }
  return md;
}

export async function buildSlidesJsonExport(project: Project): Promise<string> {
  const artifacts = await getAllArtifacts(project.id);
  const slides = artifacts.slides as Slide[] | undefined;
  const talkTracks = artifacts.talk_tracks as TalkTrack[] | undefined;
  return JSON.stringify({ project: project.name, slides, talk_tracks: talkTracks }, null, 2);
}

export async function buildFindingsCsvExport(project: Project): Promise<string> {
  const artifacts = await getAllArtifacts(project.id);
  const paidMedia = (artifacts.paid_media_findings as { findings: PaidMediaAuditFinding[] } | undefined)?.findings ?? [];
  const shopify = (artifacts.shopify_findings as { findings: ShopifyFinding[] } | undefined)?.findings ?? [];

  const rows: string[] = ["type,headline,severity,detail,recommendation"];
  for (const f of paidMedia) {
    rows.push(csvRow(["paid_media", f.headline, f.severity, f.business_impact, f.recommendation]));
  }
  for (const f of shopify) {
    rows.push(csvRow(["shopify", f.headline, f.severity, f.detail, f.recommendation]));
  }
  return rows.join("\n");
}

function csvRow(values: string[]): string {
  return values.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(",");
}
