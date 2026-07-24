import React from 'react';
import { X, History, ExternalLink, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import type{ TransactionLog } from '../types';

interface TxHistoryDrawerProps {
  logs: TransactionLog[];
  onClose: () => void;
}

export const TxHistoryDrawer: React.FC<TxHistoryDrawerProps> = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Solana Transaction Logs</h2>
            <p className="text-xs text-slate-400">On-chain transaction history & signatures</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Logs List */}
      <div className="p-6 overflow-y-auto flex-1 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No transactions executed in this session yet.</div>
        ) : (
          logs.map((log) => (
            <div key={log.signature} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  {log.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {log.marketQuestion && (
                <p className="text-slate-300 font-medium line-clamp-1 text-[11px]">{log.marketQuestion}</p>
              )}

              <p className="text-slate-400 text-[11px]">{log.details}</p>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">
                  Sig: {log.signature.slice(0, 6)}...{log.signature.slice(-6)}
                </span>
                {log.explorerUrl && (
                  <a
                    href={log.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-sans font-medium"
                  >
                    <span>Solana Explorer</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
