import { NextRequest, NextResponse } from "next/server";
import { getProject, setGenerationStatus } from "@/lib/projects";
import { runFullPipeline } from "@/lib/pipeline";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: process.env.DATABASE_URL ? "Project not found." : "Project not found — set DATABASE_URL (Vercel Postgres) so data persists across serverless requests." }, { status: 404 });

  await setGenerationStatus(id, "running", "starting");
  runFullPipeline(id).catch(() => {
    // errors are persisted to the project row inside runFullPipeline
  });

  return NextResponse.json({ ok: true, status: "running" });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: process.env.DATABASE_URL ? "Project not found." : "Project not found — set DATABASE_URL (Vercel Postgres) so data persists across serverless requests." }, { status: 404 });
  return NextResponse.json({
    generation_status: project.generation_status,
    generation_step: project.generation_step,
    generation_error: project.generation_error,
  });
}
