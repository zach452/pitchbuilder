import { NextRequest, NextResponse } from "next/server";
import { getProject, listFilesForProject } from "@/lib/projects";
import { ingestFile, updateFileSourceType, updateFileImageTags } from "@/lib/ingest";
import { ImageTags, SourceType } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const files = await listFilesForProject(id);
  return NextResponse.json({ files });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
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
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  if (!body.file_id) {
    return NextResponse.json({ error: "file_id required" }, { status: 400 });
  }
  if (body.image_tags) {
    await updateFileImageTags(body.file_id, body.image_tags as ImageTags);
  } else if (body.source_type) {
    await updateFileSourceType(body.file_id, body.source_type as SourceType);
  } else {
    return NextResponse.json({ error: "source_type or image_tags required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
