import { randomUUID } from "crypto";
import { getAdapter } from "../db";

export async function saveArtifact(projectId: string, module: string, content: unknown): Promise<void> {
  const db = await getAdapter();
  const id = randomUUID();
  const now = new Date().toISOString();
  // Upsert by deleting any existing artifact for this module first (keep latest only).
  await db.run(
    `DELETE FROM generated_artifacts WHERE project_id = $1 AND module = $2`,
    [projectId, module]
  );
  await db.run(
    `INSERT INTO generated_artifacts (id, project_id, module, content_json, created_at) VALUES ($1, $2, $3, $4, $5)`,
    [id, projectId, module, JSON.stringify(content), now]
  );
}

export async function getArtifact<T = unknown>(projectId: string, module: string): Promise<T | null> {
  const db = await getAdapter();
  const rows = await db.query<{ content_json: string }>(
    `SELECT content_json FROM generated_artifacts WHERE project_id = $1 AND module = $2 ORDER BY created_at DESC LIMIT 1`,
    [projectId, module]
  );
  if (!rows[0]) return null;
  return JSON.parse(rows[0].content_json) as T;
}

export async function getAllArtifacts(projectId: string): Promise<Record<string, unknown>> {
  const db = await getAdapter();
  const rows = await db.query<{ module: string; content_json: string }>(
    `SELECT module, content_json FROM generated_artifacts WHERE project_id = $1`,
    [projectId]
  );
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.module] = JSON.parse(row.content_json);
  }
  return result;
}
