import { notFound } from "next/navigation";
import { getProject, listFilesForProject } from "@/lib/projects";
import ProjectTabs from "@/components/ProjectTabs";
import FileList from "@/components/FileList";

export default async function InputsPage({
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-4">Inputs</h1>
        <FileList projectId={id} files={files} />
      </div>
    </div>
  );
}
