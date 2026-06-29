"use client";

import { useMemo, useState } from "react";
import { Evidence } from "@/lib/types";

export default function EvidenceVault({ evidence }: { evidence: Evidence[] }) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");

  const sources = useMemo(
    () => Array.from(new Set(evidence.map((e) => e.source_file))),
    [evidence]
  );

  const filtered = evidence.filter((e) => {
    if (sourceFilter !== "all" && e.source_file !== sourceFilter) return false;
    if (confidenceFilter !== "all" && e.confidence !== confidenceFilter) return false;
    if (query && !e.extracted_text.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search evidence text..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-2 py-2 text-sm"
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={confidenceFilter}
          onChange={(e) => setConfidenceFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-2 py-2 text-sm"
        >
          <option value="all">All confidence</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
          <option value="Missing">Missing</option>
        </select>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} evidence rows</p>

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        {filtered.map((e) => (
          <div key={e.id} className="p-4">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-900">{e.source_file}</span>
              <div className="flex gap-2 text-xs">
                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{e.source_type}</span>
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    e.confidence === "High"
                      ? "bg-green-100 text-green-700"
                      : e.confidence === "Medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {e.confidence}
                </span>
              </div>
            </div>
            {e.page_or_sheet && (
              <p className="text-xs text-slate-500">Location: {e.page_or_sheet}</p>
            )}
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
              {e.extracted_text.slice(0, 500)}
            </p>
            {e.metric_name && (
              <p className="text-xs text-slate-500 mt-1">
                Metric: {e.metric_name} = {e.metric_value}
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No evidence matches the current filters.</p>
        )}
      </div>
    </div>
  );
}
