"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SourceType, UploadedFile } from "@/lib/types";

const SOURCE_TYPES: SourceType[] = [
  "rfp",
  "transcript",
  "platform_meta",
  "platform_google",
  "platform_tiktok",
  "platform_youtube",
  "platform_applovin",
  "shopify",
  "creative_scorecard",
  "screenshot",
  "prior_pitch",
  "brand_research",
  "unknown",
];

export default function FileList({
  projectId,
  files,
}: {
  projectId: string;
  files: UploadedFile[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  async function changeType(fileId: string, sourceType: string) {
    await fetch(`/api/projects/${projectId}/files`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, source_type: sourceType }),
    });
    router.refresh();
  }

  if (files.length === 0) {
    return <p className="text-slate-500 text-sm">No files uploaded yet.</p>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
      {files.map((f) => {
        let metadata: Record<string, unknown> = {};
        try {
          metadata = f.detected_metadata ? JSON.parse(f.detected_metadata) : {};
        } catch {
          // ignore
        }
        return (
          <div key={f.id} className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-medium text-slate-900">{f.original_name}</div>
                <div className="text-xs text-slate-500">
                  {f.ext} &middot; {(f.size_bytes / 1024).toFixed(1)} KB &middot; extraction:{" "}
                  {f.extraction_status}
                  {f.source_type_user_override ? " (manually classified)" : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={f.source_type}
                  onChange={(e) => changeType(f.id, e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {expanded === f.id ? "Hide preview" : "Preview"}
                </button>
              </div>
            </div>
            {expanded === f.id && (
              <div className="mt-3 bg-slate-50 rounded-md p-3 text-xs text-slate-700 space-y-2">
                <div>
                  <span className="font-medium">Detected metadata: </span>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>
                </div>
                <div>
                  <span className="font-medium">Extracted text preview: </span>
                  <pre className="whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {(f.extracted_text ?? "(no text extracted)").slice(0, 2000)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
