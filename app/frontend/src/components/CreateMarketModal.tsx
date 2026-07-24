import React, { useState } from 'react';
import { X, PlusCircle, Calendar, Shield, AlertCircle, HelpCircle, Sparkles, Clock } from 'lucide-react';
import { deriveMarketPDA } from '../solana/anchorClient';
import { PublicKey } from '@solana/web3.js';

interface CreateMarketModalProps {
  creatorPublicKey: string | null;
  onClose: () => void;
  onCreateMarket: (question: string, resolutionTimeUnix: number, marketId?: string) => Promise<void>;
}

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  creatorPublicKey,
  onClose,
  onCreateMarket,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [category, setCategory] = useState<'Crypto' | 'AI & Tech' | 'Space' | 'Governance' | 'Economics'>('Crypto');
  const [daysFromNow, setDaysFromNow] = useState<number>(7);
  const [customMarketId, setCustomMarketId] = useState<string>(
    Math.floor(Math.random() * 900000 + 100000).toString()
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive PDA preview
  let derivedPdaStr = 'Awaiting creator key...';
  if (creatorPublicKey) {
    try {
      const creatorPk = new PublicKey(creatorPublicKey);
      const [pda] = deriveMarketPDA(creatorPk, customMarketId);
      derivedPdaStr = pda.toBase58();
    } catch {
      derivedPdaStr = 'Invalid Key';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!question.trim()) {
      setErrorMsg('Market question cannot be empty');
      return;
    }

    if (question.length > 280) {
      setErrorMsg('Question exceeds maximum length of 280 characters');
      return;
    }

    const resolutionUnix = Math.floor(Date.now() / 1000) + daysFromNow * 86400;

    try {
      setSubmitting(true);
      await onCreateMarket(question, resolutionUnix, customMarketId);
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create market on-chain');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create Prediction Market</h2>
              <p className="text-xs text-slate-400">Initialize `Market` account on Solana</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Question Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Prediction Question</label>
              <span className={`text-[11px] font-mono ${question.length > 280 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                {question.length}/280 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will Solana process over 100,000 TPS on Firedancer testnet in Q3 2026?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Category & Resolution Days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Crypto">Crypto</option>
                <option value="AI & Tech">AI & Tech</option>
                <option value="Space">Space</option>
                <option value="Governance">Governance</option>
                <option value="Economics">Economics</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Duration (Days)</label>
              <select
                value={daysFromNow}
                onChange={(e) => setDaysFromNow(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value={1}>1 Day (24 hours)</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
              </select>
            </div>
          </div>

          {/* Market ID & Live PDA Preview */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Market ID (u64):</span>
              <input
                type="number"
                value={customMarketId}
                onChange={(e) => setCustomMarketId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-right font-mono text-purple-300 focus:outline-none w-32"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Derived Market PDA:</span>
              <span className="text-emerald-400 font-bold">
                {derivedPdaStr.slice(0, 6)}...{derivedPdaStr.slice(-6)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Anchor Seeds:</span>
              <span>[b"market", creator, market_id]</span>
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
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'Creating Market On-Chain...' : 'CREATE MARKET ON SOLANA'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
