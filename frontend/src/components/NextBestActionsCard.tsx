import React from 'react';
import { ArrowRight, ShieldCheck, UserCheck, AlertCircle, Clock, Zap } from 'lucide-react';

interface ActionItem {
  action: string;
  route: string;
  reason: string;
}

interface NextBestActionsCardProps {
  initialActions: ActionItem[];
  finalActions: ActionItem[];
  whatChanged: string;
}

export const NextBestActionsCard: React.FC<NextBestActionsCardProps> = ({
  initialActions = [],
  finalActions = [],
  whatChanged,
}) => {
  const getRouteBadge = (route: string) => {
    switch (route) {
      case 'auto':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            AUTO EXECUTE
          </span>
        );
      case 'L1':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            L1 (TEAM LEAD)
          </span>
        );
      case 'L2':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            L2 (FRAUD MANAGER)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
            {route}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-indigo-600" />
          Next-Best Action (NBA) Decision Evolution
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Policy R1–R10 Enforcement</span>
      </div>

      {/* Side-by-side NBA columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Initial Recommendations */}
        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              1. Initial NBA (Pre-Evidence)
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {initialActions.length} Actions
            </span>
          </div>

          <div className="space-y-2">
            {initialActions.map((item, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {item.action}
                  </span>
                  {getRouteBadge(item.route)}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final Recommendations */}
        <div className="bg-indigo-50/40 rounded-lg p-3 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              2. Final NBA (Post-Evidence)
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
              {finalActions.length} Actions
            </span>
          </div>

          <div className="space-y-2">
            {finalActions.map((item, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-indigo-950">
                    {item.action}
                  </span>
                  {getRouteBadge(item.route)}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What Changed Banner */}
      <div className="mt-3.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 rounded-lg p-3 border border-indigo-100 flex items-start gap-2.5">
        <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-bold text-indigo-900 block">
            What Changed & Why?
          </span>
          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
            {whatChanged || 'Actions calibrated as controlled evidence was processed.'}
          </p>
        </div>
      </div>
    </div>
  );
};
