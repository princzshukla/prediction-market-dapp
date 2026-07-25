import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { PREDICTION_MARKET_IDL } from './idl';

export { PREDICTION_MARKET_IDL };
export const PROGRAM_ID_STR = 'PjG6i92qPk5hpFhmNBd1RWuPt3keH9xBSqn46dc4b5w';
export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// Anchor Instruction Discriminators from IDL
export const DISCRIMINATORS = {
  create_market: Buffer.from([103, 226, 97, 235, 200, 188, 251, 254]),
  place_bet: Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]),
  resolve_market: Buffer.from([155, 23, 80, 173, 46, 74, 23, 239]),
  claim_winning: Buffer.from([72, 152, 171, 92, 123, 244, 179, 127]),
};

// Account Discriminators
export const ACCOUNT_DISCRIMINATORS = {
  Market: Buffer.from([219, 190, 213, 55, 0, 227, 198, 154]),
  UserPosition: Buffer.from([251, 248, 209, 245, 83, 234, 17, 27]),
};

/**
 * Convert a u64 number or string to 8-byte Little-Endian Uint8Array/Buffer
 */
export function u64ToLeBytes(value: number | bigint | string): Buffer {
  const buf = Buffer.alloc(8);
  const bigVal = BigInt(value);
  buf.writeBigUInt64LE(bigVal, 0);
  return buf;
}

/**
 * Convert an i64 unix timestamp to 8-byte Little-Endian Uint8Array/Buffer
 */
export function i64ToLeBytes(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  const bigVal = BigInt(value);
  buf.writeBigInt64LE(bigVal, 0);
  return buf;
}

/**
 * Encode String for Borsh (4-byte length prefix LE + utf8 bytes)
 */
export function encodeBorshString(str: string): Buffer {
  const strBuf = Buffer.from(str, 'utf-8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBuf.length, 0);
  return Buffer.concat([lenBuf, strBuf]);
}

/**
 * Derive Market PDA
 * seeds = [b"market", creator.key().as_ref(), &market_id.to_le_bytes()]
 */
export function deriveMarketPDA(creator: PublicKey, marketId: number | bigint | string): [PublicKey, number] {
  const marketIdLe = u64ToLeBytes(marketId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), creator.toBuffer(), marketIdLe],
    PROGRAM_ID
  );
}

/**
 * Derive User Position PDA
 * seeds = [b"position", market.key().as_ref(), user.key().as_ref()]
 */
export function deriveUserPositionPDA(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('position'), market.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Build create_market instruction
 */
export function buildCreateMarketInstruction(
  creator: PublicKey,
  marketId: number | bigint | string,
  question: string,
  resolutionTimeUnix: number
): { instruction: TransactionInstruction; marketPDA: PublicKey; bump: number } {
  const [marketPDA, bump] = deriveMarketPDA(creator, marketId);

  const data = Buffer.concat([
    DISCRIMINATORS.create_market,
    u64ToLeBytes(marketId),
    encodeBorshString(question),
    i64ToLeBytes(resolutionTimeUnix),
  ]);

  const keys = [
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: marketPDA, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return {
    instruction: new TransactionInstruction({
      programId: PROGRAM_ID,
      keys,
      data,
    }),
    marketPDA,
    bump,
  };
}

/**
 * Build place_bet instruction
 */
export function buildPlaceBetInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  amountLamports: number | bigint,
  betYes: boolean
): { instruction: TransactionInstruction; positionPDA: PublicKey; bump: number } {
  const [positionPDA, bump] = deriveUserPositionPDA(marketPDA, user);

  const boolBuf = Buffer.from([betYes ? 1 : 0]);
  const data = Buffer.concat([
    DISCRIMINATORS.place_bet,
    u64ToLeBytes(amountLamports),
    boolBuf,
  ]);

  const keys = [
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: marketPDA, isSigner: false, isWritable: true },
    { pubkey: positionPDA, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return {
    instruction: new TransactionInstruction({
      programId: PROGRAM_ID,
      keys,
      data,
    }),
    positionPDA,
    bump,
  };
}

/**
 * Build resolve_market instruction
 */
export function buildResolveMarketInstruction(
  creator: PublicKey,
  marketPDA: PublicKey,
  outcome: boolean
): TransactionInstruction {
  const boolBuf = Buffer.from([outcome ? 1 : 0]);
  const data = Buffer.concat([
    DISCRIMINATORS.resolve_market,
    boolBuf,
  ]);

  const keys = [
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: marketPDA, isSigner: false, isWritable: true },
  ];

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Build claim_winning instruction
 */
export function buildClaimWinningInstruction(
  user: PublicKey,
  marketPDA: PublicKey,
  marketCreator: PublicKey,
  marketId: number | bigint | string
): { instruction: TransactionInstruction; positionPDA: PublicKey } {
  const [positionPDA] = deriveUserPositionPDA(marketPDA, user);

  const data = DISCRIMINATORS.claim_winning;

  const keys = [
    { pubkey: user, isSigner: true, isWritable: true },
    { pubkey: marketPDA, isSigner: false, isWritable: true },
    { pubkey: positionPDA, isSigner: false, isWritable: true },
  ];

  return {
    instruction: new TransactionInstruction({
      programId: PROGRAM_ID,
      keys,
      data,
    }),
    positionPDA,
  };
}

/**
 * Calculate potential winnings based on on-chain math:
 * user_winning_bet = bet_amount
 * total_winning_pool = current_winning_pool + user_winning_bet
 * total_losing_pool = current_losing_pool
 * winnings = (user_winning_bet * total_losing_pool) / total_winning_pool
 * total_payout = user_winning_bet + winnings
 */
export function calculatePayout(
  userBetLamports: number,
  betYes: boolean,
  yesPoolLamports: number,
  noPoolLamports: number
) {
  if (userBetLamports <= 0) return { winningsLamports: 0, totalPayoutLamports: 0, multiplier: 1, roi: 0 };

  const currentWinningPool = betYes ? yesPoolLamports : noPoolLamports;
  const totalLosingPool = betYes ? noPoolLamports : yesPoolLamports;

  const newWinningPool = currentWinningPool + userBetLamports;

  if (newWinningPool === 0) return { winningsLamports: 0, totalPayoutLamports: userBetLamports, multiplier: 1, roi: 0 };

  const winningsLamports = Math.floor((userBetLamports * totalLosingPool) / newWinningPool);
  const totalPayoutLamports = userBetLamports + winningsLamports;
  const multiplier = totalPayoutLamports / userBetLamports;
  const roi = ((multiplier - 1) * 100);

  return {
    winningsLamports,
    totalPayoutLamports,
    multiplier,
    roi,
  };
}
