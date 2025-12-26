/**
 * AQTE Trading Types
 * Comprehensive type definitions for the trading engine
 */

// ============================================
// MARKET DATA TYPES
// ============================================

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h?: number;
  low24h?: number;
  volume24h: number;
  marketCap?: number;
  sparkline: number[];
}

export interface VolatilityMetrics {
  currentVolatility: number; // Daily volatility as decimal
  targetVolatility: number;
  rollingVolatility: number[];
  positionAdjustment: number; // Multiplier for position sizing
  recommendedLeverage: number;
  maxSafeLeverage: number;
}

// ============================================
// TRADING TYPES
// ============================================

export type TradeSide = "long" | "short";
export type TradeStatus = "open" | "closed" | "liquidated" | "cancelled" | "pending" | "filled";
export type OrderType = "market" | "limit" | "post_only";
export type TradingMode = "live" | "simulation";

export interface Trade {
  id: string;
  symbol: string;
  pair?: string;
  side?: TradeSide;
  type: "buy" | "sell";
  orderType: OrderType | "market" | "limit";
  quantity: number;
  price: number;
  total: number;
  leverage?: number;
  liquidationPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number;
  pnlPercent?: number;
  fees?: number;
  status: TradeStatus;
  isSimulated?: boolean;
  timestamp: Date;
  closedAt?: Date;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost?: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  availableBalance?: number;
  marginUsed?: number;
}

// ============================================
// AI SIGNAL TYPES
// ============================================

export type SignalDirection = "bullish" | "bearish" | "neutral";

export interface AISignal {
  id?: string;
  pair?: string;
  direction: SignalDirection;
  confidence: number; // 0-1
  timestamp: Date;
  source: string | "timesfm" | "finbert" | "combined";
  reasoning?: AIReasoning;
}

export interface AIReasoning {
  factors: ReasoningFactor[];
  summary: string;
}

export interface ReasoningFactor {
  name: string;
  value: string | number;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  explanation: string;
}

export interface PriceForecast {
  symbol: string;
  pair?: string;
  currentPrice: number;
  predictions: PricePrediction[];
  model?: string;
  generatedAt: Date;
}

export interface PricePrediction {
  horizon: "24h" | "7d" | "30d";
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
  changePercent?: number;
}

export interface SentimentData {
  pair?: string;
  score: number; // -1 to 1
  label: "positive" | "negative" | "neutral";
  confidence?: number;
  headlines: SentimentHeadline[];
  trend?: number[]; // Historical sentiment scores
  model?: string;
  analyzedAt?: Date;
}

export interface SentimentHeadline {
  id?: string;
  text: string;
  title?: string;
  source: string;
  score: number;
  sentiment?: number;
  timestamp: Date;
  url?: string;
}

// ============================================
// RISK MANAGEMENT TYPES
// ============================================

export type KellyFraction = "quarter" | "half" | "full";

export interface KellyMetrics {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitLossRatio: number;
  optimalFraction: number;
  halfKellyFraction: number;
  quarterKellyFraction?: number;
  currentFraction?: KellyFraction;
  maxLeverage: number;
  recommendedSize: number;
  recommendedPositionSize?: number;
  historicalTrades?: number;
}

export interface ChandelierExit {
  atr: number;
  atrPeriod: number;
  multiplier: number;
  longStop: number;
  shortStop: number;
  currentPrice: number;
}

export interface LiquidationInfo {
  liquidationPrice: number;
  distancePercent: number;
  distanceAbsolute: number;
  riskLevel: "safe" | "warning" | "danger";
  marginRatio: number;
}

export interface RiskSettings {
  maxLeverage: number;
  targetVolatility: number;
  atrMultiplier: number;
  useHalfKelly: boolean;
  kellyFraction?: KellyFraction;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  maxPositionSize?: number; // As fraction of portfolio
  maxDrawdown?: number;
}

// ============================================
// EXCHANGE TYPES
// ============================================

export type ExchangeStatus = "connected" | "disconnected" | "error";
export type ExchangeName = "bitget" | "binance" | "alpaca";

export interface ExchangeConnection {
  id: string;
  name: ExchangeName | string;
  displayName: string;
  status: ExchangeStatus;
  lastSync?: Date;
  error?: string;
  capabilities?: string[];
  balance?: number;
}

export interface BitgetCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

// ============================================
// PAPER TRADING TYPES
// ============================================

export interface PaperWallet {
  userId: number;
  usdtBalance: number;
  btcBalance: number;
  ethBalance: number;
  initialBalance: number;
  peakBalance: number;
  totalTrades: number;
  winningTrades: number;
  totalPnl: number;
  maxDrawdown: number;
  winRate?: number;
  createdAt: Date;
  lastTradeAt?: Date;
}

export interface SimulationStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
}

// ============================================
// APP STATE TYPES
// ============================================

export interface TradingState {
  mode: TradingMode;
  isConnected: boolean;
  selectedPair: string;
  leverage: number;
  orderType: OrderType;
  postOnly: boolean;
}

export interface AppSettings {
  tradingMode?: TradingMode;
  theme?: "light" | "dark" | "system";
  notifications: boolean;
  priceAlerts?: boolean;
  tradeConfirmations?: boolean;
  biometrics?: boolean;
  darkMode?: boolean;
  currency: string | "USD" | "EUR" | "GBP";
  language?: string;
}
