import { randomUUID } from "crypto";
import { getDb } from "../db";

export function saveArtifact(projectId: string, module: string, content: unknown): void {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  // Upsert by deleting any existing artifact for this module first (keep latest only).
  db.prepare(`DELETE FROM generated_artifacts WHERE project_id = ? AND module = ?`).run(
    projectId,
    module
  );
  db.prepare(
    `INSERT INTO generated_artifacts (id, project_id, module, content_json, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, projectId, module, JSON.stringify(content), now);
}

export function getArtifact<T = unknown>(projectId: string, module: string): T | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT content_json FROM generated_artifacts WHERE project_id = ? AND module = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(projectId, module) as { content_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.content_json) as T;
}

export function getAllArtifacts(projectId: string): Record<string, unknown> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT module, content_json FROM generated_artifacts WHERE project_id = ?`
    )
    .all(projectId) as { module: string; content_json: string }[];
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.module] = JSON.parse(row.content_json);
  }
  return result;
}
