import React from 'react';
import { Database, ShieldCheck, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface MemoryItem {
  case_id: string;
  status: string;
  verdict: string;
  fraud_probability: number;
  pattern: string;
  exposure_usd: number;
  summary: string;
  created_at: string;
}

interface GraphMemoryPanelProps {
  memoryItems: MemoryItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectCase?: (caseId: string) => void;
}

export const GraphMemoryPanel: React.FC<GraphMemoryPanelProps> = ({
  memoryItems,
  isLoading,
  onRefresh,
  onSelectCase,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            TigerGraph Case Memory ({memoryItems.length} Persisted Cases)
          </h3>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition-colors"
          title="Refresh Memory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Closed and in-flight investigations written into the graph knowledge store. Future investigations query this memory to recall travel history, shared devices, and fraud typologies.
      </p>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {memoryItems.map((item) => (
          <div
            key={item.case_id}
            onClick={() => onSelectCase && onSelectCase(item.case_id)}
            className="p-2.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-lg border border-slate-200/80 cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-800">
                CASE-2016-{item.case_id.replace('HHG-', '')} ({item.case_id})
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                item.verdict === 'fraud'
                  ? 'bg-rose-100 text-rose-800'
                  : item.verdict === 'legitimate'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {item.verdict?.toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight mb-1">
              {item.summary}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Pattern: {item.pattern?.replace(/_/g, ' ')}</span>
              <span>${item.exposure_usd?.toFixed(2)} USD</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
