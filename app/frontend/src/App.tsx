import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { MarketCard } from './components/MarketCard';
import { MarketDetailModal } from './components/MarketDetailModal';
import { CreateMarketModal } from './components/CreateMarketModal';
import { UserPositionsView } from './components/UserPositionView';
import { ResolveMarketModal } from './components/ResolveMarketModal';
import { IdlInspectorModal } from './components/IdlInspectorModal';
import { TxHistoryDrawer } from './components/TxHistoryDrawer';
import { WalletModal } from './components/WalletModal';
import { solanaEngine } from './solana/solanaEngine';
import type{ Market, UserPosition, WalletState, NetworkType } from './types';
import { Search, Filter, PlusCircle, TrendingUp, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [wallet, setWallet] = useState<WalletState>(solanaEngine.getWallet());
  const [network, setNetwork] = useState<NetworkType>(solanaEngine.getNetwork());
  const [markets, setMarkets] = useState<Market[]>(solanaEngine.getMarkets());
  const [userPositions, setUserPositions] = useState<UserPosition[]>(solanaEngine.getUserPositions());
  const [txLogs, setTxLogs] = useState(solanaEngine.getTxLogs());

  // UI state
  const [activeTab, setActiveTab] = useState<'explore' | 'positions' | 'creator'>('explore');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'volume' | 'ending' | 'newest'>('volume');
  const [airdropping, setAirdropping] = useState<boolean>(false);

  // Modals
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [defaultBetYes, setDefaultBetYes] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [resolveTargetMarket, setResolveTargetMarket] = useState<Market | null>(null);
  const [isIdlModalOpen, setIsIdlModalOpen] = useState<boolean>(false);
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = solanaEngine.subscribe(() => {
      setWallet({ ...solanaEngine.getWallet() });
      setMarkets([...solanaEngine.getMarkets()]);
      setUserPositions([...solanaEngine.getUserPositions()]);
      setTxLogs([...solanaEngine.getTxLogs()]);
    });
    return unsubscribe;
  }, []);

  const handleConnectPhantom = async () => {
    await solanaEngine.connectPhantomWallet();
  };

  const handleGenerateEphemeral = () => {
    solanaEngine.generateEphemeralKeypair();
  };

  const handleRequestAirdrop = async () => {
    try {
      setAirdropping(true);
      await solanaEngine.requestAirdrop(5);
    } catch (e: any) {
      alert(e.message || 'Airdrop failed');
    } finally {
      setAirdropping(false);
    }
  };

  const handleSetNetwork = (net: NetworkType) => {
    setNetwork(net);
    solanaEngine.setNetwork(net);
  };

  const handlePlaceBet = async (marketPubkey: string, amountSol: number, betYes: boolean) => {
    await solanaEngine.placeBet(marketPubkey, amountSol, betYes);
  };

  const handleCreateMarket = async (question: string, resolutionTimeUnix: number, marketId?: string) => {
    await solanaEngine.createMarket(question, resolutionTimeUnix, marketId);
  };

  const handleResolveMarket = async (marketPubkey: string, outcome: boolean) => {
    await solanaEngine.resolveMarket(marketPubkey, outcome);
  };

  const handleClaimWinnings = async (marketPubkey: string) => {
    await solanaEngine.claimWinnings(marketPubkey);
  };

  // Filter & Sort Markets
  const categories = ['All', 'Crypto', 'AI & Tech', 'Space', 'Governance', 'Economics'];

  const filteredMarkets = markets.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = m.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'volume') {
      return (b.yes_pool + b.no_pool) - (a.yes_pool + a.no_pool);
    }
    if (sortBy === 'ending') {
      return a.resolution_time - b.resolution_time;
    }
    if (sortBy === 'newest') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    return 0;
  });

  const creatorMarkets = markets.filter(
    (m) => wallet.publicKey && m.creator === wallet.publicKey
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white pb-16">
      {/* Header */}
      <Header
        wallet={wallet}
        network={network}
        onSetNetwork={handleSetNetwork}
        onConnectPhantom={handleConnectPhantom}
        onGenerateEphemeral={handleGenerateEphemeral}
        onRequestAirdrop={handleRequestAirdrop}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenIdlModal={() => setIsIdlModalOpen(true)}
        onOpenTxLogs={() => setIsTxDrawerOpen(true)}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        airdropping={airdropping}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Banner Hero */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/20 p-5 sm:p-8 overflow-hidden shadow-2xl mb-4 sm:mb-6">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] sm:text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              Anchor Smart Contract Live Preview
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100 mb-2">
              Predict the Future on <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">Solana</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Decentralized prediction markets powered by Rust smart contracts on Solana. Bet SOL on binary outcomes, earn yield from losing pools, and claim rewards.
            </p>
          </div>
        </div>

        {/* Global Stats Overview */}
        <StatsBar markets={markets} />

        {/* Main View Tabs Content */}
        {activeTab === 'explore' && (
          <div>
            {/* Category Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 my-4 sm:my-6 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search markets..."
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-purple-500 shrink-0"
                >
                  <option value="volume">Highest Pool</option>
                  <option value="ending">Ending Soon</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Markets Grid */}
            {sortedMarkets.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-slate-900/40 border border-slate-800 rounded-3xl my-6 px-4">
                <p className="text-sm text-slate-400 mb-2">No prediction markets match your filter criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="text-xs text-purple-400 hover:underline font-semibold"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {sortedMarkets.map((market) => {
                  const userPos = userPositions.find((p) => p.market === market.pubkey);
                  return (
                    <MarketCard
                      key={market.pubkey}
                      market={market}
                      userPosition={userPos}
                      currentWalletAddress={wallet.publicKey}
                      onSelectMarket={(m, isYes = true) => {
                        setSelectedMarket(m);
                        setDefaultBetYes(isYes);
                      }}
                      onOpenResolveModal={(m) => setResolveTargetMarket(m)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Positions View */}
        {activeTab === 'positions' && (
          <UserPositionsView
            positions={userPositions}
            markets={markets}
            onClaimWinnings={handleClaimWinnings}
            onSelectMarket={(m) => setSelectedMarket(m)}
          />
        )}

        {/* Creator Panel View */}
        {activeTab === 'creator' && (
          <div className="my-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-purple-400" /> Creator Dashboard
                </h2>
                <p className="text-xs text-slate-400">Markets created by your current connected wallet address</p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Market</span>
              </button>
            </div>

            {creatorMarkets.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto">
                <p className="text-sm text-slate-300 mb-4">You have not created any prediction markets with this wallet yet.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Create Your First Market
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {creatorMarkets.map((market) => (
                  <MarketCard
                    key={market.pubkey}
                    market={market}
                    currentWalletAddress={wallet.publicKey}
                    onSelectMarket={(m) => setSelectedMarket(m)}
                    onOpenResolveModal={(m) => setResolveTargetMarket(m)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <MarketDetailModal
        market={selectedMarket}
        userPosition={userPositions.find((p) => selectedMarket && p.market === selectedMarket.pubkey)}
        walletBalanceLamports={wallet.balanceLamports}
        onClose={() => setSelectedMarket(null)}
        onPlaceBet={handlePlaceBet}
        onClaimWinnings={handleClaimWinnings}
        defaultBetYes={defaultBetYes}
        onOpenResolveModal={(m) => setResolveTargetMarket(m)}
        currentWalletAddress={wallet.publicKey}
      />

      {isCreateModalOpen && (
        <CreateMarketModal
          creatorPublicKey={wallet.publicKey}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateMarket={handleCreateMarket}
        />
      )}

      {resolveTargetMarket && (
        <ResolveMarketModal
          market={resolveTargetMarket}
          onClose={() => setResolveTargetMarket(null)}
          onResolveMarket={handleResolveMarket}
        />
      )}

      {isIdlModalOpen && <IdlInspectorModal onClose={() => setIsIdlModalOpen(false)} />}

      {isTxDrawerOpen && <TxHistoryDrawer logs={txLogs} onClose={() => setIsTxDrawerOpen(false)} />}

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        network={network}
        onSetNetwork={handleSetNetwork}
        onConnectPhantom={handleConnectPhantom}
        onGenerateEphemeral={handleGenerateEphemeral}
        onRequestAirdrop={handleRequestAirdrop}
        onDisconnect={() => solanaEngine.disconnectWallet()}
        airdropping={airdropping}
      />
    </div>
  );
}
