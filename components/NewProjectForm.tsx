"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  "rfp",
  "discovery",
  "chemistry_meeting",
  "follow_up",
  "final_pitch",
  "audit_readout",
];

export default function NewProjectForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      name: data.get("name"),
      prospect_name: data.get("prospect_name"),
      category: data.get("category"),
      pitch_stage: data.get("pitch_stage"),
      due_date: data.get("due_date"),
      known_budget: data.get("known_budget"),
      known_channels: data.get("known_channels"),
      known_business_goals: data.get("known_business_goals"),
      notes: data.get("notes"),
    };
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = `Server error ${res.status}`;
        try {
          const json = await res.json();
          msg = json.error ?? msg;
        } catch {
          // response body not JSON — use status text
          msg = res.statusText || msg;
        }
        setError(msg);
        return;
      }
      const json = await res.json();
      router.push(`/projects/${json.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — could not reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Project Name" name="name" required />
        <Field label="Brand / Prospect Name" name="prospect_name" required />
        <Field label="Category" name="category" placeholder="e.g. DTC apparel" />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pitch Stage</label>
          <select
            name="pitch_stage"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            defaultValue="rfp"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <Field label="Due Date" name="due_date" type="date" />
        <Field label="Known Budget" name="known_budget" placeholder="e.g. $50k/mo" />
        <Field label="Known Channels" name="known_channels" placeholder="e.g. Meta, Google" />
        <Field
          label="Known Business Goals"
          name="known_business_goals"
          placeholder="e.g. Grow revenue 30% YoY"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          placeholder="Any manual context for this pitch..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
      />
    </div>
  );
}
