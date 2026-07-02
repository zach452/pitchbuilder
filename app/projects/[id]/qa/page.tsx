import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import ProjectTabs from "@/components/ProjectTabs";
import { QAItem } from "@/lib/types";

export default async function QAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const artifacts = await getAllArtifacts(id);
  const qa = artifacts.qa_items as QAItem[] | undefined;

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Q&amp;A Prep</h1>
        {!qa && (
          <p className="text-slate-500 text-sm">
            No Q&amp;A prep generated yet. Generate the pitch package from the Workspace tab.
          </p>
        )}
        <div className="space-y-3">
          {qa?.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span>
                <span className="text-xs text-slate-500">Confidence: {item.confidence}</span>
              </div>
              <h2 className="font-medium text-slate-900">{item.question}</h2>
              <p className="text-sm text-slate-700 mt-1">{item.suggested_answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
