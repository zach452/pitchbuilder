"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/projects/${projectId}`, label: "Workspace" },
    { href: `/projects/${projectId}/inputs`, label: "Inputs" },
    { href: `/projects/${projectId}/analysis`, label: "Analysis Dashboard" },
    { href: `/projects/${projectId}/audit`, label: "Audit Findings" },
    { href: `/projects/${projectId}/slides`, label: "Slide Builder" },
    { href: `/projects/${projectId}/evidence`, label: "Evidence Vault" },
    { href: `/projects/${projectId}/qa`, label: "Q&A Prep" },
    { href: `/projects/${projectId}/roadmap`, label: "Roadmap" },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-3 text-sm whitespace-nowrap border-b-2 ${
                active
                  ? "border-slate-900 text-slate-900 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
