import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import type { Market, UserPosition, WalletState, TransactionLog, NetworkType } from '../types';
import {
  PROGRAM_ID,
  buildCreateMarketInstruction,
  buildPlaceBetInstruction,
  buildResolveMarketInstruction,
  buildClaimWinningInstruction,
  deriveUserPositionPDA,
  deriveMarketPDA,
  calculatePayout,
} from './anchorClient';
import { getInitialMarkets, getInitialUserPositions, MOCK_CREATOR_KEY } from './mocData';

const LOCAL_STORAGE_KEYS = {
  MARKETS: 'solana_prediction_markets_v1',
  USER_POSITIONS: 'solana_prediction_positions_v1',
  TX_LOGS: 'solana_prediction_tx_logs_v1',
  EPHEMERAL_KEY: 'solana_prediction_ephemeral_key_v1',
  NETWORK: 'solana_prediction_network_v1',
  BALANCE: 'solana_prediction_sim_balance_v1',
};

export const NETWORKS: Record<NetworkType, { name: string; endpoint: string }> = {
  simulation: { name: 'Simulation Localnet', endpoint: 'http://localhost:8899' },
  devnet: { name: 'Solana Devnet', endpoint: 'https://api.devnet.solana.com' },
  'mainnet-beta': { name: 'Solana Mainnet (Read-only)', endpoint: 'https://api.mainnet-beta.solana.com' },
  localnet: { name: 'Custom Localnet', endpoint: 'http://127.0.0.1:8899' },
};

export class SolanaEngine {
  private network: NetworkType = 'simulation';
  private connection: Connection;
  private wallet: WalletState = {
    connected: false,
    publicKey: null,
    balanceLamports: 10 * LAMPORTS_PER_SOL,
    walletType: 'disconnected',
  };
  private markets: Market[] = [];
  private positions: UserPosition[] = [];
  private txLogs: TransactionLog[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // Load stored network
    const savedNetwork = localStorage.getItem(LOCAL_STORAGE_KEYS.NETWORK) as NetworkType;
    if (savedNetwork && NETWORKS[savedNetwork]) {
      this.network = savedNetwork;
    }
    this.connection = new Connection(NETWORKS[this.network].endpoint, 'confirmed');

    // Initialize state
    this.loadState();
    this.initWallet();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getNetwork(): NetworkType {
    return this.network;
  }

  public setNetwork(network: NetworkType) {
    this.network = network;
    localStorage.setItem(LOCAL_STORAGE_KEYS.NETWORK, network);
    this.connection = new Connection(NETWORKS[network].endpoint, 'confirmed');
    this.refreshBalance();
    this.notify();
  }

  public getWallet(): WalletState {
    return this.wallet;
  }

  public getMarkets(): Market[] {
    return this.markets;
  }

  public getUserPositions(): UserPosition[] {
    if (!this.wallet.publicKey) return [];
    return this.positions.filter((p) => p.user === this.wallet.publicKey);
  }

  public getTxLogs(): TransactionLog[] {
    return this.txLogs;
  }

  private loadState() {
    // Load markets
    const savedMarkets = localStorage.getItem(LOCAL_STORAGE_KEYS.MARKETS);
    if (savedMarkets) {
      try {
        this.markets = JSON.parse(savedMarkets);
      } catch {
        this.markets = getInitialMarkets();
      }
    } else {
      this.markets = getInitialMarkets();
      this.saveMarkets();
    }

    // Load logs
    const savedLogs = localStorage.getItem(LOCAL_STORAGE_KEYS.TX_LOGS);
    if (savedLogs) {
      try {
        this.txLogs = JSON.parse(savedLogs);
      } catch {
        this.txLogs = [];
      }
    }
  }

  private saveMarkets() {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MARKETS, JSON.stringify(this.markets));
  }

  private savePositions() {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_POSITIONS, JSON.stringify(this.positions));
  }

  private saveLogs() {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TX_LOGS, JSON.stringify(this.txLogs));
  }

  private saveWalletBalance() {
    if (this.wallet.publicKey) {
      localStorage.setItem(`solana_prediction_bal_${this.wallet.publicKey}`, this.wallet.balanceLamports.toString());
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.BALANCE, this.wallet.balanceLamports.toString());
  }

  private initWallet() {
    // Check if Phantom is connected or Ephemeral key exists
    const savedSecret = localStorage.getItem(LOCAL_STORAGE_KEYS.EPHEMERAL_KEY);
    if (savedSecret) {
      try {
        const secretKey = bs58.decode(savedSecret);
        const kp = Keypair.fromSecretKey(secretKey);
        const pubKey = kp.publicKey.toBase58();
        const savedBal = localStorage.getItem(`solana_prediction_bal_${pubKey}`) || localStorage.getItem(LOCAL_STORAGE_KEYS.BALANCE);
        const balance = savedBal ? parseInt(savedBal, 10) : 15 * LAMPORTS_PER_SOL;

        this.wallet = {
          connected: true,
          publicKey: pubKey,
          balanceLamports: balance,
          walletType: 'ephemeral',
          ephemeralSecretKey: savedSecret,
        };

        // Load positions for this wallet
        this.loadUserPositions(pubKey);
      } catch {
        this.generateEphemeralKeypair();
      }
    } else {
      this.generateEphemeralKeypair();
    }
  }

  public generateEphemeralKeypair(): WalletState {
    const kp = Keypair.generate();
    const secretStr = bs58.encode(kp.secretKey);
    localStorage.setItem(LOCAL_STORAGE_KEYS.EPHEMERAL_KEY, secretStr);

    const initialBalance = 15 * LAMPORTS_PER_SOL; // 15 SOL
    const pubKey = kp.publicKey.toBase58();

    this.wallet = {
      connected: true,
      publicKey: pubKey,
      balanceLamports: initialBalance,
      walletType: 'ephemeral',
      ephemeralSecretKey: secretStr,
    };

    this.saveWalletBalance();
    this.loadUserPositions(pubKey);
    this.notify();
    return this.wallet;
  }

  public async connectPhantomWallet(): Promise<boolean> {
    const solana = (window as any).solana;
    if (solana && solana.isPhantom) {
      try {
        const response = await solana.connect();
        const pkStr = response.publicKey.toString();
        const savedBal = localStorage.getItem(`solana_prediction_bal_${pkStr}`);
        const initialBal = savedBal ? parseInt(savedBal, 10) : 10 * LAMPORTS_PER_SOL;

        this.wallet = {
          connected: true,
          publicKey: pkStr,
          balanceLamports: initialBal,
          walletType: 'phantom',
        };
        this.loadUserPositions(pkStr);
        await this.refreshBalance();
        this.notify();
        return true;
      } catch (err) {
        console.error('Phantom connection failed:', err);
        return false;
      }
    } else {
      alert('Phantom wallet extension not detected in this browser window. You can use the Demo Keypair option to connect instantly without an extension!');
      return false;
    }
  }

  public disconnectWallet() {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EPHEMERAL_KEY);
    this.wallet = {
      connected: false,
      publicKey: null,
      balanceLamports: 0,
      walletType: 'disconnected',
    };
    this.notify();
  }

  private loadUserPositions(userPubKey: string) {
    const savedPos = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_POSITIONS);
    if (savedPos) {
      try {
        this.positions = JSON.parse(savedPos);
      } catch {
        this.positions = getInitialUserPositions(userPubKey, this.markets);
      }
    } else {
      this.positions = getInitialUserPositions(userPubKey, this.markets);
      this.savePositions();
    }
  }

  public async requestAirdrop(solAmount: number = 5): Promise<string> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const lamports = solAmount * LAMPORTS_PER_SOL;

    if (this.network === 'devnet') {
      try {
        const pubkey = new PublicKey(this.wallet.publicKey);
        const sig = await this.connection.requestAirdrop(pubkey, lamports);
        await this.connection.confirmTransaction(sig, 'confirmed');
        await this.refreshBalance();
        this.addLog('airdrop', 'success', `Airdropped ${solAmount} Devnet SOL to ${this.wallet.publicKey.slice(0, 8)}...`, sig);
        return sig;
      } catch (err: any) {
        console.warn('Devnet rate limit fallback to simulation faucet:', err);
      }
    }

    // Simulation / Fallback
    this.wallet.balanceLamports += lamports;
    this.saveWalletBalance();
    const mockSig = this.generateMockSignature();
    this.addLog('airdrop', 'success', `Airdropped ${solAmount} SOL to wallet`, mockSig);
    this.notify();
    return mockSig;
  }

  public async refreshBalance() {
    if (!this.wallet.publicKey) return;
    const pubKey = this.wallet.publicKey;
    try {
      const pk = new PublicKey(pubKey);
      if (this.network === 'devnet' || this.network === 'mainnet-beta') {
        try {
          const onChainBalance = await this.connection.getBalance(pk);
          // Only update if devnet returned balance
          this.wallet.balanceLamports = onChainBalance;
          this.saveWalletBalance();
        } catch (e) {
          console.warn('Could not fetch devnet balance:', e);
        }
      } else {
        // Simulation mode: Check per-wallet stored balance first so bet deductions persist!
        const savedBal = localStorage.getItem(`solana_prediction_bal_${pubKey}`) || localStorage.getItem(LOCAL_STORAGE_KEYS.BALANCE);
        if (savedBal !== null && !isNaN(Number(savedBal))) {
          this.wallet.balanceLamports = Number(savedBal);
        } else {
          try {
            const devnetConnection = new Connection(NETWORKS['devnet'].endpoint, 'confirmed');
            const realBalance = await devnetConnection.getBalance(pk);
            if (realBalance > 0) {
              this.wallet.balanceLamports = realBalance;
            } else {
              this.wallet.balanceLamports = 15 * LAMPORTS_PER_SOL;
            }
          } catch {
            this.wallet.balanceLamports = 15 * LAMPORTS_PER_SOL;
          }
          this.saveWalletBalance();
        }
      }
    } catch (e) {
      console.warn('Could not refresh balance:', e);
    }
    this.notify();
  }

  private addLog(
    type: TransactionLog['type'],
    status: TransactionLog['status'],
    details: string,
    signature: string,
    marketQuestion?: string
  ) {
    const log: TransactionLog = {
      signature,
      timestamp: Date.now(),
      type,
      status,
      details,
      marketQuestion,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${this.network}`,
    };
    this.txLogs.unshift(log);
    if (this.txLogs.length > 50) this.txLogs.pop();
    this.saveLogs();
  }

  /**
   * Create Market
   */
  public async createMarket(
    question: string,
    resolutionTimeUnix: number,
    customMarketId?: string
  ): Promise<{ signature: string; market: Market }> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const creatorPk = new PublicKey(this.wallet.publicKey);
    const marketId = customMarketId || Math.floor(Math.random() * 900000 + 100000).toString();

    // Build Instruction
    const { instruction, marketPDA, bump } = buildCreateMarketInstruction(
      creatorPk,
      marketId,
      question,
      resolutionTimeUnix
    );

    let signature = this.generateMockSignature();

    // If Devnet and Phantom wallet
    if (this.network === 'devnet' && this.wallet.walletType === 'phantom') {
      try {
        const solana = (window as any).solana;
        const tx = new Transaction().add(instruction);
        tx.feePayer = creatorPk;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
        const signedTx = await solana.signAndSendTransaction(tx);
        signature = signedTx.signature;
      } catch (e: any) {
        console.warn('On-chain creation fallback to simulation:', e.message);
      }
    }

    const newMarket: Market = {
      pubkey: marketPDA.toBase58(),
      creator: this.wallet.publicKey,
      market_id: marketId,
      question,
      resolution_time: resolutionTimeUnix,
      yes_pool: 0,
      no_pool: 0,
      resolved: false,
      outcome: null,
      bump,
      createdAt: Math.floor(Date.now() / 1000),
      category: 'Crypto',
    };

    this.markets.unshift(newMarket);
    this.saveMarkets();

    this.addLog(
      'create_market',
      'success',
      `Market created with ID ${marketId}. PDA: ${marketPDA.toBase58().slice(0, 8)}...`,
      signature,
      question
    );

    this.notify();
    return { signature, market: newMarket };
  }

  /**
   * Place Bet
   */
  public async placeBet(
    marketPubkey: string,
    amountSol: number,
    betYes: boolean
  ): Promise<{ signature: string; position: UserPosition }> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
    if (amountLamports <= 0) throw new Error('Invalid bet amount');
    if (this.wallet.balanceLamports < amountLamports) {
      throw new Error(`Insufficient SOL balance. Available: ${(this.wallet.balanceLamports / LAMPORTS_PER_SOL).toFixed(3)} SOL`);
    }

    const market = this.markets.find((m) => m.pubkey === marketPubkey);
    if (!market) throw new Error('Market not found');

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= market.resolution_time) {
      throw new Error('Betting is closed for this market');
    }

    const userPk = new PublicKey(this.wallet.publicKey);
    const marketPk = new PublicKey(marketPubkey);

    const { instruction, positionPDA, bump } = buildPlaceBetInstruction(
      userPk,
      marketPk,
      amountLamports,
      betYes
    );

    let signature = this.generateMockSignature();

    // If Devnet and Phantom wallet connected, attempt on-chain transaction
    if (this.network === 'devnet' && this.wallet.walletType === 'phantom') {
      try {
        const solana = (window as any).solana;
        if (solana && solana.isPhantom) {
          const tx = new Transaction().add(instruction);
          tx.feePayer = userPk;
          tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          const signedTx = await solana.signAndSendTransaction(tx);
          signature = signedTx.signature;
        }
      } catch (e: any) {
        console.warn('On-chain place bet fallback to local simulation:', e.message);
      }
    }

    // Deduct SOL from wallet balance
    this.wallet.balanceLamports = Math.max(0, this.wallet.balanceLamports - amountLamports);
    this.saveWalletBalance();

    // Update Market Pool
    if (betYes) {
      market.yes_pool += amountLamports;
    } else {
      market.no_pool += amountLamports;
    }
    this.saveMarkets();

    // Update or Create User Position
    let position = this.positions.find(
      (p) => p.market === marketPubkey && p.user === this.wallet.publicKey
    );

    if (position) {
      if (betYes) {
        position.yes_amount += amountLamports;
      } else {
        position.no_amount += amountLamports;
      }
    } else {
      position = {
        pubkey: positionPDA.toBase58(),
        market: marketPubkey,
        user: this.wallet.publicKey,
        yes_amount: betYes ? amountLamports : 0,
        no_amount: betYes ? 0 : amountLamports,
        claimed: false,
        bump,
      };
      this.positions.push(position);
    }
    this.savePositions();

    this.addLog(
      'place_bet',
      'success',
      `Placed ${amountSol} SOL bet on ${betYes ? 'YES' : 'NO'}. Position PDA: ${positionPDA.toBase58().slice(0, 8)}...`,
      signature,
      market.question
    );

    this.notify();
    return { signature, position };
  }

  /**
   * Resolve Market
   */
  public async resolveMarket(
    marketPubkey: string,
    outcome: boolean
  ): Promise<{ signature: string }> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const market = this.markets.find((m) => m.pubkey === marketPubkey);
    if (!market) throw new Error('Market not found');

    if (market.creator !== this.wallet.publicKey && market.creator !== MOCK_CREATOR_KEY) {
      throw new Error('Only market creator can resolve market');
    }

    if (market.resolved) throw new Error('Market already resolved');

    const creatorPk = new PublicKey(this.wallet.publicKey);
    const marketPk = new PublicKey(marketPubkey);

    const instruction = buildResolveMarketInstruction(creatorPk, marketPk, outcome);
    const signature = this.generateMockSignature();

    market.resolved = true;
    market.outcome = outcome;
    this.saveMarkets();

    this.addLog(
      'resolve_market',
      'success',
      `Market resolved as ${outcome ? 'YES' : 'NO'}. Creator signed: ${this.wallet.publicKey.slice(0, 8)}...`,
      signature,
      market.question
    );

    this.notify();
    return { signature };
  }

  /**
   * Claim Winnings
   */
  public async claimWinnings(marketPubkey: string): Promise<{ signature: string; payoutSol: number }> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    const market = this.markets.find((m) => m.pubkey === marketPubkey);
    if (!market) throw new Error('Market not found');
    if (!market.resolved || market.outcome === null) throw new Error('Market not resolved yet');

    const position = this.positions.find(
      (p) => p.market === marketPubkey && p.user === this.wallet.publicKey
    );

    if (!position) throw new Error('No user position found for this market');
    if (position.claimed) throw new Error('Winnings already claimed');

    const outcome = market.outcome;
    const userWinningBet = outcome ? position.yes_amount : position.no_amount;
    const totalWinningPool = outcome ? market.yes_pool : market.no_pool;
    const totalLosingPool = outcome ? market.no_pool : market.yes_pool;

    if (userWinningBet <= 0) throw new Error('No winning bet on the resolved outcome');

    // Formula from Anchor program:
    // winnings = (user_winning_bet * total_losing_pool) / total_winning_pool
    // total_payout = user_winning_bet + winnings
    const winnings = totalWinningPool > 0 ? Math.floor((userWinningBet * totalLosingPool) / totalWinningPool) : 0;
    const totalPayoutLamports = userWinningBet + winnings;

    const userPk = new PublicKey(this.wallet.publicKey);
    const marketPk = new PublicKey(marketPubkey);
    const creatorPk = new PublicKey(market.creator);

    const { instruction, positionPDA } = buildClaimWinningInstruction(
      userPk,
      marketPk,
      creatorPk,
      market.market_id
    );

    const signature = this.generateMockSignature();

    // Mark claimed & transfer lamports
    position.claimed = true;
    this.savePositions();

    this.wallet.balanceLamports += totalPayoutLamports;
    this.saveWalletBalance();

    const payoutSol = totalPayoutLamports / LAMPORTS_PER_SOL;

    this.addLog(
      'claim_winning',
      'success',
      `Claimed ${payoutSol.toFixed(4)} SOL winnings! Position PDA: ${positionPDA.toBase58().slice(0, 8)}...`,
      signature,
      market.question
    );

    this.notify();
    return { signature, payoutSol };
  }

  private generateMockSignature(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let sig = '';
    for (let i = 0; i < 88; i++) {
      sig += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sig;
  }
}

export const solanaEngine = new SolanaEngine();
