import { randomUUID } from "crypto";
import { getDb } from "./db";
import { Confidence, Evidence, SourceType } from "./types";

export function createEvidence(input: {
  project_id: string;
  source_file: string;
  source_type: SourceType;
  page_or_sheet?: string | null;
  row_or_section?: string | null;
  extracted_text: string;
  metric_name?: string | null;
  metric_value?: string | null;
  date_range?: string | null;
  confidence?: Confidence;
  tags?: string[];
}): Evidence {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const row: Evidence = {
    id,
    project_id: input.project_id,
    source_file: input.source_file,
    source_type: input.source_type,
    page_or_sheet: input.page_or_sheet ?? null,
    row_or_section: input.row_or_section ?? null,
    extracted_text: input.extracted_text,
    metric_name: input.metric_name ?? null,
    metric_value: input.metric_value ?? null,
    date_range: input.date_range ?? null,
    confidence: input.confidence ?? "Medium",
    tags: (input.tags ?? []).join(","),
    created_at: now,
  };
  db.prepare(
    `INSERT INTO evidence (id, project_id, source_file, source_type, page_or_sheet, row_or_section, extracted_text, metric_name, metric_value, date_range, confidence, tags, created_at)
     VALUES (@id, @project_id, @source_file, @source_type, @page_or_sheet, @row_or_section, @extracted_text, @metric_name, @metric_value, @date_range, @confidence, @tags, @created_at)`
  ).run(row);
  return row;
}

export function getEvidenceForProject(projectId: string): Evidence[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM evidence WHERE project_id = ? ORDER BY created_at ASC`)
    .all(projectId) as Evidence[];
}

export function evidenceToPromptBlock(evidence: Evidence[], limit = 200): string {
  return evidence
    .slice(0, limit)
    .map(
      (e) =>
        `[evidence_id=${e.id}] source=${e.source_file} type=${e.source_type} confidence=${e.confidence}${
          e.metric_name ? ` metric=${e.metric_name}=${e.metric_value}` : ""
        }\n${e.extracted_text.slice(0, 600)}`
    )
    .join("\n---\n");
}
