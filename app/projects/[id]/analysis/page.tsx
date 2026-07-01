import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import ProjectTabs from "@/components/ProjectTabs";
import {
  RfpSummary,
  TranscriptSummary,
  BusinessDiagnosis,
  WinStrategy,
  FourCsAnalysis,
  PitchCritique,
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
  const fourCs = artifacts.four_cs as FourCsAnalysis | undefined;
  const critique = artifacts.critique as PitchCritique | undefined;

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Analysis Dashboard</h1>

        {!rfp && !transcript && !diagnosis && !winStrategy && !fourCs && !critique && (
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
        {fourCs && (
          <Card title="4 C&apos;s + Comms Compass + SOAP">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-800 mb-1">Category</h3>
                  <p className="text-sm text-slate-700">{fourCs.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-800 mb-1">Culture</h3>
                  <p className="text-sm text-slate-700">{fourCs.culture}</p>
                </div>
              </div>
              {fourCs.consumer && (
                <div>
                  <h3 className="text-sm font-medium text-slate-800 mb-1">Consumer</h3>
                  <p className="text-sm text-slate-700 font-medium">Must-Win Audience: {fourCs.consumer.must_win_audience}</p>
                  <p className="text-xs text-slate-600 mt-0.5">JTBD: {fourCs.consumer.jtbd}</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <h4 className="text-xs font-medium text-slate-700">Motivations</h4>
                      <List items={fourCs.consumer.motivations} />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-slate-700">Objections</h4>
                      <List items={fourCs.consumer.objections} />
                    </div>
                  </div>
                </div>
              )}
              {fourCs.comms_compass && (
                <div className="border border-slate-100 rounded-md p-3 bg-slate-50">
                  <h3 className="text-sm font-medium text-slate-800 mb-2">Comms Compass</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                    <div><span className="font-medium">Current perception: </span>{fourCs.comms_compass.current_perception}</div>
                    <div><span className="font-medium">Desired perception: </span>{fourCs.comms_compass.desired_perception}</div>
                    <div><span className="font-medium">Core tension: </span>{fourCs.comms_compass.core_tension}</div>
                    <div><span className="font-medium">Strategic opportunity: </span>{fourCs.comms_compass.strategic_opportunity}</div>
                    <div className="col-span-2"><span className="font-medium">Messaging north star: </span>{fourCs.comms_compass.messaging_north_star}</div>
                    <div><span className="font-medium">Paid implications: </span>{fourCs.comms_compass.paid_implications}</div>
                    <div><span className="font-medium">Creative implications: </span>{fourCs.comms_compass.creative_implications}</div>
                  </div>
                  {fourCs.comms_compass.proof_points?.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-slate-700">Proof Points</h4>
                      <List items={fourCs.comms_compass.proof_points} />
                    </div>
                  )}
                </div>
              )}
              {fourCs.soap && (
                <div className="border border-slate-100 rounded-md p-3">
                  <h3 className="text-sm font-medium text-slate-800 mb-2">SOAP Statement</h3>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p><span className="font-medium text-slate-900">Brand is…</span> {fourCs.soap.brand_is}</p>
                    <p><span className="font-medium text-slate-900">Problem is…</span> {fourCs.soap.problem_is}</p>
                    <p><span className="font-medium text-slate-900">However…</span> {fourCs.soap.however}</p>
                    <p><span className="font-medium text-slate-900">We need to…</span> {fourCs.soap.we_need_to}</p>
                    <p><span className="font-medium text-slate-900">So that…</span> {fourCs.soap.so_that}</p>
                    <p><span className="font-medium text-slate-900">Helping to…</span> {fourCs.soap.helping_to}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {critique && (
          <Card title="Pitch Critique / QC">
            <div className="mb-4 flex items-center gap-4">
              <div className="text-3xl font-bold text-slate-900">{critique.overall_score}<span className="text-lg text-slate-400">/10</span></div>
              <div className="text-sm text-slate-600">Overall win probability: <span className="font-semibold">{critique.scores?.overall_win_probability ?? "—"}/10</span></div>
            </div>
            {critique.scores && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {Object.entries(critique.scores).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1 text-xs">
                    <span className="text-slate-600 capitalize">{key.replace(/_/g, " ")}</span>
                    <span className={`font-semibold ${(val as number) >= 7 ? "text-emerald-700" : (val as number) >= 5 ? "text-amber-700" : "text-red-700"}`}>{val as number}/10</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">What is strong</h3>
                <List items={critique.what_is_strong} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">What is generic</h3>
                <List items={critique.what_is_generic} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">What is missing</h3>
                <List items={critique.what_is_missing} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Needs more proof</h3>
                <List items={critique.needs_more_proof} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">To be more senior-level</h3>
                <List items={critique.to_be_more_senior} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-800 mb-1">Push harder on</h3>
                <List items={critique.push_harder} />
              </div>
            </div>
            {critique.verdict && (
              <div className="mt-3 bg-slate-800 text-white rounded-md p-3 text-sm">
                <span className="font-semibold">Verdict: </span>{critique.verdict}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
