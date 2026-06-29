import { NextRequest, NextResponse } from "next/server";
import { getProject, listFilesForProject } from "@/lib/projects";
import { ingestFile, updateFileSourceType } from "@/lib/ingest";
import { SourceType } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const files = listFilesForProject(id);
  return NextResponse.json({ files });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const results = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await ingestFile(id, file.name, buffer);
    results.push(uploaded);
  }

  return NextResponse.json({ files: results }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const body = await req.json();
  if (!body.file_id || !body.source_type) {
    return NextResponse.json({ error: "file_id and source_type required" }, { status: 400 });
  }
  updateFileSourceType(body.file_id, body.source_type as SourceType);
  return NextResponse.json({ ok: true });
}
