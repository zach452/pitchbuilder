// Core domain types for the Sales Pitch Intelligence System

export type PitchStage =
  | "rfp"
  | "discovery"
  | "chemistry_meeting"
  | "follow_up"
  | "final_pitch"
  | "audit_readout";

export type SourceType =
  | "rfp"
  | "transcript"
  | "platform_meta"
  | "platform_google"
  | "platform_tiktok"
  | "platform_youtube"
  | "platform_applovin"
  | "shopify"
  | "creative_scorecard"
  | "screenshot"
  | "prior_pitch"
  | "brand_research"
  | "unknown";

export type Confidence = "High" | "Medium" | "Low" | "Missing";

export type GenerationStatus =
  | "idle"
  | "running"
  | "done"
  | "error";

export interface Project {
  id: string;
  name: string;
  prospect_name: string;
  category: string;
  pitch_stage: PitchStage;
  due_date: string | null;
  known_budget: string | null;
  known_channels: string | null;
  known_business_goals: string | null;
  notes: string | null;
  generation_status: GenerationStatus;
  generation_step: string | null;
  generation_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  id: string;
  project_id: string;
  original_name: string;
  stored_path: string;
  ext: string;
  size_bytes: number;
  source_type: SourceType;
  source_type_user_override: number; // 0/1
  detected_metadata: string | null; // JSON string
  extracted_text: string | null;
  extraction_status: "pending" | "done" | "error";
  extraction_error: string | null;
  created_at: string;
}

export interface Evidence {
  id: string;
  project_id: string;
  source_file: string;
  source_type: SourceType;
  page_or_sheet: string | null;
  row_or_section: string | null;
  extracted_text: string;
  metric_name: string | null;
  metric_value: string | null;
  date_range: string | null;
  confidence: Confidence;
  tags: string; // comma separated
  created_at: string;
}

export interface GeneratedArtifact {
  id: string;
  project_id: string;
  module: string; // e.g. 'rfp_summary'
  content_json: string; // JSON blob of structured content
  created_at: string;
}

export interface Slide {
  slide_number: number;
  slide_title: string;
  slide_type: string;
  key_message: string;
  supporting_points: string[];
  recommended_visual: string;
  data_needed: string;
  source_evidence_ids: string[];
  talk_track: string;
  design_notes: string;
  confidence: Confidence;
  risk_or_caveat: string;
}

export interface TalkTrack {
  slide_number: number;
  thirty_sec: string;
  sixty_sec: string;
}

export interface QAItem {
  question: string;
  category: string;
  suggested_answer: string;
  confidence: Confidence;
  source_evidence_ids: string[];
}

export interface RfpSummary {
  executive_summary: string;
  business_objectives: string[];
  required_capabilities: string[];
  stated_kpis: string[];
  budget_parameters: string;
  timing: string;
  channels_requested: string[];
  deliverables: string[];
  decision_criteria: string[];
  stakeholder_priorities: string[];
  explicit_questions: string[];
  hidden_questions: string[];
  risks: string[];
  win_conditions: string[];
  lose_conditions: string[];
  source_evidence_ids: string[];
}

export interface TranscriptSummary {
  what_we_heard: string[];
  what_they_really_need: string[];
  unspoken_concerns: string[];
  stakeholder_map: { name: string; role: string; priorities: string }[];
  language_to_reuse: string[];
  follow_up_questions: string[];
  pitch_narrative_implications: string[];
  source_evidence_ids: string[];
}

export interface BusinessDiagnosis {
  diagnosis_paragraph: string;
  business_model: string;
  customer: string;
  objectives: string;
  market: string;
  measurement_reality: string;
  growth_levers: string[];
  blockers: string[];
  lead_with: string[];
  proof_needed: string[];
  source_evidence_ids: string[];
}

export interface PaidMediaAuditFinding {
  headline: string;
  severity: "High" | "Medium" | "Low";
  business_impact: string;
  recommendation: string;
  slide_ready_headline: string;
  talk_track: string;
  source_evidence_ids: string[];
}

export interface CreativeAssetScore {
  asset_name: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  notes: string;
}

export interface ShopifyFinding {
  headline: string;
  severity: "High" | "Medium" | "Low";
  detail: string;
  recommendation: string;
  source_evidence_ids: string[];
}

export interface MeasurementPlan {
  maturity_score: 1 | 2 | 3 | 4 | 5;
  rationale: string;
  roadmap: string[];
}

export interface WinStrategy {
  winning_thesis: string;
  pillars: {
    title: string;
    problem: string;
    opportunity: string;
    recommendation: string;
    proof: string;
    impact: string;
  }[];
  push_into: string[];
  avoid: string[];
  differentiation: string;
  red_thread: string;
  confidence_level: "High" | "Medium" | "Low";
  deal_risks: string[];
  required_proof_points: string[];
  source_evidence_ids: string[];
}

export interface Recommendation {
  title: string;
  rationale: string;
  priority_score: number;
  timeframe: "30" | "60" | "90";
  source_evidence_ids: string[];
}

export interface RoadmapItem {
  phase: "30" | "60" | "90";
  items: string[];
}

export interface PitchPackage {
  rfp_summary?: RfpSummary;
  transcript_summary?: TranscriptSummary;
  business_diagnosis?: BusinessDiagnosis;
  paid_media_findings?: PaidMediaAuditFinding[];
  creative_scores?: CreativeAssetScore[];
  shopify_findings?: ShopifyFinding[];
  measurement_plan?: MeasurementPlan;
  win_strategy?: WinStrategy;
  recommendations?: Recommendation[];
  roadmap?: RoadmapItem[];
  slides?: Slide[];
  talk_tracks?: TalkTrack[];
  qa_items?: QAItem[];
}
