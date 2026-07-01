"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageTags, SourceType, UploadedFile } from "@/lib/types";

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

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

const EMPTY_TAGS: ImageTags = {
  format: "",
  creative_type: "",
  hook: "",
  product_shown: false,
  product_description: "",
  cta: "",
  offer: "",
  funnel_role: "",
  notes: "",
};

export default function FileList({
  projectId,
  files,
}: {
  projectId: string;
  files: UploadedFile[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tagEditing, setTagEditing] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState<ImageTags>(EMPTY_TAGS);

  async function changeType(fileId: string, sourceType: string) {
    await fetch(`/api/projects/${projectId}/files`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, source_type: sourceType }),
    });
    router.refresh();
  }

  async function saveTags(fileId: string) {
    await fetch(`/api/projects/${projectId}/files`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, image_tags: tagDraft }),
    });
    setTagEditing(null);
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
        let imageTags: ImageTags | null = null;
        try {
          imageTags = f.image_tags ? JSON.parse(f.image_tags) : null;
        } catch {
          // ignore
        }
        const isImage =
          IMAGE_EXTS.includes(f.ext.toLowerCase()) || f.source_type === "screenshot";

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
                {isImage && (
                  <button
                    onClick={() => {
                      if (tagEditing === f.id) {
                        setTagEditing(null);
                      } else {
                        setTagEditing(f.id);
                        setTagDraft(imageTags ?? { ...EMPTY_TAGS });
                      }
                    }}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    {tagEditing === f.id ? "Cancel" : imageTags ? "Edit tags" : "Tag screenshot"}
                  </button>
                )}
                <button
                  onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {expanded === f.id ? "Hide preview" : "Preview"}
                </button>
              </div>
            </div>

            {/* Screenshot tag display */}
            {isImage && imageTags && tagEditing !== f.id && (
              <div className="mt-2 bg-purple-50 rounded-md p-3 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {imageTags.format && <div><span className="font-medium">Format: </span>{imageTags.format}</div>}
                {imageTags.creative_type && <div><span className="font-medium">Creative type: </span>{imageTags.creative_type}</div>}
                {imageTags.funnel_role && <div><span className="font-medium">Funnel role: </span>{imageTags.funnel_role}</div>}
                {imageTags.hook && <div className="col-span-2"><span className="font-medium">Hook: </span>{imageTags.hook}</div>}
                {imageTags.cta && <div><span className="font-medium">CTA: </span>{imageTags.cta}</div>}
                {imageTags.offer && <div><span className="font-medium">Offer: </span>{imageTags.offer}</div>}
                <div><span className="font-medium">Product shown: </span>{imageTags.product_shown ? "Yes" : "No"}{imageTags.product_description ? ` — ${imageTags.product_description}` : ""}</div>
                {imageTags.notes && <div className="col-span-2"><span className="font-medium">Notes: </span>{imageTags.notes}</div>}
              </div>
            )}

            {/* Screenshot tagging form */}
            {isImage && tagEditing === f.id && (
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-md p-4 space-y-3">
                <h3 className="text-sm font-semibold text-purple-900">Screenshot Tags</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Format</label>
                    <select
                      value={tagDraft.format}
                      onChange={(e) => setTagDraft({ ...tagDraft, format: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select…</option>
                      {["image", "video", "carousel", "story", "reel", "display"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Creative type</label>
                    <select
                      value={tagDraft.creative_type}
                      onChange={(e) => setTagDraft({ ...tagDraft, creative_type: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select…</option>
                      {["UGC", "branded", "product demo", "testimonial", "static", "motion", "other"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Funnel role</label>
                    <select
                      value={tagDraft.funnel_role}
                      onChange={(e) => setTagDraft({ ...tagDraft, funnel_role: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select…</option>
                      {["TOF", "MOF", "BOF"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-xs font-medium text-slate-700">Hook (opening line or visual)</label>
                    <input
                      type="text"
                      value={tagDraft.hook}
                      onChange={(e) => setTagDraft({ ...tagDraft, hook: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="e.g. 'Stop scrolling if you hate paying full price'"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">CTA</label>
                    <input
                      type="text"
                      value={tagDraft.cta}
                      onChange={(e) => setTagDraft({ ...tagDraft, cta: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="e.g. Shop Now"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Offer</label>
                    <input
                      type="text"
                      value={tagDraft.offer}
                      onChange={(e) => setTagDraft({ ...tagDraft, offer: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="e.g. 20% off first order"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tagDraft.product_shown}
                        onChange={(e) => setTagDraft({ ...tagDraft, product_shown: e.target.checked })}
                        className="rounded"
                      />
                      Product shown?
                    </label>
                  </div>
                  {tagDraft.product_shown && (
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-700">Product description</label>
                      <input
                        type="text"
                        value={tagDraft.product_description}
                        onChange={(e) => setTagDraft({ ...tagDraft, product_description: e.target.value })}
                        className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                        placeholder="e.g. Hiking jacket in navy"
                      />
                    </div>
                  )}
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-xs font-medium text-slate-700">Notes</label>
                    <textarea
                      value={tagDraft.notes}
                      onChange={(e) => setTagDraft({ ...tagDraft, notes: e.target.value })}
                      className="mt-0.5 w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      rows={2}
                      placeholder="Any additional context..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveTags(f.id)}
                    className="bg-purple-700 text-white px-4 py-1.5 rounded text-sm hover:bg-purple-800"
                  >
                    Save Tags
                  </button>
                  <button
                    onClick={() => setTagEditing(null)}
                    className="border border-slate-300 text-slate-600 px-4 py-1.5 rounded text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
