import React, { useState } from 'react';
import {
  Wallet,
  Sparkles,
  Droplets,
  Copy,
  Check,
  Code2,
  History,
  PlusCircle,
  TrendingUp,
  Award,
  ShieldCheck,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import type { WalletState, NetworkType } from '../types';
import { PROGRAM_ID_STR } from '../solana/anchorClient';

interface HeaderProps {
  wallet: WalletState;
  network: NetworkType;
  onSetNetwork: (network: NetworkType) => void;
  onConnectPhantom: () => Promise<boolean>;
  onGenerateEphemeral: () => void;
  onRequestAirdrop: () => void;
  onOpenCreateModal: () => void;
  onOpenIdlModal: () => void;
  onOpenTxLogs: () => void;
  onOpenWalletModal: () => void;
  activeTab: 'explore' | 'positions' | 'creator';
  setActiveTab: (tab: 'explore' | 'positions' | 'creator') => void;
  airdropping: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  wallet,
  network,
  onSetNetwork,
  onConnectPhantom,
  onGenerateEphemeral,
  onRequestAirdrop,
  onOpenCreateModal,
  onOpenIdlModal,
  onOpenTxLogs,
  onOpenWalletModal,
  activeTab,
  setActiveTab,
  airdropping,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedProgram, setCopiedProgram] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyToClipboard = (text: string, isProgram = false) => {
    navigator.clipboard.writeText(text);
    if (isProgram) {
      setCopiedProgram(true);
      setTimeout(() => setCopiedProgram(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const formattedBalance = (wallet.balanceLamports / 1e9).toFixed(3);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setActiveTab('explore')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-purple-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-200 to-emerald-300">
                    SolPred
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-semibold">
                    Anchor
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xl:block">Solana On-Chain Prediction Market</p>
              </div>
            </div>

            {/* Program ID Badge (Hidden on mobile/tablet) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Program:</span>
              <span className="text-purple-300">{PROGRAM_ID_STR.slice(0, 4)}...{PROGRAM_ID_STR.slice(-4)}</span>
              <button
                onClick={() => copyToClipboard(PROGRAM_ID_STR, true)}
                className="hover:text-slate-200 transition-colors ml-1"
                title="Copy Program ID"
              >
                {copiedProgram ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'explore'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Markets
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'positions'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              My Bets
            </button>
            <button
              onClick={() => setActiveTab('creator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'creator'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Creator Panel
            </button>
          </nav>

          {/* Right Action Tools & Wallet */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Create Market Button (Desktop & Tablet) */}
            <button
              onClick={onOpenCreateModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-all rounded-lg shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Create Market</span>
            </button>

            {/* IDL Inspector */}
            <button
              onClick={onOpenIdlModal}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-purple-300 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              title="Anchor IDL & PDA Inspector"
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Tx History */}
            <button
              onClick={onOpenTxLogs}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-purple-300 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              title="Transaction Logs"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Network Selector */}
            <select
              value={network}
              onChange={(e) => onSetNetwork(e.target.value as NetworkType)}
              className="hidden sm:block bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 sm:px-2.5 py-1.5 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="simulation">Simulation</option>
              <option value="devnet">Devnet</option>
              <option value="mainnet-beta">Mainnet</option>
            </select>

            {/* Wallet Section */}
            {wallet.connected && wallet.publicKey ? (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {/* Balance & Airdrop */}
                <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="text-[11px] sm:text-xs font-bold font-mono text-emerald-400">
                    {formattedBalance} <span className="hidden xs:inline">SOL</span>
                  </span>
                  <button
                    onClick={onRequestAirdrop}
                    disabled={airdropping}
                    className="p-1 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded transition-colors disabled:opacity-50"
                    title="Request 5 SOL Airdrop"
                  >
                    {airdropping ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                    ) : (
                      <Droplets className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Account Trigger */}
                <button
                  onClick={onOpenWalletModal}
                  className="px-2 py-1 text-xs font-mono text-purple-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Manage Wallet Account"
                >
                  <Wallet className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    {wallet.publicKey.slice(0, 3)}...{wallet.publicKey.slice(-3)}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenWalletModal}
                className="px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation & Actions Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {/* Nav Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('explore');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${
                  activeTab === 'explore' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Markets
              </button>
              <button
                onClick={() => {
                  setActiveTab('positions');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${
                  activeTab === 'positions' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                My Bets
              </button>
              <button
                onClick={() => {
                  setActiveTab('creator');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${
                  activeTab === 'creator' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Creator
              </button>
            </div>

            {/* Extra Mobile Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => {
                  onOpenCreateModal();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Market</span>
              </button>

              <select
                value={network}
                onChange={(e) => onSetNetwork(e.target.value as NetworkType)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="simulation">Simulation</option>
                <option value="devnet">Devnet</option>
                <option value="mainnet-beta">Mainnet</option>
              </select>
            </div>
          </div>
        )}

        {/* Persistent Mobile Bottom Navigation Bar for rapid tab switching */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-800/80 bg-slate-950">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'explore' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Markets</span>
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'positions' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>My Bets</span>
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'creator' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Creator</span>
          </button>
        </div>
      </div>
    </header>
  );
};

