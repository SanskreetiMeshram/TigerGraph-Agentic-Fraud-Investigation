import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, UserCheck, ShieldQuestion, FileText, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

export interface CaseSummary {
  case_id: string;
  opened_at: string;
  trigger_type: string;
  trigger_text: string;
  flagged_txn_id: number;
  card_id: string;
  customer_id: string;
  risk_score: number | null;
  status: string;
  verdict: string;
  fraud_probability: number | null;
  pattern: string;
  exposure_usd: number;
  sar_file: boolean;
}

interface CaseSelectorProps {
  cases: CaseSummary[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  isLoading: boolean;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('ALL');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.case_id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toLowerCase().includes(search.toLowerCase()) ||
      c.card_id.toLowerCase().includes(search.toLowerCase()) ||
      c.pattern.toLowerCase().includes(search.toLowerCase());

    const matchesTrigger =
      triggerFilter === 'ALL' || c.trigger_type === triggerFilter;

    return matchesSearch && matchesTrigger;
  });

  const getVerdictBadge = (verdict: string, prob: number | null) => {
    if (verdict === 'fraud') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          FRAUD ({prob ? `${Math.round(prob * 100)}%` : 'HIGH'})
        </span>
      );
    }
    if (verdict === 'legitimate') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          CLEARED
        </span>
      );
    }
    if (verdict === 'uncertain') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
          <ShieldQuestion className="w-3 h-3 text-amber-500" />
          UNCERTAIN ({prob ? `${Math.round(prob * 100)}%` : 'MID'})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
        UNEXAMINED
      </span>
    );
  };

  const getTriggerPill = (type: string) => {
    switch (type) {
      case 'risk_score':
        return <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">Risk Score</span>;
      case 'customer_report':
        return <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Dispute</span>;
      case 'analyst_request':
        return <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Analyst Link</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 shrink-0">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Case Pack (20 Benchmark)
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {filteredCases.length} of 20
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Case, Customer, Card..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Trigger Type Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-[11px]">
          {['ALL', 'risk_score', 'customer_report', 'analyst_request'].map((t) => (
            <button
              key={t}
              onClick={() => setTriggerFilter(t)}
              className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                triggerFilter === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'risk_score' ? 'Score' : t === 'customer_report' ? 'Dispute' : 'Analyst'}
            </button>
          ))}
        </div>
      </div>

      {/* Case List Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredCases.map((c) => {
          const isSelected = c.case_id === selectedCaseId;
          return (
            <div
              key={c.case_id}
              onClick={() => onSelectCase(c.case_id)}
              className={`p-3 cursor-pointer transition-all border-l-4 ${
                isSelected
                  ? 'bg-indigo-50/70 border-l-indigo-600 shadow-xs'
                  : 'hover:bg-slate-50 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {c.case_id}
                </span>
                {getVerdictBadge(c.verdict, c.fraud_probability)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>{c.customer_id} • {c.card_id}</span>
                {getTriggerPill(c.trigger_type)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                <span className="truncate max-w-[170px] text-slate-500">
                  {c.pattern !== 'none' ? c.pattern.replace(/_/g, ' ') : 'no pattern'}
                </span>
                <span className="font-semibold text-slate-700">
                  {c.exposure_usd > 0 ? `$${c.exposure_usd.toFixed(2)}` : '$0.00'}
                </span>
              </div>

              {c.sar_file && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50/60 px-1.5 py-0.5 rounded border border-rose-100/80">
                  <FileText className="w-2.5 h-2.5" />
                  <span>SAR Filing Mandated</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
