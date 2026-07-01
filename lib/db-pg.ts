/**
 * PostgreSQL adapter for production (Vercel) deployment.
 * Used automatically when DATABASE_URL env var is set.
 * Schema mirrors the SQLite tables in lib/db.ts.
 */

import { Pool } from "pg";

let _pool: Pool | null = null;

export function getPgPool(): Pool {
  if (_pool) return _pool;
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

/** Run all CREATE TABLE IF NOT EXISTS statements against Postgres. */
export async function migratePg(): Promise<void> {
  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prospect_name TEXT NOT NULL,
      category TEXT,
      pitch_stage TEXT NOT NULL DEFAULT 'rfp',
      due_date TEXT,
      known_budget TEXT,
      known_channels TEXT,
      known_business_goals TEXT,
      notes TEXT,
      generation_status TEXT NOT NULL DEFAULT 'idle',
      generation_step TEXT,
      generation_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      original_name TEXT NOT NULL,
      stored_path TEXT NOT NULL,
      ext TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'unknown',
      source_type_user_override INTEGER NOT NULL DEFAULT 0,
      detected_metadata TEXT,
      extracted_text TEXT,
      image_tags JSONB,
      extraction_status TEXT NOT NULL DEFAULT 'pending',
      extraction_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      source_file TEXT NOT NULL,
      source_type TEXT NOT NULL,
      page_or_sheet TEXT,
      row_or_section TEXT,
      extracted_text TEXT NOT NULL,
      metric_name TEXT,
      metric_value TEXT,
      date_range TEXT,
      confidence TEXT NOT NULL DEFAULT 'Medium',
      tags TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generated_artifacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      module TEXT NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_files_project ON uploaded_files(project_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence(project_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_project_module ON generated_artifacts(project_id, module);
  `);
}

/** Thin synchronous-style wrapper — all Pg calls go through this pool directly. */
export async function pgQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPgPool();
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

export async function pgRun(sql: string, params?: unknown[]): Promise<void> {
  const pool = getPgPool();
  await pool.query(sql, params);
}
