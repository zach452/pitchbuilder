import { randomUUID } from "crypto";
import { getDb } from "./db";
import { GenerationStatus, PitchStage, Project, UploadedFile } from "./types";

export function createProject(input: {
  name: string;
  prospect_name: string;
  category?: string;
  pitch_stage?: PitchStage;
  due_date?: string;
  known_budget?: string;
  known_channels?: string;
  known_business_goals?: string;
  notes?: string;
}): Project {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const project: Project = {
    id,
    name: input.name,
    prospect_name: input.prospect_name,
    category: input.category ?? "",
    pitch_stage: input.pitch_stage ?? "rfp",
    due_date: input.due_date ?? null,
    known_budget: input.known_budget ?? null,
    known_channels: input.known_channels ?? null,
    known_business_goals: input.known_business_goals ?? null,
    notes: input.notes ?? null,
    generation_status: "idle",
    generation_step: null,
    generation_error: null,
    created_at: now,
    updated_at: now,
  };
  db.prepare(
    `INSERT INTO projects (id, name, prospect_name, category, pitch_stage, due_date, known_budget, known_channels, known_business_goals, notes, generation_status, generation_step, generation_error, created_at, updated_at)
     VALUES (@id, @name, @prospect_name, @category, @pitch_stage, @due_date, @known_budget, @known_channels, @known_business_goals, @notes, @generation_status, @generation_step, @generation_error, @created_at, @updated_at)`
  ).run(project);
  return project;
}

export function listProjects(): Project[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all() as Project[];
}

export function getProject(id: string): Project | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Project | undefined;
}

export function updateProject(id: string, fields: Partial<Project>): void {
  const db = getDb();
  const existing = getProject(id);
  if (!existing) return;
  const merged = { ...existing, ...fields, updated_at: new Date().toISOString() };
  db.prepare(
    `UPDATE projects SET name=@name, prospect_name=@prospect_name, category=@category, pitch_stage=@pitch_stage,
     due_date=@due_date, known_budget=@known_budget, known_channels=@known_channels, known_business_goals=@known_business_goals,
     notes=@notes, generation_status=@generation_status, generation_step=@generation_step, generation_error=@generation_error,
     updated_at=@updated_at WHERE id=@id`
  ).run(merged);
}

export function setGenerationStatus(
  id: string,
  status: GenerationStatus,
  step?: string | null,
  error?: string | null
): void {
  updateProject(id, {
    generation_status: status,
    generation_step: step ?? null,
    generation_error: error ?? null,
  });
}

export function listFilesForProject(projectId: string): UploadedFile[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM uploaded_files WHERE project_id = ? ORDER BY created_at ASC`)
    .all(projectId) as UploadedFile[];
}

export function getFile(id: string): UploadedFile | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM uploaded_files WHERE id = ?`).get(id) as
    | UploadedFile
    | undefined;
}
