import React, { useState } from 'react';
import { X, Network, CheckCircle2, AlertTriangle, RefreshCw, Key, Shield, Globe } from 'lucide-react';

interface TigerGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: any;
  onStatusUpdate: () => void;
}

export const TigerGraphModal: React.FC<TigerGraphModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  onStatusUpdate,
}) => {
  const [host, setHost] = useState('https://savanna.tgcloud.io');
  const [graphname, setGraphname] = useState('FraudGraph');
  const [username, setUsername] = useState('tigergraph');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/tigergraph/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, graphname, username, password, secret, token }),
      });
      const data = await res.json();
      setResult(data);
      onStatusUpdate();
    } catch (err: any) {
      setResult({ connected: false, message: err.message || 'Connection error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                TigerGraph Savanna & Community Edition
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Connect live graph instance or continue with local In-Memory Engine
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

        {/* Form Body */}
        <form onSubmit={handleSaveAndTest} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              TigerGraph Host URL
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="https://your-domain.i.tgcloud.io"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Savanna Cloud instance URL (e.g. from savanna.tgcloud.io)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Graph Name</label>
              <input
                type="text"
                value={graphname}
                onChange={(e) => setGraphname(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Secret / Token</label>
              <input
                type="password"
                placeholder="Optional REST secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Test Status Banner */}
          {result && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 ${
              result.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {result.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="text-[11px] font-semibold">{result.message}</span>
            </div>
          )}

          {/* Fallback Engine Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Zero-Configuration High-Speed Graph Engine Active
            </span>
            <p>
              The system automatically uses an in-memory graph index over all 590K transactions and 144K identity records. You can test and benchmark immediately even without live cloud credentials!
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isTesting}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{isTesting ? 'Testing...' : 'Test & Connect'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
