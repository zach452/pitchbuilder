import Link from "next/link";
import { listProjects } from "@/lib/projects";
import NewProjectForm from "@/components/NewProjectForm";

export default function HomePage() {
  const projects = listProjects();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Pitch Project</h1>
        <p className="text-slate-600 mt-1">
          Create a project, upload RFPs, transcripts, platform exports, Shopify data, and
          creative scorecards, then generate a complete evidence-grounded Pitch Strategy Package.
        </p>
      </div>

      <NewProjectForm />

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Projects</h2>
        {projects.length === 0 ? (
          <p className="text-slate-500 text-sm">No projects yet. Create one above.</p>
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
            {projects.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="text-sm text-slate-500">
                    {p.prospect_name} &middot; {p.pitch_stage} &middot; status: {p.generation_status}
                  </div>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Open &rarr;
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
