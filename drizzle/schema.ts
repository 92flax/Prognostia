import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const signalDirectionEnum = pgEnum("signal_direction", ["LONG", "SHORT"]);
export const riskLevelEnum = pgEnum("risk_level", ["LOW", "MEDIUM", "HIGH", "EXTREME"]);

/**
 * Core user table backing auth flow.
 * Simplified for Signal Intelligence Dashboard.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  
  // User preferences for signal generation
  preferredSafetyFactor: decimal("preferred_safety_factor", { precision: 5, scale: 2 }).default("2.0"),
  preferredRiskReward: decimal("preferred_risk_reward", { precision: 5, scale: 2 }).default("2.0"),
  maxLeverageLimit: integer("max_leverage_limit").default(20),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

/**
 * Signals table - stores complete trading signal setups
 * This is the core table for the Signal Intelligence Dashboard
 */
export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  
  // Asset identification
  asset: varchar("asset", { length: 32 }).notNull(), // e.g., "BTCUSDT"
  
  // Signal direction
  direction: signalDirectionEnum("direction").notNull(), // LONG or SHORT
  
  // Trade setup values (the critical numbers)
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  takeProfitPrice: decimal("tp_price", { precision: 20, scale: 8 }).notNull(),
  stopLossPrice: decimal("sl_price", { precision: 20, scale: 8 }).notNull(),
  leverageRecommendation: decimal("leverage_recommendation", { precision: 5, scale: 1 }).notNull(),
  
  // Risk metrics
  riskRewardRatio: decimal("risk_reward_ratio", { precision: 5, scale: 2 }).default("2.0").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  
  // Confidence and reasoning
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  rationale: text("rationale").notNull(), // Human-readable explanation
  
  // Market conditions at signal generation
  dailyVolatility: decimal("daily_volatility", { precision: 10, scale: 6 }),
  atr: decimal("atr", { precision: 20, scale: 8 }),
  ema200: decimal("ema_200", { precision: 20, scale: 8 }),
  rsi14: decimal("rsi_14", { precision: 5, scale: 2 }),
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 4 }), // -1.0 to 1.0
  
  // Backtesting fields (filled later)
  actualOutcome: varchar("actual_outcome", { length: 16 }), // "TP_HIT", "SL_HIT", "EXPIRED"
  actualPnlPercent: decimal("actual_pnl_percent", { precision: 10, scale: 4 }),
  wasSuccessful: boolean("was_successful"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Signal validity window
  resolvedAt: timestamp("resolved_at"), // When TP or SL was hit
});

/**
 * Signal history for tracking user interactions
 */
export const signalInteractions = pgTable("signal_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  signalId: integer("signal_id").references(() => signals.id).notNull(),
  
  // User actions
  wasCopied: boolean("was_copied").default(false),
  wasExecuted: boolean("was_executed").default(false), // User confirmed they executed
  userFeedback: varchar("user_feedback", { length: 16 }), // "good", "bad", "neutral"
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Signal = typeof signals.$inferSelect;
export type InsertSignal = typeof signals.$inferInsert;

export type SignalInteraction = typeof signalInteractions.$inferSelect;
export type InsertSignalInteraction = typeof signalInteractions.$inferInsert;
