import React, { useState } from 'react';
import { X, Code2, Shield, Copy, Check, Terminal, FileCode, Layers } from 'lucide-react';
import { PROGRAM_ID_STR, DISCRIMINATORS, ACCOUNT_DISCRIMINATORS } from '../solana/anchorClient';

interface IdlInspectorModalProps {
  onClose: () => void;
}

export const IdlInspectorModal: React.FC<IdlInspectorModalProps> = ({ onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'idl' | 'rust' | 'pda'>('idl');
  const [copiedIdl, setCopiedIdl] = useState(false);

  const rawIdlJson = {
    address: PROGRAM_ID_STR,
    metadata: {
      name: "prediction_market",
      version: "0.1.0",
      spec: "0.1.0",
      description: "Created with Anchor"
    },
    instructions: [
      { name: "create_market", discriminator: Array.from(DISCRIMINATORS.create_market), args: ["market_id: u64", "question: string", "resolution_time: i64"] },
      { name: "place_bet", discriminator: Array.from(DISCRIMINATORS.place_bet), args: ["amount: u64", "bet_yes: bool"] },
      { name: "resolve_market", discriminator: Array.from(DISCRIMINATORS.resolve_market), args: ["outcome: bool"] },
      { name: "claim_winning", discriminator: Array.from(DISCRIMINATORS.claim_winning), args: [] }
    ],
    accounts: [
      { name: "Market", discriminator: Array.from(ACCOUNT_DISCRIMINATORS.Market) },
      { name: "UserPosition", discriminator: Array.from(ACCOUNT_DISCRIMINATORS.UserPosition) }
    ]
  };

  const copyIdl = () => {
    navigator.clipboard.writeText(JSON.stringify(rawIdlJson, null, 2));
    setCopiedIdl(true);
    setTimeout(() => setCopiedIdl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Anchor IDL & Smart Contract Inspector</h2>
              <p className="text-xs font-mono text-slate-400">Program ID: {PROGRAM_ID_STR}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/50">
          <button
            onClick={() => setActiveSubTab('idl')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-xl transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'idl'
                ? 'bg-slate-900 text-purple-300 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> IDL JSON
          </button>
          <button
            onClick={() => setActiveSubTab('rust')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-xl transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'rust'
                ? 'bg-slate-900 text-purple-300 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> lib.rs Structs
          </button>
          <button
            onClick={() => setActiveSubTab('pda')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-xl transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'pda'
                ? 'bg-slate-900 text-purple-300 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> PDA Seeds & Discriminators
          </button>

          <button
            onClick={copyIdl}
            className="ml-auto text-xs font-mono text-slate-400 hover:text-purple-300 flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 mb-2"
          >
            {copiedIdl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy IDL</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-slate-300">
          {activeSubTab === 'idl' && (
            <pre className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 text-emerald-400 overflow-x-auto leading-relaxed">
              {JSON.stringify(rawIdlJson, null, 2)}
            </pre>
          )}

          {activeSubTab === 'rust' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-purple-200">
                <span className="text-slate-400 block mb-2">// Account 1: Market State Struct</span>
                <code>
                  pub struct Market &#123;<br />
                  &nbsp;&nbsp;pub creator: Pubkey,<br />
                  &nbsp;&nbsp;pub market_id: u64,<br />
                  &nbsp;&nbsp;pub question: String,<br />
                  &nbsp;&nbsp;pub resolution_time: i64,<br />
                  &nbsp;&nbsp;pub yes_pool: u64,<br />
                  &nbsp;&nbsp;pub no_pool: u64,<br />
                  &nbsp;&nbsp;pub resolved: bool,<br />
                  &nbsp;&nbsp;pub outcome: Option&lt;bool&gt;,<br />
                  &nbsp;&nbsp;pub bump: u8,<br />
                  &#125;
                </code>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-purple-200">
                <span className="text-slate-400 block mb-2">// Account 2: UserPosition Struct</span>
                <code>
                  pub struct UserPosition &#123;<br />
                  &nbsp;&nbsp;pub market: Pubkey,<br />
                  &nbsp;&nbsp;pub user: Pubkey,<br />
                  &nbsp;&nbsp;pub yes_amount: u64,<br />
                  &nbsp;&nbsp;pub no_amount: u64,<br />
                  &nbsp;&nbsp;pub claimed: bool,<br />
                  &nbsp;&nbsp;pub bump: u8,<br />
                  &#125;
                </code>
              </div>
            </div>
          )}

          {activeSubTab === 'pda' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block">1. Market PDA Derivation</span>
                <p className="text-slate-400">
                  Seeds: <code className="text-emerald-300">[b"market", creator.key(), &market_id.to_le_bytes()]</code>
                </p>
                <p className="text-slate-400">
                  Discriminator: <code className="text-purple-300">[103, 226, 97, 235, 200, 188, 251, 254]</code>
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block">2. User Position PDA Derivation</span>
                <p className="text-slate-400">
                  Seeds: <code className="text-emerald-300">[b"position", market.key(), user.key()]</code>
                </p>
                <p className="text-slate-400">
                  Discriminator: <code className="text-purple-300">[222, 62, 67, 220, 63, 166, 126, 33]</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
