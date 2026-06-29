import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import ProjectTabs from "@/components/ProjectTabs";
import { Slide, TalkTrack } from "@/lib/types";

export default async function SlidesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const artifacts = getAllArtifacts(id);
  const slides = artifacts.slides as Slide[] | undefined;
  const talkTracks = artifacts.talk_tracks as TalkTrack[] | undefined;

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Slide Builder</h1>
          {slides && (
            <div className="flex gap-3">
              <a
                href={`/api/projects/${id}/export/markdown`}
                className="text-sm text-blue-600 hover:underline"
              >
                Export Markdown
              </a>
              <a
                href={`/api/projects/${id}/export/slides-json`}
                className="text-sm text-blue-600 hover:underline"
              >
                Export Slides JSON
              </a>
            </div>
          )}
        </div>

        {!slides && (
          <p className="text-slate-500 text-sm">
            No slide outline yet. Generate the pitch package from the Workspace tab.
          </p>
        )}

        <div className="space-y-4">
          {slides?.map((s) => {
            const track = talkTracks?.find((t) => t.slide_number === s.slide_number);
            return (
              <div key={s.slide_number} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-slate-900">
                    {s.slide_number}. {s.slide_title}
                  </h2>
                  <span className="text-xs text-slate-500">{s.slide_type}</span>
                </div>
                <p className="text-sm text-slate-800 font-medium mb-2">{s.key_message}</p>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mb-2">
                  {s.supporting_points?.map((p, idx) => <li key={idx}>{p}</li>)}
                </ul>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 mb-2">
                  <div>
                    <span className="font-medium">Visual:</span> {s.recommended_visual}
                  </div>
                  <div>
                    <span className="font-medium">Data needed:</span> {s.data_needed}
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span> {s.confidence}
                  </div>
                  <div>
                    <span className="font-medium">Risk/caveat:</span> {s.risk_or_caveat}
                  </div>
                </div>
                {track && (
                  <div className="bg-slate-50 rounded-md p-3 text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-medium">30s talk track:</span> {track.thirty_sec}
                    </div>
                    <div>
                      <span className="font-medium">60s talk track:</span> {track.sixty_sec}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
