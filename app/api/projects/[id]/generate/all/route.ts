import { NextRequest, NextResponse } from "next/server";
import { getProject, setGenerationStatus } from "@/lib/projects";
import { runFullPipeline } from "@/lib/pipeline";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  setGenerationStatus(id, "running", "starting");
  // Fire and forget — UI polls GET /api/projects/[id] for generation_status.
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
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({
    generation_status: project.generation_status,
    generation_step: project.generation_step,
    generation_error: project.generation_error,
  });
}
