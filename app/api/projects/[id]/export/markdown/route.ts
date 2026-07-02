import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { buildMarkdownExport } from "@/lib/exporters";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const markdown = await buildMarkdownExport(project);
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "_")}_pitch_package.md"`,
    },
  });
}
