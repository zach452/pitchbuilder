import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { getEvidenceForProject } from "@/lib/evidence";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const evidence = await getEvidenceForProject(id);
  return NextResponse.json({ evidence });
}
