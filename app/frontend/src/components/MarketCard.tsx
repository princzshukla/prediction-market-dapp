import React, { useState, useEffect } from 'react';
import type{ Market, UserPosition } from '../types';
import {
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Shield,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { calculatePayout } from '../solana/anchorClient';

interface MarketCardProps {
  market: Market;
  userPosition?: UserPosition;
  currentWalletAddress: string | null;
  onSelectMarket: (market: Market, defaultBetYes?: boolean) => void;
  onOpenResolveModal: (market: Market) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  userPosition,
  currentWalletAddress,
  onSelectMarket,
  onOpenResolveModal,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = market.resolution_time - nowSec;

      if (diff <= 0) {
        setTimeLeft('Resolution Time Reached');
        setIsExpired(true);
      } else {
        setIsExpired(false);
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = diff % 60;

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${mins}m left`);
        } else if (mins > 0) {
          setTimeLeft(`${mins}m ${secs.toString().padStart(2, '0')}s left`);
        } else {
          setTimeLeft(`${secs}s left`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [market.resolution_time]);

  const totalPoolLamports = market.yes_pool + market.no_pool;
  const totalPoolSol = (totalPoolLamports / 1e9).toFixed(2);

  // Compute probabilities
  let yesPercent = 50;
  let noPercent = 50;

  if (totalPoolLamports > 0) {
    yesPercent = Math.round((market.yes_pool / totalPoolLamports) * 100);
    noPercent = 100 - yesPercent;
  }

  // Multiplier for 1 SOL bet
  const yesMultiplier = market.yes_pool > 0 ? (totalPoolLamports / market.yes_pool).toFixed(2) : '2.00';
  const noMultiplier = market.no_pool > 0 ? (totalPoolLamports / market.no_pool).toFixed(2) : '2.00';

  const isCreator = currentWalletAddress && market.creator === currentWalletAddress;

  return (
    <div className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-black/20 hover:shadow-purple-500/10 group">
      <div>
        {/* Card Header: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 text-purple-300 border border-slate-700/80 rounded-lg uppercase tracking-wider">
              {market.category || 'Crypto'}
            </span>
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              ID #{market.market_id}
            </span>
          </div>

          {/* Status Badge */}
          {market.resolved ? (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                market.outcome
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {market.outcome ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolved: YES
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Resolved: NO
                </>
              )}
            </span>
          ) : isExpired ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Ready for Resolution
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> {timeLeft}
            </span>
          )}
        </div>

        {/* Question Title */}
        <h3
          onClick={() => onSelectMarket(market)}
          className="text-base font-semibold text-slate-100 group-hover:text-purple-200 transition-colors cursor-pointer line-clamp-2 mb-4 leading-snug"
        >
          {market.question}
        </h3>

        {/* Odds Probability Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-mono font-medium mb-1.5">
            <span className="text-emerald-400 flex items-center gap-1">
              YES {yesPercent}% <span className="text-[10px] text-slate-400">({yesMultiplier}x)</span>
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              NO {noPercent}% <span className="text-[10px] text-slate-400">({noMultiplier}x)</span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-l-full transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-r-full transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>

        {/* Pool Volume & Position Info */}
        <div className="flex items-center justify-between py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Pool Volume:</span>
            <span className="font-bold font-mono text-slate-200">{totalPoolSol} SOL</span>
          </div>

          {userPosition && (userPosition.yes_amount > 0 || userPosition.no_amount > 0) ? (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono font-medium text-[11px] border border-purple-500/30">
              Your Bet: {((userPosition.yes_amount + userPosition.no_amount) / 1e9).toFixed(2)} SOL
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">No bet placed</span>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-2">
        {market.resolved ? (
          <button
            onClick={() => onSelectMarket(market)}
            className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span>View Resolution & Claim Payout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : isExpired ? (
          <div className="flex gap-2">
            <button
              onClick={() => onSelectMarket(market)}
              className="flex-1 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Market Details
            </button>
            {isCreator && (
              <button
                onClick={() => onOpenResolveModal(market)}
                className="flex-1 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-500/20"
              >
                Resolve Market
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectMarket(market, true)}
              className="py-2.5 px-3 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              <span>BET YES</span>
              <span className="text-[10px] font-mono opacity-80">({yesMultiplier}x)</span>
            </button>
            <button
              onClick={() => onSelectMarket(market, false)}
              className="py-2.5 px-3 text-xs font-bold text-rose-950 bg-rose-400 hover:bg-rose-300 rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              <span>BET NO</span>
              <span className="text-[10px] font-mono opacity-80">({noMultiplier}x)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
