import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, listFilesForProject } from "@/lib/projects";
import { getEvidenceForProject } from "@/lib/evidence";
import { getAllArtifacts } from "@/lib/modules/artifacts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const files = await listFilesForProject(id);
  const evidence = await getEvidenceForProject(id);
  const artifacts = await getAllArtifacts(id);
  return NextResponse.json({ project, files, evidence_count: evidence.length, artifacts });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  await updateProject(id, body);
  return NextResponse.json({ project: await getProject(id) });
}
