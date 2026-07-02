import { randomUUID } from "crypto";
import { getAdapter } from "./db";
import { GenerationStatus, PitchStage, Project, UploadedFile } from "./types";

export async function createProject(input: {
  name: string;
  prospect_name: string;
  category?: string;
  pitch_stage?: PitchStage;
  due_date?: string;
  known_budget?: string;
  known_channels?: string;
  known_business_goals?: string;
  notes?: string;
}): Promise<Project> {
  const db = await getAdapter();
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
  await db.run(
    `INSERT INTO projects (id, name, prospect_name, category, pitch_stage, due_date, known_budget, known_channels, known_business_goals, notes, generation_status, generation_step, generation_error, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      id, project.name, project.prospect_name, project.category, project.pitch_stage,
      project.due_date, project.known_budget, project.known_channels,
      project.known_business_goals, project.notes, project.generation_status,
      project.generation_step, project.generation_error, project.created_at, project.updated_at,
    ]
  );
  return project;
}

export async function listProjects(): Promise<Project[]> {
  const db = await getAdapter();
  return db.query<Project>(`SELECT * FROM projects ORDER BY created_at DESC`);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getAdapter();
  const rows = await db.query<Project>(`SELECT * FROM projects WHERE id = $1`, [id]);
  return rows[0];
}

export async function updateProject(id: string, fields: Partial<Project>): Promise<void> {
  const existing = await getProject(id);
  if (!existing) return;
  const merged = { ...existing, ...fields, updated_at: new Date().toISOString() };
  const db = await getAdapter();
  await db.run(
    `UPDATE projects SET name=$1, prospect_name=$2, category=$3, pitch_stage=$4,
     due_date=$5, known_budget=$6, known_channels=$7, known_business_goals=$8,
     notes=$9, generation_status=$10, generation_step=$11, generation_error=$12,
     updated_at=$13 WHERE id=$14`,
    [
      merged.name, merged.prospect_name, merged.category, merged.pitch_stage,
      merged.due_date, merged.known_budget, merged.known_channels, merged.known_business_goals,
      merged.notes, merged.generation_status, merged.generation_step, merged.generation_error,
      merged.updated_at, id,
    ]
  );
}

export async function setGenerationStatus(
  id: string,
  status: GenerationStatus,
  step?: string | null,
  error?: string | null
): Promise<void> {
  await updateProject(id, {
    generation_status: status,
    generation_step: step ?? null,
    generation_error: error ?? null,
  });
}

export async function listFilesForProject(projectId: string): Promise<UploadedFile[]> {
  const db = await getAdapter();
  return db.query<UploadedFile>(
    `SELECT * FROM uploaded_files WHERE project_id = $1 ORDER BY created_at ASC`,
    [projectId]
  );
}

export async function getFile(id: string): Promise<UploadedFile | undefined> {
  const db = await getAdapter();
  const rows = await db.query<UploadedFile>(
    `SELECT * FROM uploaded_files WHERE id = $1`,
    [id]
  );
  return rows[0];
}
