import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { buildFindingsCsvExport } from "@/lib/exporters";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const csv = await buildFindingsCsvExport(project);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "_")}_findings.csv"`,
    },
  });
}
