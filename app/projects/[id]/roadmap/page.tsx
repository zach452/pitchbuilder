import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import ProjectTabs from "@/components/ProjectTabs";
import RoadmapView from "@/components/RoadmapView";
import { Recommendation, RoadmapItem } from "@/lib/types";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const artifacts = await getAllArtifacts(id);
  const rec = artifacts.recommendations as
    | { recommendations: Recommendation[]; roadmap: RoadmapItem[] }
    | undefined;

  const roadmap = rec?.roadmap ?? [];

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">30 / 60 / 90 Roadmap</h1>
          {roadmap.length > 0 && (
            <a
              href={`/api/projects/${id}/export/roadmap-csv`}
              className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
            >
              Export CSV
            </a>
          )}
        </div>
        {roadmap.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No roadmap generated yet. Generate the pitch package from the Workspace tab.
          </p>
        ) : (
          <RoadmapView roadmap={roadmap} />
        )}
      </div>
    </div>
  );
}
