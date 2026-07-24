import React from 'react';
import type{ UserPosition, Market } from '../types';
import { Award, Sparkles, CheckCircle2, XCircle, Clock, ExternalLink, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserPositionsViewProps {
  positions: UserPosition[];
  markets: Market[];
  onClaimWinnings: (marketPubkey: string) => Promise<void>;
  onSelectMarket: (market: Market) => void;
}

export const UserPositionsView: React.FC<UserPositionsViewProps> = ({
  positions,
  markets,
  onClaimWinnings,
  onSelectMarket,
}) => {
  const [claimingMap, setClaimingMap] = React.useState<Record<string, boolean>>({});

  const handleClaim = async (marketPubkey: string) => {
    setClaimingMap((prev) => ({ ...prev, [marketPubkey]: true }));
    try {
      await onClaimWinnings(marketPubkey);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e: any) {
      alert(e.message || 'Failed to claim winnings');
    } finally {
      setClaimingMap((prev) => ({ ...prev, [marketPubkey]: false }));
    }
  };

  if (positions.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center my-8 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400 mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 mb-2">No Active Predictions Yet</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          You haven't placed any bets yet. Explore live markets, back your prediction with SOL, and earn high-yield payouts on Solana!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" /> My Predictions & Claims
          </h2>
          <p className="text-xs text-slate-400">Track positions, monitor outcome resolutions, and claim payouts</p>
        </div>
        <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono font-bold rounded-lg">
          {positions.length} Total Bets
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map((pos) => {
          const market = markets.find((m) => m.pubkey === pos.market);
          if (!market) return null;

          const totalUserBet = pos.yes_amount + pos.no_amount;
          const userBetSol = (totalUserBet / 1e9).toFixed(3);
          const isBetYes = pos.yes_amount > 0;

          const totalPool = market.yes_pool + market.no_pool;
          const userWinningBet = market.outcome ? pos.yes_amount : pos.no_amount;
          const totalWinningPool = market.outcome ? market.yes_pool : market.no_pool;
          const totalLosingPool = market.outcome ? market.no_pool : market.yes_pool;

          let payoutSol = '0.000';
          if (market.resolved && userWinningBet > 0 && totalWinningPool > 0) {
            const winningsLamports = Math.floor((userWinningBet * totalLosingPool) / totalWinningPool);
            payoutSol = ((userWinningBet + winningsLamports) / 1e9).toFixed(3);
          }

          const userWon = market.resolved && ((market.outcome === true && pos.yes_amount > 0) || (market.outcome === false && pos.no_amount > 0));
          const userLost = market.resolved && !userWon;

          return (
            <div
              key={pos.pubkey}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/40 transition-colors shadow-lg"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    PDA: {pos.pubkey.slice(0, 6)}...{pos.pubkey.slice(-4)}
                  </span>

                  {market.resolved ? (
                    userWon ? (
                      pos.claimed ? (
                        <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Claimed ({payoutSol} SOL)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" /> Ready to Claim ({payoutSol} SOL)
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Outcome Lost
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Market Open
                    </span>
                  )}
                </div>

                {/* Market Question */}
                <h4
                  onClick={() => onSelectMarket(market)}
                  className="text-sm font-semibold text-slate-100 hover:text-purple-300 transition-colors cursor-pointer line-clamp-2 mb-4"
                >
                  {market.question}
                </h4>

                {/* Position Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Predicted Side:</span>
                    <span className={isBetYes ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isBetYes ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total Wager:</span>
                    <span className="text-purple-300 font-bold">{userBetSol} SOL</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {market.resolved && userWon && !pos.claimed && (
                <button
                  onClick={() => handleClaim(market.pubkey)}
                  disabled={claimingMap[market.pubkey]}
                  className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{claimingMap[market.pubkey] ? 'Claiming Payout...' : `CLAIM ${payoutSol} SOL WINNINGS`}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
