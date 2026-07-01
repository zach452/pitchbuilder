"use client";

import { RoadmapItem } from "@/lib/types";

const PHASE_LABELS: Record<string, string> = {
  "30": "First 30 Days",
  "60": "Days 31–60",
  "90": "Days 61–90",
  "q2+": "Quarter 2+",
};

const PHASE_COLORS: Record<string, string> = {
  "30": "border-l-4 border-emerald-500",
  "60": "border-l-4 border-blue-500",
  "90": "border-l-4 border-violet-500",
  "q2+": "border-l-4 border-amber-500",
};

const COMPLEXITY_BADGE: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const OWNER_BADGE: Record<string, string> = {
  Agency: "bg-blue-100 text-blue-800",
  Client: "bg-slate-100 text-slate-800",
  Shared: "bg-purple-100 text-purple-800",
};

export default function RoadmapView({ roadmap }: { roadmap: RoadmapItem[] }) {
  const phases = ["30", "60", "90", "q2+"] as const;

  return (
    <div className="space-y-8">
      {phases.map((phase) => {
        const items = roadmap.filter((r) => r.phase === phase);
        if (items.length === 0) return null;
        return (
          <div key={phase}>
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              {PHASE_LABELS[phase]}
            </h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-lg p-4 ${PHASE_COLORS[phase]} shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <h3 className="font-medium text-slate-900">{item.recommendation}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPLEXITY_BADGE[item.complexity]}`}
                      >
                        {item.complexity} complexity
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${OWNER_BADGE[item.owner]}`}
                      >
                        {item.owner}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.why_it_matters}</p>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
                    <div>
                      <span className="font-medium text-slate-700">Business impact</span>
                      <p>{item.business_impact}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Timing</span>
                      <p>{item.timing}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">KPI</span>
                      <p>{item.kpi}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Dependencies</span>
                      <p>{item.dependencies}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
