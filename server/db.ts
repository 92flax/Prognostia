import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { 
  InsertUser, 
  users, 
  userSettings,
  signals, 
  trades,
  paperWallet,
  signalInteractions,
  InsertUserSettings,
  InsertSignal,
  InsertTrade,
  InsertPaperWallet,
  InsertSignalInteraction,
  Signal,
  Trade,
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
    isConnected: false, // Reset connection status when credentials change
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

  let query = db.select().from(trades).where(eq(trades.status, "OPEN"));
  
  if (userId !== undefined && mode !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.status, "OPEN"),
        eq(trades.userId, userId),
        eq(trades.mode, mode)
      ))
      .orderBy(desc(trades.openedAt));
  } else if (userId !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.status, "OPEN"),
        eq(trades.userId, userId)
      ))
      .orderBy(desc(trades.openedAt));
  } else if (mode !== undefined) {
    return db.select().from(trades)
      .where(and(
        eq(trades.status, "OPEN"),
        eq(trades.mode, mode)
      ))
      .orderBy(desc(trades.openedAt));
  }

  return db.select().from(trades)
    .where(eq(trades.status, "OPEN"))
    .orderBy(desc(trades.openedAt));
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
      .orderBy(desc(trades.openedAt))
      .limit(limit);
  } else if (userId !== undefined) {
    return db.select().from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.openedAt))
      .limit(limit);
  }

  return db.select().from(trades)
    .orderBy(desc(trades.openedAt))
    .limit(limit);
}

export async function closeTrade(
  tradeId: number,
  data: {
    exitPrice: string;
    realizedPnl: string;
    pnlPercent: string;
    closeReason: string;
  }
): Promise<Trade | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(trades).set({
    ...data,
    status: "CLOSED",
    closedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(trades.id, tradeId));

  const result = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  return result[0];
}

export async function updateTradeUnrealizedPnl(
  tradeId: number,
  unrealizedPnl: string,
  pnlPercent: string
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

  await db.update(paperWallet).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(paperWallet.userId, userId));
}

export async function resetPaperWallet(userId: number, initialBalance = "10000.0"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(paperWallet).set({
    usdtBalance: initialBalance,
    initialBalance,
    totalPnl: "0.0",
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    usedMargin: "0.0",
    availableBalance: initialBalance,
    lastResetAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(paperWallet.userId, userId));
}

// ============================================
// SIGNAL INTERACTION OPERATIONS
// ============================================

export async function recordSignalInteraction(
  interaction: InsertSignalInteraction
): Promise<SignalInteraction | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record interaction: database not available");
    return undefined;
  }

  const result = await db.insert(signalInteractions).values(interaction).returning();
  return result[0];
}

export async function markSignalCopied(signalId: number, userId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(signalInteractions).values({
    signalId,
    userId: userId ?? null,
    wasCopied: true,
  });
}

export async function getSignalStats(signalId: number): Promise<{
  copyCount: number;
  executeCount: number;
}> {
  const db = await getDb();
  if (!db) return { copyCount: 0, executeCount: 0 };

  const interactions = await db.select().from(signalInteractions)
    .where(eq(signalInteractions.signalId, signalId));

  return {
    copyCount: interactions.filter(i => i.wasCopied).length,
    executeCount: interactions.filter(i => i.wasExecuted).length,
  };
}
