import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getEvidenceForProject } from "@/lib/evidence";
import ProjectTabs from "@/components/ProjectTabs";
import EvidenceVault from "@/components/EvidenceVault";

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const evidence = await getEvidenceForProject(id);

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-4">
          Evidence Vault ({evidence.length})
        </h1>
        <EvidenceVault evidence={evidence} />
      </div>
    </div>
  );
}
