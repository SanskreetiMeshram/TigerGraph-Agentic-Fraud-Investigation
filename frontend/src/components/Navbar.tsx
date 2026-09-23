import React from 'react';
import { ShieldAlert, Network, Settings, BookOpen, CheckCircle2, Play, RefreshCw, Cpu } from 'lucide-react';

interface NavbarProps {
  systemStatus: any;
  onOpenSettings: () => void;
  onOpenPolicy: () => void;
  onRunAll: () => void;
  isEvaluatingAll: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemStatus,
  onOpenSettings,
  onOpenPolicy,
  onRunAll,
  isEvaluatingAll,
}) => {
  const isConnected = systemStatus?.tigergraph?.connected;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              TigerGraph Agentic Fraud Investigation
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              HHGOA 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
            <Network className="w-3.5 h-3.5 text-indigo-500 inline" />
            GraphRAG + GSQL Analytics + Uncertainty-Gated Next Best Action
          </p>
        </div>
      </div>

      {/* Engine Status & Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Connection Mode Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Click to configure TigerGraph Savanna credentials"
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
          <span>{isConnected ? 'TigerGraph Savanna Live' : 'Graph Engine Active (In-Memory)'}</span>
          <Settings className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Policy Rules Button */}
        <button
          onClick={onOpenPolicy}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Fraud Policy (R1–R10)</span>
        </button>

        {/* Run All Benchmark Cases Button */}
        <button
          onClick={onRunAll}
          disabled={isEvaluatingAll}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-100"
        >
          {isEvaluatingAll ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Evaluating Cases...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate All 20 Cases</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
