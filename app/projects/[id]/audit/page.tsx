import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getAllArtifacts } from "@/lib/modules/artifacts";
import ProjectTabs from "@/components/ProjectTabs";
import {
  PaidMediaAuditFinding,
  ShopifyFinding,
  CreativeAssetScore,
  MeasurementPlan,
} from "@/lib/types";

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[severity] ?? "bg-slate-100"}`}>
      {severity}
    </span>
  );
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();
  const artifacts = getAllArtifacts(id);
  const paidMedia = artifacts.paid_media_findings as
    | { findings: PaidMediaAuditFinding[]; computed: Record<string, unknown> }
    | undefined;
  const shopify = artifacts.shopify_findings as
    | { findings: ShopifyFinding[]; computed: Record<string, unknown> }
    | undefined;
  const creative = artifacts.creative_findings as
    | { scores: CreativeAssetScore[]; gradeDistribution: Record<string, number>; findings: string[] }
    | undefined;
  const measurement = artifacts.measurement_plan as MeasurementPlan | undefined;

  return (
    <div>
      <ProjectTabs projectId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-xl font-bold text-slate-900">Audit Findings</h1>

        {!paidMedia && !shopify && !creative && (
          <p className="text-slate-500 text-sm">
            No audit data yet — upload platform/Shopify/creative files and generate the package.
          </p>
        )}

        {paidMedia && (
          <section>
            <h2 className="font-semibold text-slate-900 mb-2">Paid Media Audit</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 text-xs text-slate-600 grid grid-cols-3 gap-2">
              <div>Total spend: ${Number(paidMedia.computed.total_spend).toLocaleString()}</div>
              <div>Blended ROAS: {String(paidMedia.computed.blended_roas ?? "n/a")}</div>
              <div>Blended CPA: ${String(paidMedia.computed.blended_cpa ?? "n/a")}</div>
              <div>Top 5 campaigns spend share: {String(paidMedia.computed.spend_concentration_top5_pct)}%</div>
              <div>Top 10 campaigns spend share: {String(paidMedia.computed.spend_concentration_top10_pct)}%</div>
              <div>Campaigns analyzed: {String(paidMedia.computed.campaign_count)}</div>
            </div>
            <div className="space-y-3">
              {paidMedia.findings.map((f, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900">{f.headline}</h3>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <p className="text-sm text-slate-600">{f.business_impact}</p>
                  <p className="text-sm text-slate-700 mt-1">
                    <span className="font-medium">Recommendation:</span> {f.recommendation}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{f.talk_track}&rdquo;</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {creative && (
          <section>
            <h2 className="font-semibold text-slate-900 mb-2">Creative Audit</h2>
            <div className="flex gap-3 mb-3">
              {Object.entries(creative.gradeDistribution).map(([grade, n]) => (
                <div key={grade} className="bg-slate-100 rounded-md px-3 py-1 text-sm">
                  {grade}: {n}
                </div>
              ))}
            </div>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {creative.findings.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {shopify && (
          <section>
            <h2 className="font-semibold text-slate-900 mb-2">Shopify / Business Health</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 text-xs text-slate-600 grid grid-cols-3 gap-2">
              <div>Net sales: ${Number(shopify.computed.net_sales).toLocaleString()}</div>
              <div>Orders: {String(shopify.computed.orders)}</div>
              <div>AOV: ${String(shopify.computed.aov ?? "n/a")}</div>
              <div>CVR: {String(shopify.computed.cvr_pct ?? "n/a")}%</div>
              <div>MER: {String(shopify.computed.mer ?? "n/a (no paid spend data)")}</div>
            </div>
            <div className="space-y-3">
              {shopify.findings.map((f, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900">{f.headline}</h3>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <p className="text-sm text-slate-600">{f.detail}</p>
                  <p className="text-sm text-slate-700 mt-1">
                    <span className="font-medium">Recommendation:</span> {f.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {measurement && (
          <section>
            <h2 className="font-semibold text-slate-900 mb-2">Measurement Maturity</h2>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-lg font-bold text-slate-900">
                Score: {measurement.maturity_score} / 5
              </p>
              <p className="text-sm text-slate-600 mt-1">{measurement.rationale}</p>
              <h3 className="text-sm font-medium text-slate-800 mt-3 mb-1">Roadmap</h3>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {measurement.roadmap.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {(paidMedia || shopify) && (
          <a
            href={`/api/projects/${id}/export/findings-csv`}
            className="inline-block text-sm text-blue-600 hover:underline"
          >
            Export findings as CSV
          </a>
        )}
      </div>
    </div>
  );
}
