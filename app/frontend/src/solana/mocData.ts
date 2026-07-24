import type { Market, UserPosition } from '../types.ts';
import { deriveMarketPDA, deriveUserPositionPDA } from './anchorClient.ts';
import { PublicKey } from '@solana/web3.js';

// Sample Creator Address
export const MOCK_CREATOR_KEY = '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s';
export const MOCK_USER_KEY = '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q544fKrF';

const NOW_SEC = Math.floor(Date.now() / 1000);
const ONE_HOUR = 3600;
const ONE_DAY = 86400;

export const INITIAL_MARKETS_RAW = [
  {
    market_id: '101',
    creator: '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s',
    question: 'Will Solana TVL cross $15 Billion before Q4 2026?',
    resolution_time: NOW_SEC + ONE_DAY * 14,
    yes_pool: 28_500_000_000, // 28.5 SOL
    no_pool: 12_200_000_000, // 12.2 SOL
    resolved: false,
    outcome: null,
    category: 'Crypto' as const,
  },
  {
    market_id: '102',
    creator: '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s',
    question: 'Will Anchor 0.32 release native stateless zero-knowledge proof support in 2026?',
    resolution_time: NOW_SEC + ONE_DAY * 30,
    yes_pool: 15_000_000_000, // 15.0 SOL
    no_pool: 18_500_000_000, // 18.5 SOL
    resolved: false,
    outcome: null,
    category: 'AI & Tech' as const,
  },
  {
    market_id: '103',
    creator: '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s',
    question: 'Will SpaceX Starship complete a full orbital refueling test before December 2026?',
    resolution_time: NOW_SEC + ONE_DAY * 45,
    yes_pool: 42_000_000_000, // 42.0 SOL
    no_pool: 9_000_000_000,  // 9.0 SOL
    resolved: false,
    outcome: null,
    category: 'Space' as const,
  },
  {
    market_id: '104',
    creator: '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s',
    question: 'Will Solana Firedancer client reach 1,000 live validators on Mainnet-Beta by end of month?',
    resolution_time: NOW_SEC + ONE_HOUR * 3, // Closing soon!
    yes_pool: 35_000_000_000, // 35 SOL
    no_pool: 32_000_000_000, // 32 SOL
    resolved: false,
    outcome: null,
    category: 'Crypto' as const,
  },
  {
    market_id: '105',
    creator: '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s',
    question: 'Will Solana Breakpoint 2026 host over 10,000 registered attendees?',
    resolution_time: NOW_SEC - ONE_HOUR * 2, // Past resolution time, ready to resolve!
    yes_pool: 22_000_000_000, // 22 SOL
    no_pool: 5_000_000_000,  // 5 SOL
    resolved: false,
    outcome: null,
    category: 'Governance' as const,
  },
  {
    market_id: '106',
    creator: '7XwK1q7S5zY9P8m4V3n2L1k0J9h8G7f6E5d4C3b2A1s',
    question: 'Did Solana processed transaction TPS exceed 5,000 during recent network benchmark test?',
    resolution_time: NOW_SEC - ONE_DAY * 2, // Resolved market
    yes_pool: 50_000_000_000, // 50 SOL
    no_pool: 10_000_000_000, // 10 SOL
    resolved: true,
    outcome: true, // YES won
    category: 'Crypto' as const,
  },
];

// Helper to compute PDAs for initial markets
export function getInitialMarkets(): Market[] {
  let creatorPk: PublicKey;
  try {
    creatorPk = new PublicKey(MOCK_CREATOR_KEY);
  } catch {
    // Fallback valid pubkey
    creatorPk = new PublicKey('11111111111111111111111111111111');
  }

  return INITIAL_MARKETS_RAW.map((m) => {
    let pdaStr = '';
    let bump = 255;
    try {
      const [pda, b] = deriveMarketPDA(creatorPk, m.market_id);
      pdaStr = pda.toBase58();
      bump = b;
    } catch {
      pdaStr = `MarketPDA_${m.market_id}`;
    }

    return {
      pubkey: pdaStr,
      creator: m.creator,
      market_id: m.market_id,
      question: m.question,
      resolution_time: m.resolution_time,
      yes_pool: m.yes_pool,
      no_pool: m.no_pool,
      resolved: m.resolved,
      outcome: m.outcome,
      bump: bump,
      createdAt: NOW_SEC - ONE_DAY * 3,
      category: m.category,
    };
  });
}

// Initial demo positions for connected user
export function getInitialUserPositions(userPubKey: string, markets: Market[]): UserPosition[] {
  if (markets.length === 0) return [];

  const market0 = markets[0]; // TVL market
  const market3 = markets[3]; // Firedancer
  const market5 = markets[5]; // Resolved market

  let uPk: PublicKey;
  try {
    uPk = new PublicKey(userPubKey);
  } catch {
    uPk = PublicKey.default;
  }

  const positions: UserPosition[] = [];

  if (market0) {
    try {
      const [mPk] = [new PublicKey(market0.pubkey)];
      const [posPda, bump] = deriveUserPositionPDA(mPk, uPk);
      positions.push({
        pubkey: posPda.toBase58(),
        market: market0.pubkey,
        user: userPubKey,
        yes_amount: 2_500_000_000, // 2.5 SOL
        no_amount: 0,
        claimed: false,
        bump,
      });
    } catch (e) {
      // ignore
    }
  }

  if (market3) {
    try {
      const mPk = new PublicKey(market3.pubkey);
      const [posPda, bump] = deriveUserPositionPDA(mPk, uPk);
      positions.push({
        pubkey: posPda.toBase58(),
        market: market3.pubkey,
        user: userPubKey,
        yes_amount: 0,
        no_amount: 1_800_000_000, // 1.8 SOL on NO
        claimed: false,
        bump,
      });
    } catch (e) {
      // ignore
    }
  }

  if (market5) {
    try {
      const mPk = new PublicKey(market5.pubkey);
      const [posPda, bump] = deriveUserPositionPDA(mPk, uPk);
      positions.push({
        pubkey: posPda.toBase58(),
        market: market5.pubkey,
        user: userPubKey,
        yes_amount: 3_000_000_000, // 3 SOL on YES (Won!)
        no_amount: 0,
        claimed: false,
        bump,
      });
    } catch (e) {
      // ignore
    }
  }

  return positions;
}
