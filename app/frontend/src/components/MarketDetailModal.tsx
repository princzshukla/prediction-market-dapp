import React, { useState } from 'react';
import type { Market, UserPosition } from '../types';
import {
  X,
  Clock,
  Coins,
  Shield,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Zap,
  HelpCircle,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import confetti from 'canvas-confetti';
import { calculatePayout } from '../solana/anchorClient';

interface MarketDetailModalProps {
  market: Market | null;
  userPosition?: UserPosition;
  walletBalanceLamports: number;
  onClose: () => void;
  onPlaceBet: (marketPubkey: string, amountSol: number, betYes: boolean) => Promise<void>;
  onClaimWinnings: (marketPubkey: string) => Promise<void>;
  defaultBetYes?: boolean;
  onOpenResolveModal: (market: Market) => void;
  currentWalletAddress: string | null;
}

export const MarketDetailModal: React.FC<MarketDetailModalProps> = ({
  market,
  userPosition,
  walletBalanceLamports,
  onClose,
  onPlaceBet,
  onClaimWinnings,
  defaultBetYes = true,
  onOpenResolveModal,
  currentWalletAddress,
}) => {
  if (!market) return null;

  const [betYes, setBetYes] = useState<boolean>(defaultBetYes);
  const [betAmountSol, setBetAmountSol] = useState<string>('0.5');
  const [placingBet, setPlacingBet] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [copiedPda, setCopiedPda] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numAmount = parseFloat(betAmountSol) || 0;
  const numAmountLamports = Math.floor(numAmount * 1e9);

  const totalPoolLamports = market.yes_pool + market.no_pool;
  const totalPoolSol = (totalPoolLamports / 1e9).toFixed(2);

  // Compute probabilities
  const yesRatio = totalPoolLamports > 0 ? market.yes_pool / totalPoolLamports : 0.5;
  const yesPercent = Math.round(yesRatio * 100);
  const noPercent = 100 - yesPercent;

  // On-Chain Payout Math Calculation
  const payoutMath = calculatePayout(
    numAmountLamports,
    betYes,
    market.yes_pool,
    market.no_pool
  );

  const expectedWinningsSol = (payoutMath.winningsLamports / 1e9).toFixed(3);
  const expectedTotalPayoutSol = (payoutMath.totalPayoutLamports / 1e9).toFixed(3);
  const roiPercent = payoutMath.roi.toFixed(1);

  // Generate mock chart data simulating probability drift leading to current YES %
  const chartData = [
    { time: '7d ago', probability: Math.max(10, Math.min(90, yesPercent - 18)) },
    { time: '5d ago', probability: Math.max(10, Math.min(90, yesPercent - 12)) },
    { time: '3d ago', probability: Math.max(10, Math.min(90, yesPercent - 5)) },
    { time: '1d ago', probability: Math.max(10, Math.min(90, yesPercent + 4)) },
    { time: '12h ago', probability: Math.max(10, Math.min(90, yesPercent - 2)) },
    { time: 'Now', probability: yesPercent },
  ];

  const handleBetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid SOL amount');
      return;
    }

    if (numAmountLamports > walletBalanceLamports) {
      setErrorMsg(`Insufficient balance (${(walletBalanceLamports / 1e9).toFixed(2)} SOL available)`);
      return;
    }

    try {
      setPlacingBet(true);
      await onPlaceBet(market.pubkey, numAmount, betYes);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
      setPlacingBet(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place bet');
      setPlacingBet(false);
    }
  };

  const handleClaimSubmit = async () => {
    setErrorMsg(null);
    try {
      setClaiming(true);
      await onClaimWinnings(market.pubkey);
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
      });
      setClaiming(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim winnings');
      setClaiming(false);
    }
  };

  const copyPda = () => {
    navigator.clipboard.writeText(market.pubkey);
    setCopiedPda(true);
    setTimeout(() => setCopiedPda(false), 2000);
  };

  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = market.resolution_time <= nowSec;
  const isCreator = currentWalletAddress && market.creator === currentWalletAddress;

  // Position status
  const userHasPosition = userPosition && (userPosition.yes_amount > 0 || userPosition.no_amount > 0);
  const winningOutcome = market.outcome;
  const userWon =
    market.resolved &&
    userHasPosition &&
    ((winningOutcome === true && userPosition.yes_amount > 0) ||
      (winningOutcome === false && userPosition.no_amount > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl my-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-start justify-between gap-3 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg uppercase tracking-wider">
                {market.category || 'Crypto'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">Market ID: #{market.market_id}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 leading-snug">{market.question}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Column: Analytics & Probability Chart */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Probability Overview Bar */}
            <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Current Probability Pool</span>
                <span className="text-xs font-mono text-amber-400 font-bold">Total Pool: {totalPoolSol} SOL</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-3">
                <div className="p-2.5 sm:p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <div className="text-xs text-emerald-400 font-medium">YES Pool</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-emerald-300">{yesPercent}%</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">{(market.yes_pool / 1e9).toFixed(2)} SOL</div>
                </div>

                <div className="p-2.5 sm:p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl">
                  <div className="text-xs text-rose-400 font-medium">NO Pool</div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-rose-300">{noPercent}%</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">{(market.no_pool / 1e9).toFixed(2)} SOL</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-36 sm:h-44 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorYes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'YES Chance']}
                    />
                    <Area type="monotone" dataKey="probability" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorYes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Existing Position Card */}
            {userHasPosition && (
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-400" /> Your Active Position
                  </span>
                  {userPosition.claimed && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      Winnings Claimed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">YES Bet:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {(userPosition.yes_amount / 1e9).toFixed(3)} SOL
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">NO Bet:</span>
                    <span className="text-rose-400 font-bold text-sm">
                      {(userPosition.no_amount / 1e9).toFixed(3)} SOL
                    </span>
                  </div>
                </div>

                {/* Claim Button */}
                {market.resolved && userWon && !userPosition.claimed && (
                  <button
                    onClick={handleClaimSubmit}
                    disabled={claiming}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{claiming ? 'Executing Claim Transaction...' : 'CLAIM WINNINGS NOW'}</span>
                  </button>
                )}
              </div>
            )}

            {/* On-Chain PDA Details Accordion */}
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs text-slate-400 space-y-2 font-mono">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" /> On-Chain Anchor State
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-purple-300">Bump: {market.bump}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span>Market PDA:</span>
                <div className="flex items-center gap-1 text-slate-200">
                  <span>
                    {market.pubkey.slice(0, 8)}...{market.pubkey.slice(-8)}
                  </span>
                  <button onClick={copyPda} className="hover:text-purple-300">
                    {copiedPda ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Creator Address:</span>
                <span className="text-slate-200">
                  {market.creator.slice(0, 8)}...{market.creator.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Bet Slip Form */}
          <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            {market.resolved ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                  {market.outcome ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <XCircle className="w-8 h-8 text-rose-400" />}
                </div>
                <h3 className="text-lg font-bold text-slate-100">Market Resolved</h3>
                <p className="text-xs text-slate-400">
                  Winning Outcome: <strong className={market.outcome ? 'text-emerald-400' : 'text-rose-400'}>{market.outcome ? 'YES' : 'NO'}</strong>
                </p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Betting Period Ended</h3>
                <p className="text-xs text-slate-400">Awaiting market creator resolution on Solana.</p>
                {isCreator && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenResolveModal(market);
                    }}
                    className="w-full py-3 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    Resolve Market Outcome
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleBetSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">1. Select Prediction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBetYes(true)}
                      className={`py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                        betYes
                          ? 'bg-emerald-400 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setBetYes(false)}
                      className={`py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                        !betYes
                          ? 'bg-rose-400 text-rose-950 border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <XCircle className="w-4 h-4" /> NO
                    </button>
                  </div>
                </div>

                {/* Amount Inputs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300">2. Bet Amount (SOL)</label>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Balance: {(walletBalanceLamports / 1e9).toFixed(2)} SOL
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={betAmountSol}
                      onChange={(e) => setBetAmountSol(e.target.value)}
                      placeholder="0.5"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 font-mono text-sm focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-slate-400 font-mono">SOL</span>
                  </div>

                  {/* Preset Amount Pills */}
                  <div className="flex gap-2">
                    {['0.1', '0.5', '1.0', '2.5'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBetAmountSol(preset)}
                        className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors ${
                          betAmountSol === preset
                            ? 'bg-purple-600/30 text-purple-300 border-purple-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payout Formula Preview */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Potential Return:</span>
                    <span className="text-slate-200 font-bold">{expectedTotalPayoutSol} SOL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Net Profit:</span>
                    <span className="text-emerald-400 font-bold">+{expectedWinningsSol} SOL</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Multiplier ROI:</span>
                    <span className="text-purple-300 font-bold">{payoutMath.multiplier.toFixed(2)}x (+{roiPercent}%)</span>
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
                  disabled={placingBet}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{placingBet ? 'Signing Solana Transaction...' : `CONFIRM BET ON ${betYes ? 'YES' : 'NO'}`}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
