import { NextRequest, NextResponse } from "next/server";
import { getEvidenceForProject } from "@/lib/evidence";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const evidence = getEvidenceForProject(id);
  return NextResponse.json({ evidence });
}
