import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { 
  InsertUser, 
  users, 
  userSettings,
  userStats,
  signals, 
  trades,
  balanceHistory,
  paperWallet,
  signalInteractions,
  InsertUserSettings,
  InsertUserStats,
  InsertSignal,
  InsertTrade,
  InsertBalanceHistory,
  InsertPaperWallet,
  InsertSignalInteraction,
  Signal,
  Trade,
  UserStats,
  BalanceHistory,
  PaperWallet,
  UserSettings,
  SignalInteraction,
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

// ============================================
// USER SETTINGS OPERATIONS
// ============================================

export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return result[0];
}

export async function upsertUserSettings(
  userId: number,
  settings: Partial<InsertUserSettings>
): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getUserSettings(userId);
  
  if (existing) {
    await db.update(userSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
    return getUserSettings(userId);
  } else {
    const result = await db.insert(userSettings)
      .values({ ...settings, userId })
      .returning();
    return result[0];
  }
}

export async function updateBitgetCredentials(
  userId: number,
  credentials: {
    bitgetApiKey?: string;
    bitgetSecret?: string;
    bitgetPassphrase?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await upsertUserSettings(userId, {
    ...credentials,
    isConnected: false,
    connectionError: null,
  });
}

export async function updateConnectionStatus(
  userId: number,
  isConnected: boolean,
  error?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await upsertUserSettings(userId, {
    isConnected,
    lastConnectionTest: new Date(),
    connectionError: error ?? null,
  });
}

export async function setAutoTradeEnabled(userId: number, enabled: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await upsertUserSettings(userId, { autoTradeEnabled: enabled });
}

// ============================================
// USER STATS OPERATIONS
// ============================================

export async function getUserStats(userId: number): Promise<UserStats | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  return result[0];
}

export async function getOrCreateUserStats(userId: number): Promise<UserStats | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getUserStats(userId);
  if (existing) return existing;

  const result = await db.insert(userStats)
    .values({ userId })
    .returning();

  return result[0];
}

export async function updateUserStats(
  userId: number,
  data: Partial<InsertUserStats>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(userStats)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userStats.userId, userId));
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

export async function getRecentSignals(asset: string, limit = 10): Promise<Signal[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(signals)
    .where(eq(signals.asset, asset))
    .orderBy(desc(signals.createdAt))
    .limit(limit);
}

export async function getAllRecentSignals(limit = 20): Promise<Signal[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(signals)
    .orderBy(desc(signals.createdAt))
    .limit(limit);
}

export async function getSignalById(signalId: number): Promise<Signal | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(signals)
    .where(eq(signals.id, signalId))
    .limit(1);

  return result[0];
}

export async function markSignalExecuted(
  signalId: number,
  mode: "PAPER" | "LIVE"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(signals).set({
    executed: true,
    executedAt: new Date(),
    executionMode: mode,
  }).where(eq(signals.id, signalId));
}

export async function updateSignalOutcome(
  signalId: number,
  data: {
    actualOutcome?: string;
    actualPnlPercent?: string;
    wasSuccessful?: boolean;
    resolvedAt?: Date;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(signals).set(data).where(eq(signals.id, signalId));
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

export async function getOpenTrades(userId?: number, mode?: "PAPER" | "LIVE"): Promise<Trade[]> {
  const db = await getDb();
  if (!db) return [];

  if (userId !== undefined && mode !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.status, "OPEN"),
        eq(trades.userId, userId),
        eq(trades.mode, mode)
      ))
      .orderBy(desc(trades.timestampOpen));
  } else if (userId !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.status, "OPEN"),
        eq(trades.userId, userId)
      ))
      .orderBy(desc(trades.timestampOpen));
  } else if (mode !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.status, "OPEN"),
        eq(trades.mode, mode)
      ))
      .orderBy(desc(trades.timestampOpen));
  }

  return db.select().from(trades)
    .where(eq(trades.status, "OPEN"))
    .orderBy(desc(trades.timestampOpen));
}

export async function getTradeHistory(
  userId?: number,
  mode?: "PAPER" | "LIVE",
  limit = 50
): Promise<Trade[]> {
  const db = await getDb();
  if (!db) return [];

  if (userId !== undefined && mode !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.userId, userId),
        eq(trades.mode, mode)
      ))
      .orderBy(desc(trades.timestampOpen))
      .limit(limit);
  } else if (userId !== undefined) {
    return db.select().from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.timestampOpen))
      .limit(limit);
  }

  return db.select().from(trades)
    .orderBy(desc(trades.timestampOpen))
    .limit(limit);
}

export async function closeTrade(
  tradeId: number,
  data: {
    exitPrice: string;
    pnlAbsolute: string;
    pnlPercent: number;
    closeReason: string;
    durationSeconds?: number;
    fees?: string;
  }
): Promise<Trade | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(trades).set({
    exitPrice: data.exitPrice,
    pnlAbsolute: data.pnlAbsolute,
    pnlPercent: data.pnlPercent,
    closeReason: data.closeReason,
    durationSeconds: data.durationSeconds,
    fees: data.fees,
    status: "CLOSED",
    timestampClose: new Date(),
    updatedAt: new Date(),
  }).where(eq(trades.id, tradeId));

  const result = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  return result[0];
}

export async function updateTradeUnrealizedPnl(
  tradeId: number,
  unrealizedPnl: string,
  pnlPercent: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(trades).set({
    unrealizedPnl,
    pnlPercent,
    updatedAt: new Date(),
  }).where(eq(trades.id, tradeId));
}

// ============================================
// BALANCE HISTORY OPERATIONS
// ============================================

export async function addBalanceHistoryEntry(entry: InsertBalanceHistory): Promise<BalanceHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(balanceHistory).values(entry).returning();
  return result[0];
}

export async function getBalanceHistory(
  userId: number,
  mode: "PAPER" | "LIVE",
  limit = 100
): Promise<BalanceHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(balanceHistory)
    .where(and(
      eq(balanceHistory.userId, userId),
      eq(balanceHistory.mode, mode)
    ))
    .orderBy(desc(balanceHistory.timestamp))
    .limit(limit);
}

// ============================================
// PAPER WALLET OPERATIONS
// ============================================

export async function getPaperWallet(userId: number): Promise<PaperWallet | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(paperWallet)
    .where(eq(paperWallet.userId, userId))
    .limit(1);

  return result[0];
}

export async function getOrCreatePaperWallet(userId: number): Promise<PaperWallet | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getPaperWallet(userId);
  if (existing) return existing;

  const result = await db.insert(paperWallet)
    .values({ userId })
    .returning();

  return result[0];
}

export async function updatePaperWalletBalance(
  userId: number,
  data: {
    usdtBalance?: string;
    usedMargin?: string;
    availableBalance?: string;
    totalPnl?: string;
    totalTrades?: number;
    winningTrades?: number;
    losingTrades?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(paperWallet)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(paperWallet.userId, userId));
}

export async function resetPaperWallet(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(paperWallet).set({
    usdtBalance: "10000.0",
    availableBalance: "10000.0",
    usedMargin: "0.0",
    totalPnl: "0.0",
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    lastResetAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(paperWallet.userId, userId));
}

// ============================================
// SIGNAL INTERACTION OPERATIONS
// ============================================

export async function createSignalInteraction(
  interaction: InsertSignalInteraction
): Promise<SignalInteraction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(signalInteractions).values(interaction).returning();
  return result[0];
}

export async function getUserSignalInteractions(
  userId: number,
  limit = 20
): Promise<SignalInteraction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(signalInteractions)
    .where(eq(signalInteractions.userId, userId))
    .orderBy(desc(signalInteractions.createdAt))
    .limit(limit);
}
