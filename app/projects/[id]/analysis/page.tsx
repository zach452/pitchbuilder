import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import ProjectTabs from "@/components/ProjectTabs";
import {
  RfpSummary,
  TranscriptSummary,
  BusinessDiagnosis,
  WinStrategy,
} from "@/lib/types";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="font-semibold text-slate-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function List({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">None recorded.</p>;
  return (
    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const artifacts = getAllArtifacts(id);
  const rfp = artifacts.rfp_summary as RfpSummary | undefined;
  const transcript = artifacts.transcript_summary as TranscriptSummary | undefined;
  const diagnosis = artifacts.business_diagnosis as BusinessDiagnosis | undefined;
  const winStrategy = artifacts.win_strategy as WinStrategy | undefined;

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Analysis Dashboard</h1>

        {!rfp && !transcript && !diagnosis && !winStrategy && (
          <p className="text-slate-500 text-sm">
            No analysis generated yet. Go to the Workspace tab and click &quot;Generate Pitch
            Package&quot;.
          </p>
        )}

        {rfp && (
          <Card title="RFP Summary">
            <p className="text-sm text-slate-700 mb-3">{rfp.executive_summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Business Objectives</h3>
                <List items={rfp.business_objectives} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Stated KPIs</h3>
                <List items={rfp.stated_kpis} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Win Conditions</h3>
                <List items={rfp.win_conditions} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Lose Conditions</h3>
                <List items={rfp.lose_conditions} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Hidden Questions</h3>
                <List items={rfp.hidden_questions} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Risks</h3>
                <List items={rfp.risks} />
              </div>
            </div>
          </Card>
        )}

        {transcript && (
          <Card title="Discovery / Transcript Synthesis">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">What We Heard</h3>
                <List items={transcript.what_we_heard} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">What They Really Need</h3>
                <List items={transcript.what_they_really_need} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Unspoken Concerns</h3>
                <List items={transcript.unspoken_concerns} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Language to Reuse</h3>
                <List items={transcript.language_to_reuse} />
              </div>
            </div>
          </Card>
        )}

        {diagnosis && (
          <Card title="Business Diagnosis">
            <p className="text-sm text-slate-700 mb-3">{diagnosis.diagnosis_paragraph}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Growth Levers</h3>
                <List items={diagnosis.growth_levers} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Blockers</h3>
                <List items={diagnosis.blockers} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Lead With</h3>
                <List items={diagnosis.lead_with} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Proof Needed</h3>
                <List items={diagnosis.proof_needed} />
              </div>
            </div>
          </Card>
        )}

        {winStrategy && (
          <Card title="Win Strategy">
            <p className="text-sm font-medium text-slate-800 mb-3">{winStrategy.winning_thesis}</p>
            <div className="space-y-3">
              {winStrategy.pillars.map((p, idx) => (
                <div key={idx} className="border border-slate-200 rounded-md p-3">
                  <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium">Problem:</span> {p.problem}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Opportunity:</span> {p.opportunity}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Recommendation:</span> {p.recommendation}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Proof:</span> {p.proof}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Impact:</span> {p.impact}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Deal Risks</h3>
                <List items={winStrategy.deal_risks} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Required Proof Points</h3>
                <List items={winStrategy.required_proof_points} />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
