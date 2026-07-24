import React, { useState } from 'react';
import {
  Wallet,
  Sparkles,
  Droplets,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Key,
  ShieldCheck,
  RefreshCw,
  X,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type{ WalletState, NetworkType } from '../types';
import { solanaEngine } from '../solana/solanaEngine';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  network: NetworkType;
  onSetNetwork: (network: NetworkType) => void;
  onConnectPhantom: () => Promise<boolean>;
  onGenerateEphemeral: () => void;
  onRequestAirdrop: () => void;
  onDisconnect: () => void;
  airdropping: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  network,
  onSetNetwork,
  onConnectPhantom,
  onGenerateEphemeral,
  onRequestAirdrop,
  onDisconnect,
  airdropping,
}) => {
  const [copied, setCopied] = useState(false);
  const [connectingPhantom, setConnectingPhantom] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [secretError, setSecretError] = useState('');
  const [showSecretImport, setShowSecretImport] = useState(false);

  if (!isOpen) return null;

  const isPhantomInstalled = typeof window !== 'undefined' && !!(window as any)?.solana?.isPhantom;
  const isSolflareInstalled = typeof window !== 'undefined' && !!(window as any)?.solflare;

  const copyAddress = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectPhantom = async () => {
    setConnectingPhantom(true);
    const success = await onConnectPhantom();
    setConnectingPhantom(false);
    if (success) {
      onClose();
    }
  };

  const handleGenerateDemo = () => {
    onGenerateEphemeral();
    onClose();
  };

  const handleImportSecret = (e: React.FormEvent) => {
    e.preventDefault();
    setSecretError('');
    try {
      // Clean and validate key
      const keyStr = secretInput.trim();
      if (!keyStr) {
        setSecretError('Please enter a secret key');
        return;
      }
      // Attempt import via solanaEngine or bs58
      // Store in ephemeral keypair format
      localStorage.setItem('solana_prediction_ephemeral_key_v1', keyStr);
      solanaEngine.generateEphemeralKeypair();
      onClose();
    } catch (err: any) {
      setSecretError('Invalid secret key string format');
    }
  };

  const formattedBalance = (wallet.balanceLamports / 1e9).toFixed(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                {wallet.connected ? 'Wallet Account' : 'Connect Solana Wallet'}
              </h3>
              <p className="text-xs text-slate-400">
                {wallet.connected ? 'Connected on ' + network : 'Select your preferred connection method'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {wallet.connected && wallet.publicKey ? (
            /* Connected View */
            <div className="space-y-4">
              {/* Wallet Info Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected ({wallet.walletType === 'phantom' ? 'Phantom' : 'Demo Wallet'})
                  </span>
                </div>

                {/* Balance */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-900">
                  <span className="text-xs text-slate-400">Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-emerald-400">{formattedBalance} SOL</span>
                    <button
                      onClick={onRequestAirdrop}
                      disabled={airdropping}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Request 5 SOL Airdrop"
                    >
                      {airdropping ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Droplets className="w-3.5 h-3.5" />
                      )}
                      <span>Airdrop</span>
                    </button>
                  </div>
                </div>

                {/* Public Key */}
                <div className="pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Public Key</span>
                    <button
                      onClick={copyAddress}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-sans"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl text-xs font-mono text-slate-200 break-all select-all">
                    {wallet.publicKey}
                  </div>
                </div>
              </div>

              {/* Actions & Explorer */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://explorer.solana.com/address/${wallet.publicKey}?cluster=${network}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Solana Explorer</span>
                </a>
                <button
                  onClick={() => {
                    onDisconnect();
                    onClose();
                  }}
                  className="px-3 py-2.5 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            /* Disconnected Options */
            <div className="space-y-3">
              {/* Phantom Button */}
              <button
                onClick={handleConnectPhantom}
                disabled={connectingPhantom}
                className="w-full p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-900/60 hover:to-indigo-900/60 border border-purple-500/30 rounded-2xl transition-all flex items-center justify-between group shadow-lg shadow-purple-950/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">Phantom Wallet</span>
                      {isPhantomInstalled ? (
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
                          Detected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
                          Extension
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Connect via browser extension</p>
                  </div>
                </div>
                {connectingPhantom ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              {/* Demo Test Keypair */}
              <button
                onClick={handleGenerateDemo}
                className="w-full p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">Instant Demo Keypair</span>
                      <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-semibold">
                        15 SOL
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Zero installation test wallet with 15 SOL</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Import Secret Key Option */}
              <div className="pt-2">
                {!showSecretImport ? (
                  <button
                    onClick={() => setShowSecretImport(true)}
                    className="w-full text-center text-xs text-slate-400 hover:text-purple-300 py-1 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Import custom secret key</span>
                  </button>
                ) : (
                  <form onSubmit={handleImportSecret} className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Base58 Secret Key</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Paste secret key..."
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    {secretError && <p className="text-[11px] text-rose-400">{secretError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                      >
                        Import Key
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSecretImport(false)}
                        className="px-3 py-1.5 text-xs bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Network Selector in Modal */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Solana Cluster
            </span>
            <select
              value={network}
              onChange={(e) => onSetNetwork(e.target.value as NetworkType)}
              className="bg-slate-950 border border-slate-800 text-purple-300 font-semibold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="simulation">Simulation</option>
              <option value="devnet">Solana Devnet</option>
              <option value="mainnet-beta">Mainnet-Beta</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
