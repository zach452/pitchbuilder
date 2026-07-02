import { notFound } from "next/navigation";
import { getProject, listFilesForProject } from "@/lib/projects";
import ProjectTabs from "@/components/ProjectTabs";
import UploadPanel from "@/components/UploadPanel";
import GeneratePanel from "@/components/GeneratePanel";

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const files = await listFilesForProject(id);

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-600">
            {project.prospect_name} &middot; {project.category} &middot; stage:{" "}
            {project.pitch_stage.replace(/_/g, " ")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadPanel projectId={id} initialFileCount={files.length} />
          <GeneratePanel projectId={id} initialStatus={project.generation_status} />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Project Notes</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {project.notes || "No manual notes recorded."}
          </p>
        </div>
      </div>
    </div>
  );
}
