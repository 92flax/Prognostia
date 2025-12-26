import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { 
  InsertUser, 
  users, 
  signals, 
  signalInteractions,
  InsertSignal,
  InsertSignalInteraction,
  Signal,
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

export async function updateUserPreferences(
  userId: number,
  prefs: {
    preferredSafetyFactor?: string;
    preferredRiskReward?: string;
    maxLeverageLimit?: number;
  }
) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(prefs).where(eq(users.id, userId));
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
