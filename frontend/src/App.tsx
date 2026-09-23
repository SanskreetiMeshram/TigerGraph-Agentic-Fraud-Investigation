import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, ShieldQuestion, 
  FileText, Play, RefreshCw, DollarSign, Activity, Eye, Download, Info 
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { CaseSelector, CaseSummary } from './components/CaseSelector';
import { GraphVisualizer } from './components/GraphVisualizer';
import { NextBestActionsCard } from './components/NextBestActionsCard';
import { InvestigationTimeline } from './components/InvestigationTimeline';
import { GraphMemoryPanel } from './components/GraphMemoryPanel';
import { SARModal } from './components/SARModal';
import { TigerGraphModal } from './components/TigerGraphModal';
import { PolicyReferenceModal } from './components/PolicyReferenceModal';

export default function App() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('HHG-001');
  const [activeCaseData, setActiveCaseData] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [] });
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [memoryItems, setMemoryItems] = useState<any[]>([]);

  // Modals
  const [isSAROpen, setIsSAROpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // Loaders
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isEvaluatingAll, setIsEvaluatingAll] = useState(false);

  // Fetch Cases and Status on mount
  useEffect(() => {
    fetchStatus();
    fetchCases();
    fetchMemory();
  }, []);

  // Fetch Case Details & Graph when selectedCaseId changes
  useEffect(() => {
    if (selectedCaseId) {
      loadCaseData(selectedCaseId);
    }
  }, [selectedCaseId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch system status', e);
    }
  };

  const fetchCases = async () => {
    setIsLoadingCases(true);
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCaseId) {
          setSelectedCaseId(data[0].case_id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch cases', e);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setMemoryItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch memory', e);
    }
  };

  const loadCaseData = async (caseId: string) => {
    setIsLoadingDetail(true);
    try {
      // 1. Fetch full case document
      const resCase = await fetch(`/api/cases/${caseId}`);
      if (resCase.ok) {
        const cdata = await resCase.json();
        setActiveCaseData(cdata);
      }

      // 2. Fetch graph subgraph
      const resGraph = await fetch(`/api/graph/${caseId}`);
      if (resGraph.ok) {
        const gdata = await resGraph.json();
        setGraphData(gdata);
      }
    } catch (e) {
      console.error('Failed to load case detail', e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRunInvestigation = async () => {
    if (!activeCaseData) return;
    setIsInvestigating(true);

    try {
      const caseObj = cases.find((c) => c.case_id === selectedCaseId);
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCaseId,
          trigger_type: caseObj?.trigger_type || 'risk_score',
          trigger_text: caseObj?.trigger_text || '',
          flagged_txn_id: caseObj?.flagged_txn_id,
          card_id: caseObj?.card_id,
          customer_id: caseObj?.customer_id,
          risk_score: caseObj?.risk_score,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setActiveCaseData(result);
        fetchCases();
        fetchMemory();
        // Reload graph
        const resG = await fetch(`/api/graph/${selectedCaseId}`);
        if (resG.ok) setGraphData(await resG.json());
      }
    } catch (e) {
      console.error('Investigation failed', e);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleRunAllCases = async () => {
    setIsEvaluatingAll(true);
    try {
      for (const c of cases) {
        await fetch('/api/investigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: c.case_id,
            trigger_type: c.trigger_type,
            trigger_text: c.trigger_text,
            flagged_txn_id: c.flagged_txn_id,
            card_id: c.card_id,
            customer_id: c.customer_id,
            risk_score: c.risk_score,
          }),
        });
      }
      await fetchCases();
      await fetchMemory();
      if (selectedCaseId) loadCaseData(selectedCaseId);
    } catch (e) {
      console.error('Batch evaluation failed', e);
    } finally {
      setIsEvaluatingAll(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!activeCaseData) return;
    const blob = new Blob([JSON.stringify(activeCaseData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCaseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const c = activeCaseData?.case || {};
  const sar = activeCaseData?.sar || {};
  const nba = activeCaseData?.next_best_actions || {};

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <Navbar
        systemStatus={systemStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onRunAll={handleRunAllCases}
        isEvaluatingAll={isEvaluatingAll}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Case Pack Selector */}
        <CaseSelector
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={(id) => setSelectedCaseId(id)}
          isLoading={isLoadingCases}
        />

        {/* Right Main Investigation Cockpit */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Active Case Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-1.5">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedCaseId}
                </span>

                {/* Verdict Pill */}
                {c.verdict === 'fraud' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    CONFIRMED FRAUD
                  </span>
                )}
                {c.verdict === 'legitimate' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    LEGITIMATE / CLEARED
                  </span>
                )}
                {c.verdict === 'uncertain' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-2xs">
                    <ShieldQuestion className="w-3.5 h-3.5 text-amber-600" />
                    UNCERTAIN (POLICY R1 APPLIED)
                  </span>
                )}

                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Status: {c.status || 'open'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span>Customer: <strong className="text-slate-800">{cases.find((x) => x.case_id === selectedCaseId)?.customer_id}</strong></span>
                <span>Card: <strong className="text-slate-800">{cases.find((x) => x.case_id === selectedCaseId)?.card_id}</strong></span>
                <span>Flagged Txn: <strong className="text-slate-800">{cases.find((x) => x.case_id === selectedCaseId)?.flagged_txn_id}</strong></span>
                <span>Model Score: <strong className="text-orange-600">{cases.find((x) => x.case_id === selectedCaseId)?.risk_score ?? 'N/A'}</strong></span>
                <span>Pattern: <strong className="text-indigo-700 font-semibold">{c.pattern ? c.pattern.replace(/_/g, ' ') : 'none'}</strong></span>
              </div>
            </div>

            {/* Metrics & Actions */}
            <div className="flex items-center space-x-3">
              {/* Exposure metric */}
              <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Exposure</span>
                <span className="text-base font-extrabold text-slate-900">
                  ${(c.exposure_usd || 0).toFixed(2)} USD
                </span>
              </div>

              {/* Fraud Probability Metric */}
              <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fraud Probability</span>
                <span className={`text-base font-extrabold ${
                  (c.fraud_probability || 0) >= 0.7
                    ? 'text-rose-600'
                    : (c.fraud_probability || 0) <= 0.2
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {c.fraud_probability !== undefined ? `${Math.round(c.fraud_probability * 100)}%` : '--'}
                </span>
              </div>

              {/* View SAR Button */}
              <button
                onClick={() => setIsSAROpen(true)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  sar.file
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{sar.file ? 'SAR Filing Mandated' : 'SAR (Not Required)'}</span>
              </button>

              {/* Download JSON */}
              <button
                onClick={handleDownloadJSON}
                className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                title="Download Submission JSON"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Re-investigate Button */}
              <button
                onClick={handleRunInvestigation}
                disabled={isInvestigating}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} />
                <span>{isInvestigating ? 'Investigating...' : 'Re-Run Investigation'}</span>
              </button>
            </div>
          </div>

          {/* Trigger Alert Card */}
          <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/60 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                Trigger Context ({cases.find((x) => x.case_id === selectedCaseId)?.trigger_type?.toUpperCase()})
              </span>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-medium">
                {cases.find((x) => x.case_id === selectedCaseId)?.trigger_text}
              </p>
            </div>
          </div>

          {/* Top Row: Interactive Graph Visualizer & Next-Best Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Graph Visualizer: 7 cols */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  TigerGraph Subgraph Visualizer
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  Multi-Hop Neighborhood Traversal
                </span>
              </div>
              <div className="flex-1 min-h-[360px]">
                <GraphVisualizer
                  graphData={graphData}
                  isLoading={isLoadingDetail}
                />
              </div>
            </div>

            {/* NBA Evolution: 5 cols */}
            <div className="lg:col-span-5 flex flex-col">
              <NextBestActionsCard
                initialActions={nba.initial || []}
                finalActions={nba.final || []}
                whatChanged={nba.what_changed || ''}
              />
            </div>
          </div>

          {/* Bottom Row: 9-Step Progression Stepper & Graph Memory Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Stepper: 7 cols */}
            <div className="lg:col-span-7">
              <InvestigationTimeline
                caseData={activeCaseData}
                isLoading={isLoadingDetail}
              />
            </div>

            {/* Case Memory: 5 cols */}
            <div className="lg:col-span-5">
              <GraphMemoryPanel
                memoryItems={memoryItems}
                isLoading={false}
                onRefresh={fetchMemory}
                onSelectCase={(cid) => setSelectedCaseId(cid)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <SARModal
        isOpen={isSAROpen}
        onClose={() => setIsSAROpen(false)}
        caseId={selectedCaseId}
        sar={sar}
      />

      <TigerGraphModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemStatus={systemStatus}
        onStatusUpdate={fetchStatus}
      />

      <PolicyReferenceModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />
    </div>
  );
}
