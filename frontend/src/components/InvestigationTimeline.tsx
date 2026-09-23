import React from 'react';
import { 
  Bell, Network, Search, Scale, ShieldAlert, 
  HelpCircle, ArrowRightLeft, FileText, Database, CheckCircle2 
} from 'lucide-react';

interface InvestigationTimelineProps {
  caseData: any;
  isLoading: boolean;
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  caseData,
  isLoading,
}) => {
  if (isLoading || !caseData) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        Loading investigation timeline...
      </div>
    );
  }

  const c = caseData.case || {};
  const sar = caseData.sar || {};
  const nba = caseData.next_best_actions || {};
  const evRequests = caseData.evidence_requests || [];

  const steps = [
    {
      id: 1,
      title: '1. Trigger Ingested',
      icon: Bell,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      desc: `Alert received on transaction ${caseData.case_id} via ${caseData.evidence_requests?.length ? 'monitored channel' : 'model score'}`,
      detail: c.summary?.slice(0, 100) + '...',
    },
    {
      id: 2,
      title: '2. Graph Traversal & Neighbors',
      icon: Network,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      desc: `Traversed card window and ${c.connected_card_ids?.length || 0} connected ring cards`,
      detail: c.connected_device_profiles?.[0] ? `Device: ${c.connected_device_profiles[0].slice(0, 50)}...` : 'Card-present channel (in_person)',
    },
    {
      id: 3,
      title: '3. Pattern Recognition',
      icon: Search,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      desc: `Identified Pattern: ${c.pattern?.replace(/_/g, ' ').toUpperCase()}`,
      detail: c.pattern_description || `Exposure calculated at $${c.exposure_usd?.toFixed(2)} across ${c.affected_txn_ids?.length || 0} transactions`,
    },
    {
      id: 4,
      title: '4. GraphRAG Policy Grounding',
      icon: Scale,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      desc: 'Cross-referenced against Bank Fraud Policy Rules R1–R10',
      detail: `Retrieved ${c.similar_prior_cases?.length || 0} similar historical cases (${c.similar_prior_cases?.join(', ') || 'None'})`,
    },
    {
      id: 5,
      title: '5. Uncertainty-Gating & Confidence',
      icon: ShieldAlert,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      desc: `Calibrated Fraud Probability: ${Math.round((c.fraud_probability || 0) * 100)}% (${c.verdict?.toUpperCase()})`,
      detail: caseData.stop_reason || 'Stop condition evaluated per policy standards',
    },
    {
      id: 6,
      title: '6. Controlled Evidence Simulation',
      icon: HelpCircle,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      desc: evRequests.length > 0 ? `${evRequests.length} Evidence Request(s) Dispatched` : 'Sufficient Initial Evidence',
      detail: evRequests[0]?.assumed_response || 'No additional evidence required to reach defensible verdict',
    },
    {
      id: 7,
      title: '7. Next Best Action (NBA) Evolution',
      icon: ArrowRightLeft,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      desc: `Initial (${nba.initial?.length || 0}) -> Final (${nba.final?.length || 0}) Actions`,
      detail: nba.what_changed || 'Actions finalized with assigned approval routes',
    },
    {
      id: 8,
      title: '8. FinCEN Regulatory SAR',
      icon: FileText,
      color: sar.file ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200',
      desc: sar.file ? 'SAR Regulatory Filing Mandated (L2 Approval)' : 'SAR Not Mandated by Thresholds',
      detail: sar.file ? sar.reason : 'Below $1,000 threshold or isolated without ring connection',
    },
    {
      id: 9,
      title: '9. Persisted to TigerGraph Memory',
      icon: Database,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      desc: `Vertex ${c.graph_case_id || 'CASE-2016'} Created in Graph Memory`,
      detail: 'Available for future case investigations and similar-pattern recall',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Agentic Investigation Progression (9 Steps)
        </h3>
        <span className="text-[11px] font-semibold text-slate-500">
          Latency: {caseData.latency_s}s • Tools: {caseData.tool_calls}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative group">
              {/* Stepper Dot */}
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${step.color} shadow-xs`}>
                <Icon className="w-2.5 h-2.5" />
              </div>

              {/* Step Content */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                    {step.title}
                  </h4>
                </div>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {step.desc}
                </p>
                {step.detail && (
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono leading-relaxed bg-slate-50/80 p-1.5 rounded border border-slate-100">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
