import React from 'react';
import { X, BookOpen, ShieldCheck, Scale, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

interface PolicyReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyReferenceModal: React.FC<PolicyReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const rules = [
    {
      id: 'R1',
      title: 'Verify Before You Block (Weak Signal Safeguard)',
      desc: 'If the case rests on a single signal (including risk score alone) and assessed fraud probability < 0.70, recommend VERIFY_WITH_CUSTOMER or STEP_UP_AUTH before any block. Blocking legitimate cardholders on a single score is a policy breach.'
    },
    {
      id: 'R2',
      title: 'Customer Denies Transaction',
      desc: 'Recommend BLOCK_CARD and CREATE_CASE. Add FILE_REPORT if exposure > $1,000 or the case connects to a shared device profile or another card\'s fraud.'
    },
    {
      id: 'R3',
      title: 'Customer Confirms Transaction',
      desc: 'Recommend CLOSE_NO_FRAUD. Note the confirmation in the case file and clear the alert.'
    },
    {
      id: 'R4',
      title: 'No Reply Within 24 Hours',
      desc: 'Recommend MONITOR_CARD and DECLINE_TRANSACTION for pending authorizations. Escalate if exposure exceeds $500.'
    },
    {
      id: 'R5',
      title: 'Card Testing Sequence',
      desc: 'Three or more small online authorizations on one card within an hour, followed by a larger purchase: recommend DECLINE_TRANSACTION and STEP_UP_AUTH. If a purchase over $100 has already cleared, recommend BLOCK_CARD.'
    },
    {
      id: 'R6',
      title: 'Shared Origin / Fraud Syndicate',
      desc: 'When several cards show fraud from the same device profile, same billing region, or same recipient email in one window, name the shared element, recommend CREATE_CASE, FILE_REPORT, and MONITOR_CONNECTED_CARDS for every card that shares it.'
    },
    {
      id: 'R7',
      title: 'Disputed But Legitimate (Recurring Charges)',
      desc: 'When the customer disputes a charge that matches their own recurring pattern (same merchant, same amount, monthly), recommend CREATE_CASE, VERIFY_WITH_CUSTOMER, and WARN_CUSTOMER. Do not block.'
    },
    {
      id: 'R8',
      title: 'Escalate When Uncertain and Exposed',
      desc: 'If the verdict is uncertain and exposure exceeds $500, or the evidence conflicts, recommend ESCALATE_TO_ANALYST.'
    },
    {
      id: 'R9',
      title: 'Undocumented Patterns',
      desc: 'When activity fits none of the known patterns but evidence shows coordinated or repeated abuse across customers, recommend CREATE_CASE, FILE_REPORT, and ESCALATE_TO_ANALYST, and describe the pattern in your own words.'
    },
    {
      id: 'R10',
      title: 'Never BLOCK_ALL_CARDS',
      desc: 'Never BLOCK_ALL_CARDS unless at least two of the customer\'s cards show confirmed fraud or the customer\'s credentials are confirmed compromised.'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bank Fraud Policy Reference (Version 1.0)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mandatory rules, approval routing matrix, and FinCEN SAR filing standards
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
        <div className="p-5 space-y-5 text-xs text-slate-700">
          {/* Section 2: Approval Routes */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              Approval Routing Matrix
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-800 block mb-0.5">Route: auto</span>
                <p className="text-[11px] text-blue-900 leading-tight">
                  ALLOW_TRANSACTION, MONITOR_CARD, MONITOR_CONNECTED_CARDS, WARN_CUSTOMER, VERIFY_WITH_CUSTOMER, STEP_UP_AUTH, CREATE_CASE, CLOSE_NO_FRAUD.
                </p>
              </div>
              <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200">
                <span className="font-bold text-amber-800 block mb-0.5">Route: L1 (Team Lead)</span>
                <p className="text-[11px] text-amber-900 leading-tight">
                  DECLINE_TRANSACTION; BLOCK_CARD when exposure ≤ $2,500.
                </p>
              </div>
              <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-200">
                <span className="font-bold text-rose-800 block mb-0.5">Route: L2 (Manager)</span>
                <p className="text-[11px] text-rose-900 leading-tight">
                  BLOCK_CARD when exposure &gt; $2,500; BLOCK_ALL_CARDS; FILE_REPORT always.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Rules R1 - R10 */}
          <div>
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Core Policy Rules (R1 to R10)
            </h4>
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                      {r.id}
                    </span>
                    <span className="font-bold text-slate-900">{r.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
