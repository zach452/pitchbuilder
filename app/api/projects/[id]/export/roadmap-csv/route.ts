import { NextResponse } from "next/server";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import { RoadmapItem } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artifacts = await getAllArtifacts(id);
  const rec = artifacts.recommendations as
    | { recommendations: unknown[]; roadmap: RoadmapItem[] }
    | undefined;
  const roadmap = rec?.roadmap ?? [];

  const PHASE_LABELS: Record<string, string> = {
    "30": "First 30 Days",
    "60": "Days 31–60",
    "90": "Days 61–90",
    "q2+": "Quarter 2+",
  };

  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const header =
    "Phase,Recommendation,Why It Matters,Business Impact,Complexity,Timing,Owner,KPI,Dependencies";
  const rows = roadmap.map((r) =>
    [
      esc(PHASE_LABELS[r.phase] ?? r.phase),
      esc(r.recommendation),
      esc(r.why_it_matters),
      esc(r.business_impact),
      esc(r.complexity),
      esc(r.timing),
      esc(r.owner),
      esc(r.kpi),
      esc(r.dependencies),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="roadmap-${id}.csv"`,
    },
  });
}
