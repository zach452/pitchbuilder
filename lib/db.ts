import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.sqlite");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
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
  _db = db;
  return db;
}

export function uploadsDir(projectId: string): string {
  const dir = path.join(DATA_DIR, "uploads", projectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
