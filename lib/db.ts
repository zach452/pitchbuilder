/**
 * lib/db.ts — unified async database adapter
 *
 * When DATABASE_URL is set → Postgres (via pg)
 * Otherwise               → SQLite in /tmp/db.sqlite (works on Vercel without Postgres)
 *
 * All SQL uses $1/$2/... positional placeholders (Postgres style).
 * The SQLite adapter normalises them to ? at call time.
 */

import fs from "fs";
import path from "path";

export interface DbAdapter {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<void>;
  migrate(): Promise<void>;
}

// ─── SQLite adapter ─────────────────────────────────────────────────────────

function makeSqliteAdapter(): DbAdapter {
  // Use /tmp on Vercel (read-only cwd), ./data locally
  const dir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, "db.sqlite");

  // Lazy-load better-sqlite3 so the module doesn't crash on import in Postgres mode
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  /** Convert Postgres-style $1, $2, ... to ? for SQLite */
  const norm = (sql: string) => sql.replace(/\$\d+/g, "?");

  return {
    async query<T>(sql: string, params: unknown[] = []) {
      return db.prepare(norm(sql)).all(...params) as T[];
    },
    async run(sql: string, params: unknown[] = []) {
      db.prepare(norm(sql)).run(...params);
    },
    async migrate() {
      db.exec(`
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
          project_id TEXT NOT NULL,
          original_name TEXT NOT NULL,
          stored_path TEXT NOT NULL,
          ext TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          source_type TEXT NOT NULL DEFAULT 'unknown',
          source_type_user_override INTEGER NOT NULL DEFAULT 0,
          detected_metadata TEXT,
          extracted_text TEXT,
          image_tags TEXT,
          extraction_status TEXT NOT NULL DEFAULT 'pending',
          extraction_error TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
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
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        CREATE TABLE IF NOT EXISTS generated_artifacts (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          module TEXT NOT NULL,
          content_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        CREATE INDEX IF NOT EXISTS idx_files_project ON uploaded_files(project_id);
        CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence(project_id);
        CREATE INDEX IF NOT EXISTS idx_artifacts_project_module ON generated_artifacts(project_id, module);
      `);
    },
  };
}

// ─── Postgres adapter ────────────────────────────────────────────────────────

function makePgAdapter(): DbAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const res = await pool.query(sql, params);
      return res.rows as T[];
    },
    async run(sql: string, params: unknown[] = []) {
      await pool.query(sql, params);
    },
    async migrate() {
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
          image_tags TEXT,
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
    },
  };
}

// ─── Singleton with auto-migrate ─────────────────────────────────────────────

let _adapter: DbAdapter | null = null;
let _migrated = false;

export async function getAdapter(): Promise<DbAdapter> {
  if (!_adapter) {
    _adapter = process.env.DATABASE_URL ? makePgAdapter() : makeSqliteAdapter();
  }
  if (!_migrated) {
    _migrated = true; // set before await to avoid race in parallel requests
    await _adapter.migrate();
  }
  return _adapter;
}

// ─── Local uploads directory helper ──────────────────────────────────────────

export function uploadsDir(projectId: string): string {
  const base = process.env.VERCEL
    ? "/tmp/uploads"
    : path.join(process.cwd(), "data", "uploads");
  const dir = path.join(base, projectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
