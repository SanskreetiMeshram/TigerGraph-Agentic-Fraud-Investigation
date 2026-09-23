import React from 'react';
import { X, FileText, Check, Copy, AlertCircle, Calendar, DollarSign, Users } from 'lucide-react';

interface SARData {
  file: boolean;
  reason: string;
  narrative: string;
  subjects: string[];
  total_amount_usd: number;
  activity_dates: string[];
}

interface SARModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  sar: SARData;
}

export const SARModal: React.FC<SARModalProps> = ({
  isOpen,
  onClose,
  caseId,
  sar,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (sar?.narrative) {
      navigator.clipboard.writeText(sar.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${sar?.file ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Suspicious Activity Report (SAR) Filing Record
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Case ID: {caseId} • Regulatory Filing Assessment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Alert */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            sar?.file
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${sar?.file ? 'text-rose-600' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-bold">
                {sar?.file ? 'MANDATORY REGULATORY FILING (FinCEN)' : 'NO SAR FILING REQUIRED'}
              </div>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                {sar?.reason}
              </p>
            </div>
          </div>

          {sar?.file && (
            <>
              {/* Metadata Badges */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-0.5 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" /> Total Suspicious Amount
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    ${sar.total_amount_usd.toFixed(2)} USD
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-600" /> Activity Period
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {sar.activity_dates?.[0]} to {sar.activity_dates?.[1]}
                  </span>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Identified Subjects & Linked Accounts ({sar.subjects?.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sar.subjects?.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-800 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Narrative Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    Regulatory Narrative (FinCEN Standard)
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Narrative'}</span>
                  </button>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {sar.narrative}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
