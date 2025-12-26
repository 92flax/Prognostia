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
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const tradeSideEnum = pgEnum("trade_side", ["long", "short"]);
export const tradeStatusEnum = pgEnum("trade_status", ["open", "closed", "liquidated", "cancelled"]);
export const orderTypeEnum = pgEnum("order_type", ["market", "limit", "post_only"]);
export const signalDirectionEnum = pgEnum("signal_direction", ["bullish", "bearish", "neutral"]);

/**
 * Core user table backing auth flow.
 * Extended with trading preferences.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  
  // Trading preferences
  preferredLeverage: decimal("preferred_leverage", { precision: 5, scale: 2 }).default("1.0"),
  riskTolerance: decimal("risk_tolerance", { precision: 5, scale: 4 }).default("0.02"), // 2% default
  useSimulationMode: boolean("use_simulation_mode").default(true),
  kellyFraction: varchar("kelly_fraction", { length: 16 }).default("half"), // quarter, half, full
  
  // Bitget credentials (encrypted in production)
  bitgetApiKey: text("bitget_api_key"),
  bitgetSecret: text("bitget_secret"),
  bitgetPassphrase: text("bitget_passphrase"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

/**
 * Trades table - logs every executed trade (live or simulated)
 */
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Trade details
  pair: varchar("pair", { length: 32 }).notNull(), // e.g., "BTC/USDT"
  side: tradeSideEnum("side").notNull(),
  orderType: orderTypeEnum("order_type").default("limit").notNull(),
  
  // Pricing
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 20, scale: 8 }),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  leverage: decimal("leverage", { precision: 5, scale: 2 }).notNull(),
  
  // Risk metrics at entry
  liquidationPrice: decimal("liquidation_price", { precision: 20, scale: 8 }),
  stopLoss: decimal("stop_loss", { precision: 20, scale: 8 }),
  takeProfit: decimal("take_profit", { precision: 20, scale: 8 }),
  
  // P&L
  realizedPnl: decimal("realized_pnl", { precision: 20, scale: 8 }),
  realizedPnlPercent: decimal("realized_pnl_percent", { precision: 10, scale: 4 }),
  fees: decimal("fees", { precision: 20, scale: 8 }).default("0"),
  
  // Status
  status: tradeStatusEnum("status").default("open").notNull(),
  isSimulated: boolean("is_simulated").default(true).notNull(),
  
  // Exchange data
  exchangeOrderId: varchar("exchange_order_id", { length: 128 }),
  exchange: varchar("exchange", { length: 32 }).default("bitget"),
  
  // AI signal that triggered this trade (if any)
  signalId: integer("signal_id"),
  
  // Timestamps
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Signals table - stores AI predictions for backtesting
 */
export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  
  // Asset
  pair: varchar("pair", { length: 32 }).notNull(),
  
  // Signal details
  direction: signalDirectionEnum("direction").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(), // 0.0 to 1.0
  
  // TimesFM predictions
  predictedPrice24h: decimal("predicted_price_24h", { precision: 20, scale: 8 }),
  predictedPrice7d: decimal("predicted_price_7d", { precision: 20, scale: 8 }),
  predictedPrice30d: decimal("predicted_price_30d", { precision: 20, scale: 8 }),
  predictionLower: decimal("prediction_lower", { precision: 20, scale: 8 }),
  predictionUpper: decimal("prediction_upper", { precision: 20, scale: 8 }),
  
  // FinBERT sentiment
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 4 }), // -1.0 to 1.0
  sentimentLabel: varchar("sentiment_label", { length: 16 }), // positive, negative, neutral
  
  // Technical indicators at signal time
  priceAtSignal: decimal("price_at_signal", { precision: 20, scale: 8 }).notNull(),
  ema200: decimal("ema_200", { precision: 20, scale: 8 }),
  rsi14: decimal("rsi_14", { precision: 5, scale: 2 }),
  dailyVolatility: decimal("daily_volatility", { precision: 10, scale: 6 }),
  
  // Explainable AI reasoning
  reasoning: jsonb("reasoning"), // { factors: [...], weights: [...] }
  
  // Backtesting
  actualPrice24h: decimal("actual_price_24h", { precision: 20, scale: 8 }),
  actualPrice7d: decimal("actual_price_7d", { precision: 20, scale: 8 }),
  wasCorrect: boolean("was_correct"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Paper wallets - virtual balances for simulation mode
 */
export const paperWallets = pgTable("paper_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  
  // Balances
  usdtBalance: decimal("usdt_balance", { precision: 20, scale: 8 }).default("10000").notNull(),
  btcBalance: decimal("btc_balance", { precision: 20, scale: 8 }).default("0").notNull(),
  ethBalance: decimal("eth_balance", { precision: 20, scale: 8 }).default("0").notNull(),
  
  // Performance tracking
  initialBalance: decimal("initial_balance", { precision: 20, scale: 8 }).default("10000").notNull(),
  peakBalance: decimal("peak_balance", { precision: 20, scale: 8 }).default("10000").notNull(),
  totalTrades: integer("total_trades").default(0).notNull(),
  winningTrades: integer("winning_trades").default(0).notNull(),
  totalPnl: decimal("total_pnl", { precision: 20, scale: 8 }).default("0").notNull(),
  maxDrawdown: decimal("max_drawdown", { precision: 10, scale: 4 }).default("0").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastTradeAt: timestamp("last_trade_at"),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

export type Signal = typeof signals.$inferSelect;
export type InsertSignal = typeof signals.$inferInsert;

export type PaperWallet = typeof paperWallets.$inferSelect;
export type InsertPaperWallet = typeof paperWallets.$inferInsert;
