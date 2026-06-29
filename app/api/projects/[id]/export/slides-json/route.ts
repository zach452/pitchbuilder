import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { buildSlidesJsonExport } from "@/lib/exporters";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = buildSlidesJsonExport(project);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "_")}_slides.json"`,
    },
  });
}
