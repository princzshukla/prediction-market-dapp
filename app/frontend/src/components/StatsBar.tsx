import React from 'react';
import type{ Market } from '../types';
import { TrendingUp, Coins, CheckCircle2, Clock, Zap } from 'lucide-react';

interface StatsBarProps {
  markets: Market[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ markets }) => {
  const totalYesPoolLamports = markets.reduce((acc, m) => acc + m.yes_pool, 0);
  const totalNoPoolLamports = markets.reduce((acc, m) => acc + m.no_pool, 0);
  const totalTVLLamports = totalYesPoolLamports + totalNoPoolLamports;
  const totalTVLSol = (totalTVLLamports / 1e9).toFixed(1);

  const nowSec = Math.floor(Date.now() / 1000);
  const activeMarkets = markets.filter((m) => !m.resolved && m.resolution_time > nowSec);
  const closingSoonMarkets = markets.filter((m) => !m.resolved && m.resolution_time <= nowSec + 86400);
  const resolvedMarkets = markets.filter((m) => m.resolved);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-4 sm:my-6">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Total Volume</span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">{totalTVLSol}</span>
          <span className="text-xs font-semibold text-purple-400 font-mono">SOL</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Locked in prediction pools</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Active Markets</span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">{activeMarkets.length}</span>
          <span className="text-[11px] sm:text-xs font-medium text-emerald-400">Open</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Live smart contracts</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Closing Soon</span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">{closingSoonMarkets.length}</span>
          <span className="text-[11px] sm:text-xs font-medium text-amber-400">&lt;24 hours</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Nearing resolution</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Resolved</span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">{resolvedMarkets.length}</span>
          <span className="text-[11px] sm:text-xs font-medium text-indigo-400">Claimable</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Finalized on Solana</p>
      </div>
    </div>
  );
};
