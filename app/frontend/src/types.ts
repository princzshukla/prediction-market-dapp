export interface Market {
  pubkey: string;
  creator: string;
  market_id: string; // u64 stored as string to handle 64-bit precision
  question: string;
  resolution_time: number; // Unix timestamp in seconds
  yes_pool: number; // Lamports
  no_pool: number; // Lamports
  resolved: boolean;
  outcome: boolean | null; // null = not resolved, true = YES won, false = NO won
  bump: number;
  createdAt?: number;
  category?: 'Crypto' | 'AI & Tech' | 'Space' | 'Governance' | 'Economics'| 'Sports' | 'Entertainment' | 'Other';
}

export interface UserPosition {
  pubkey: string;
  market: string; // Market Pubkey
  user: string; // User Pubkey
  yes_amount: number; // Lamports
  no_amount: number; // Lamports
  claimed: boolean;
  bump: number;
}

export type NetworkType = 'devnet' | 'mainnet-beta' | 'localnet' | 'simulation';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balanceLamports: number;
  walletType: 'phantom' | 'ephemeral' | 'disconnected';
  ephemeralSecretKey?: string; // Hex or Uint8Array string for local ephemeral keypair
}

export interface TransactionLog {
  signature: string;
  timestamp: number;
  type: 'create_market' | 'place_bet' | 'resolve_market' | 'claim_winning' | 'airdrop';
  status: 'success' | 'failed';
  marketQuestion?: string;
  details: string;
  explorerUrl?: string;
}

export interface AnchorIDL {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: any[];
  accounts: any[];
  errors: any[];
  types: any[];
}
