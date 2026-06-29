"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GenerationStatus } from "@/lib/types";

export default function GeneratePanel({
  projectId,
  initialStatus,
}: {
  projectId: string;
  initialStatus: GenerationStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<GenerationStatus>(initialStatus);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "running") {
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/projects/${projectId}/generate/all`);
        const json = await res.json();
        setStatus(json.generation_status);
        setStep(json.generation_step);
        setError(json.generation_error);
        if (json.generation_status !== "running") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.refresh();
        }
      }, 2500);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [status, projectId, router]);

  async function startGeneration() {
    setError(null);
    setStatus("running");
    const res = await fetch(`/api/projects/${projectId}/generate/all`, { method: "POST" });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to start generation");
      setStatus("error");
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="font-semibold text-slate-900 mb-2">Generate Pitch Package</h2>
      <p className="text-sm text-slate-500 mb-4">
        Runs the full MVP pipeline: RFP decode, transcript synthesis, paid media / creative /
        Shopify audits, business diagnosis, win strategy, slide outline, talk tracks, and Q&amp;A
        prep.
      </p>
      <button
        onClick={startGeneration}
        disabled={status === "running"}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {status === "running" ? "Generating..." : "Generate Pitch Package"}
      </button>
      <div className="mt-3 text-sm">
        Status: <span className="font-medium">{status}</span>
        {step && <span className="text-slate-500"> &middot; step: {step}</span>}
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
