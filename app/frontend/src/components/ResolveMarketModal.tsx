import React, { useState } from 'react';
import type{ Market } from '../types';
import { X, CheckCircle2, XCircle, Clock, Shield, AlertCircle, Sparkles } from 'lucide-react';

interface ResolveMarketModalProps {
  market: Market | null;
  onClose: () => void;
  onResolveMarket: (marketPubkey: string, outcome: boolean) => Promise<void>;
}

export const ResolveMarketModal: React.FC<ResolveMarketModalProps> = ({
  market,
  onClose,
  onResolveMarket,
}) => {
  if (!market) return null;

  const [outcome, setOutcome] = useState<boolean>(true);
  const [resolving, setResolving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setResolving(true);
      await onResolveMarket(market.pubkey, outcome);
      setResolving(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resolve market');
      setResolving(false);
    }
  };

  const totalPoolSol = ((market.yes_pool + market.no_pool) / 1e9).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Resolve Prediction Outcome</h2>
              <p className="text-xs text-slate-400">Anchor Instruction: `resolve_market`</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleResolve} className="p-6 space-y-5">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono text-purple-400 block">Market Question:</span>
            <p className="text-sm font-semibold text-slate-100">{market.question}</p>
            <div className="flex justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Total Volume:</span>
              <span className="text-amber-400 font-bold">{totalPoolSol} SOL</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Select Winning Outcome</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome(true)}
                className={`py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                  outcome
                    ? 'bg-emerald-400 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> YES WON
              </button>
              <button
                type="button"
                onClick={() => setOutcome(false)}
                className={`py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                  !outcome
                    ? 'bg-rose-400 text-rose-950 border-rose-400 shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4" /> NO WON
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={resolving}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{resolving ? 'Signing Resolution Tx...' : 'FINALIZE OUTCOME ON SOLANA'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
