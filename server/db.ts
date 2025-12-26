import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { 
  InsertUser, 
  users, 
  trades, 
  signals, 
  paperWallets,
  InsertTrade,
  InsertSignal,
  InsertPaperWallet,
  Trade,
  Signal,
  PaperWallet,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER OPERATIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using ON CONFLICT
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserTradingPrefs(
  userId: number,
  prefs: {
    preferredLeverage?: string;
    riskTolerance?: string;
    useSimulationMode?: boolean;
    kellyFraction?: string;
  }
) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(prefs).where(eq(users.id, userId));
}

export async function updateUserBitgetCredentials(
  userId: number,
  credentials: {
    bitgetApiKey?: string;
    bitgetSecret?: string;
    bitgetPassphrase?: string;
  }
) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(credentials).where(eq(users.id, userId));
}

// ============================================
// TRADE OPERATIONS
// ============================================

export async function createTrade(trade: InsertTrade): Promise<Trade | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create trade: database not available");
    return undefined;
  }

  const result = await db.insert(trades).values(trade).returning();
  return result[0];
}

export async function closeTrade(
  tradeId: number,
  exitData: {
    exitPrice: string;
    realizedPnl: string;
    realizedPnlPercent: string;
    fees?: string;
    status: "closed" | "liquidated";
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(trades).set({
    ...exitData,
    closedAt: new Date(),
  }).where(eq(trades.id, tradeId));
}

export async function getOpenTrades(userId: number): Promise<Trade[]> {
  const db = await getDb();
  if (!db) return [];

  const { and } = await import("drizzle-orm");
  return db.select().from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.status, "open")));
}

export async function getTradeHistory(userId: number, limit = 50): Promise<Trade[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(trades.createdAt)
    .limit(limit);
}

// ============================================
// SIGNAL OPERATIONS
// ============================================

export async function createSignal(signal: InsertSignal): Promise<Signal | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create signal: database not available");
    return undefined;
  }

  const result = await db.insert(signals).values(signal).returning();
  return result[0];
}

export async function getRecentSignals(pair: string, limit = 10): Promise<Signal[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(signals)
    .where(eq(signals.pair, pair))
    .orderBy(signals.createdAt)
    .limit(limit);
}

export async function updateSignalBacktest(
  signalId: number,
  data: {
    actualPrice24h?: string;
    actualPrice7d?: string;
    wasCorrect?: boolean;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(signals).set(data).where(eq(signals.id, signalId));
}

// ============================================
// PAPER WALLET OPERATIONS
// ============================================

export async function getOrCreatePaperWallet(userId: number): Promise<PaperWallet | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get paper wallet: database not available");
    return undefined;
  }

  // Try to get existing wallet
  const existing = await db.select().from(paperWallets)
    .where(eq(paperWallets.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new wallet with default balance
  const result = await db.insert(paperWallets).values({
    userId,
    usdtBalance: "10000",
    initialBalance: "10000",
    peakBalance: "10000",
  }).returning();

  return result[0];
}

export async function updatePaperWalletBalance(
  userId: number,
  balances: {
    usdtBalance?: string;
    btcBalance?: string;
    ethBalance?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(paperWallets).set({
    ...balances,
    updatedAt: new Date(),
  }).where(eq(paperWallets.userId, userId));
}

export async function updatePaperWalletStats(
  userId: number,
  stats: {
    totalTrades?: number;
    winningTrades?: number;
    totalPnl?: string;
    maxDrawdown?: string;
    peakBalance?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(paperWallets).set({
    ...stats,
    updatedAt: new Date(),
    lastTradeAt: new Date(),
  }).where(eq(paperWallets.userId, userId));
}

export async function resetPaperWallet(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(paperWallets).set({
    usdtBalance: "10000",
    btcBalance: "0",
    ethBalance: "0",
    initialBalance: "10000",
    peakBalance: "10000",
    totalTrades: 0,
    winningTrades: 0,
    totalPnl: "0",
    maxDrawdown: "0",
    updatedAt: new Date(),
    lastTradeAt: null,
  }).where(eq(paperWallets.userId, userId));
}
