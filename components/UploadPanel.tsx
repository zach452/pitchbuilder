"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPanel({
  projectId,
  initialFileCount,
}: {
  projectId: string;
  initialFileCount: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(initialFileCount);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    for (const f of Array.from(files)) formData.append("files", f);
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Upload failed");
      return;
    }
    const json = await res.json();
    setCount((c) => c + json.files.length);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="font-semibold text-slate-900 mb-2">Upload Files</h2>
      <p className="text-sm text-slate-500 mb-4">
        RFPs, transcripts, ad platform exports, Shopify exports, creative scorecards,
        screenshots, prior pitch materials. {count} file(s) uploaded so far.
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer text-sm ${
          dragActive ? "border-slate-900 bg-slate-50" : "border-slate-300 text-slate-500"
        }`}
      >
        {uploading ? "Uploading..." : "Drag & drop files here, or click to browse"}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
          }}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
