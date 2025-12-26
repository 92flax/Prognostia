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
export const tradeModeEnum = pgEnum("trade_mode", ["PAPER", "LIVE"]);
export const tradeStatusEnum = pgEnum("trade_status", ["OPEN", "CLOSED", "CANCELLED"]);
export const tradeSideEnum = pgEnum("trade_side", ["BUY", "SELL"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

/**
 * User settings - stores trading preferences and API credentials
 * API credentials should be encrypted in production
 */
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  
  // Bitget API Credentials (should be encrypted in production)
  bitgetApiKey: varchar("bitget_api_key", { length: 256 }),
  bitgetSecret: varchar("bitget_secret", { length: 256 }),
  bitgetPassphrase: varchar("bitget_passphrase", { length: 256 }),
  
  // Trading settings
  autoTradeEnabled: boolean("auto_trade_enabled").default(false).notNull(),
  confidenceThreshold: integer("confidence_threshold").default(75).notNull(), // 0-100
  maxPositionSizePercent: decimal("max_position_size_percent", { precision: 5, scale: 2 }).default("10.0"), // % of balance
  
  // Risk settings
  preferredSafetyFactor: decimal("preferred_safety_factor", { precision: 5, scale: 2 }).default("2.0"),
  preferredRiskReward: decimal("preferred_risk_reward", { precision: 5, scale: 2 }).default("2.0"),
  maxLeverageLimit: integer("max_leverage_limit").default(20),
  atrMultiplier: decimal("atr_multiplier", { precision: 5, scale: 2 }).default("3.0"),
  
  // Connection status (updated on successful connection test)
  isConnected: boolean("is_connected").default(false),
  lastConnectionTest: timestamp("last_connection_test"),
  connectionError: text("connection_error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Signals table - stores complete trading signal setups
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
  rationale: text("rationale").notNull(), // Human-readable XAI explanation
  
  // Market conditions at signal generation
  dailyVolatility: decimal("daily_volatility", { precision: 10, scale: 6 }),
  atr: decimal("atr", { precision: 20, scale: 8 }),
  ema200: decimal("ema_200", { precision: 20, scale: 8 }),
  rsi14: decimal("rsi_14", { precision: 5, scale: 2 }),
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 4 }), // -1.0 to 1.0
  
  // Execution tracking
  executed: boolean("executed").default(false).notNull(),
  executedAt: timestamp("executed_at"),
  executionMode: tradeModeEnum("execution_mode"), // PAPER or LIVE
  
  // Backtesting fields
  actualOutcome: varchar("actual_outcome", { length: 16 }), // "TP_HIT", "SL_HIT", "EXPIRED"
  actualPnlPercent: decimal("actual_pnl_percent", { precision: 10, scale: 4 }),
  wasSuccessful: boolean("was_successful"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  resolvedAt: timestamp("resolved_at"),
});

/**
 * Trades table - stores all executed trades (both paper and live)
 */
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  signalId: integer("signal_id").references(() => signals.id),
  
  // Trade mode
  mode: tradeModeEnum("mode").notNull(), // PAPER or LIVE
  
  // Trade details
  asset: varchar("asset", { length: 32 }).notNull(), // e.g., "BTCUSDT"
  side: tradeSideEnum("side").notNull(), // BUY or SELL
  direction: signalDirectionEnum("direction").notNull(), // LONG or SHORT (for futures)
  
  // Position sizing
  size: decimal("size", { precision: 20, scale: 8 }).notNull(), // Position size in base currency
  leverage: integer("leverage").notNull(),
  margin: decimal("margin", { precision: 20, scale: 8 }).notNull(), // Required margin
  
  // Prices
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 20, scale: 8 }),
  takeProfitPrice: decimal("tp_price", { precision: 20, scale: 8 }),
  stopLossPrice: decimal("sl_price", { precision: 20, scale: 8 }),
  liquidationPrice: decimal("liquidation_price", { precision: 20, scale: 8 }),
  
  // P&L
  realizedPnl: decimal("realized_pnl", { precision: 20, scale: 8 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 20, scale: 8 }),
  pnlPercent: decimal("pnl_percent", { precision: 10, scale: 4 }),
  
  // Status
  status: tradeStatusEnum("status").default("OPEN").notNull(),
  closeReason: varchar("close_reason", { length: 32 }), // "TP_HIT", "SL_HIT", "MANUAL", "LIQUIDATED"
  
  // Exchange data (for live trades)
  exchangeOrderId: varchar("exchange_order_id", { length: 128 }),
  exchangePositionId: varchar("exchange_position_id", { length: 128 }),
  
  // Timestamps
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Paper wallet - virtual balance for simulation mode
 */
export const paperWallet = pgTable("paper_wallet", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  
  // Balances
  usdtBalance: decimal("usdt_balance", { precision: 20, scale: 8 }).default("10000.0").notNull(),
  initialBalance: decimal("initial_balance", { precision: 20, scale: 8 }).default("10000.0").notNull(),
  
  // Performance tracking
  totalPnl: decimal("total_pnl", { precision: 20, scale: 8 }).default("0.0").notNull(),
  totalTrades: integer("total_trades").default(0).notNull(),
  winningTrades: integer("winning_trades").default(0).notNull(),
  losingTrades: integer("losing_trades").default(0).notNull(),
  
  // Margin tracking
  usedMargin: decimal("used_margin", { precision: 20, scale: 8 }).default("0.0").notNull(),
  availableBalance: decimal("available_balance", { precision: 20, scale: 8 }).default("10000.0").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastResetAt: timestamp("last_reset_at").defaultNow().notNull(),
});

/**
 * Signal interactions - tracking user actions on signals
 */
export const signalInteractions = pgTable("signal_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  signalId: integer("signal_id").references(() => signals.id).notNull(),
  
  wasCopied: boolean("was_copied").default(false),
  wasExecuted: boolean("was_executed").default(false),
  userFeedback: varchar("user_feedback", { length: 16 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export type Signal = typeof signals.$inferSelect;
export type InsertSignal = typeof signals.$inferInsert;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

export type PaperWallet = typeof paperWallet.$inferSelect;
export type InsertPaperWallet = typeof paperWallet.$inferInsert;

export type SignalInteraction = typeof signalInteractions.$inferSelect;
export type InsertSignalInteraction = typeof signalInteractions.$inferInsert;
