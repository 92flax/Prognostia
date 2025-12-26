/**
 * Mock trading data for AQTE automated trading bot
 */

import { Asset } from "@/components/asset-selector";
import { MarketConditions, generateSignal, SignalSetup } from "./signal-engine";

// ============================================
// MOCK ASSETS
// ============================================

export const MOCK_ASSETS: Asset[] = [
  { symbol: "BTCUSDT", name: "BTC", price: 98450, change24h: 2.34 },
  { symbol: "ETHUSDT", name: "ETH", price: 3420, change24h: 1.87 },
  { symbol: "SOLUSDT", name: "SOL", price: 186.50, change24h: -0.92 },
  { symbol: "XRPUSDT", name: "XRP", price: 2.18, change24h: 5.21 },
  { symbol: "DOGEUSDT", name: "DOGE", price: 0.324, change24h: -1.45 },
  { symbol: "AVAXUSDT", name: "AVAX", price: 38.90, change24h: 3.12 },
];

// ============================================
// MOCK MARKET CONDITIONS
// ============================================

export const MOCK_MARKET_CONDITIONS: Record<string, MarketConditions> = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    currentPrice: 98450,
    dailyVolatility: 0.032, // 3.2%
    atr: 1850, // ~1.9% of price
    ema200: 94200,
    rsi: 58,
    sentimentScore: 0.65,
  },
  ETHUSDT: {
    symbol: "ETHUSDT",
    currentPrice: 3420,
    dailyVolatility: 0.038, // 3.8%
    atr: 95,
    ema200: 3280,
    rsi: 52,
    sentimentScore: 0.45,
  },
  SOLUSDT: {
    symbol: "SOLUSDT",
    currentPrice: 186.50,
    dailyVolatility: 0.052, // 5.2%
    atr: 8.5,
    ema200: 175,
    rsi: 45,
    sentimentScore: 0.25,
  },
  XRPUSDT: {
    symbol: "XRPUSDT",
    currentPrice: 2.18,
    dailyVolatility: 0.045, // 4.5%
    atr: 0.085,
    ema200: 1.95,
    rsi: 68,
    sentimentScore: 0.72,
  },
  DOGEUSDT: {
    symbol: "DOGEUSDT",
    currentPrice: 0.324,
    dailyVolatility: 0.058, // 5.8%
    atr: 0.018,
    ema200: 0.295,
    rsi: 42,
    sentimentScore: 0.15,
  },
  AVAXUSDT: {
    symbol: "AVAXUSDT",
    currentPrice: 38.90,
    dailyVolatility: 0.048, // 4.8%
    atr: 1.65,
    ema200: 36.50,
    rsi: 55,
    sentimentScore: 0.52,
  },
};

// ============================================
// SIGNAL GENERATION
// ============================================

/**
 * Generate a mock signal for a given asset
 */
export function generateMockSignal(asset: string): SignalSetup {
  const market = MOCK_MARKET_CONDITIONS[asset];
  if (!market) {
    // Default to BTC if asset not found
    return generateSignal(MOCK_MARKET_CONDITIONS.BTCUSDT);
  }
  return generateSignal(market);
}

/**
 * Get current market conditions for an asset
 */
export function getMarketConditions(asset: string): MarketConditions | undefined {
  return MOCK_MARKET_CONDITIONS[asset];
}

// ============================================
// MOCK TRADE HISTORY
// ============================================

export interface MockTrade {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice?: number;
  size: number;
  leverage: number;
  pnl?: number;
  pnlPercent?: number;
  status: "OPEN" | "CLOSED";
  mode: "PAPER" | "LIVE";
  openedAt: Date;
  closedAt?: Date;
}

export const MOCK_TRADE_HISTORY: MockTrade[] = [
  {
    id: "trade_1",
    asset: "BTCUSDT",
    direction: "LONG",
    entryPrice: 96200,
    exitPrice: 98450,
    size: 0.05,
    leverage: 10,
    pnl: 112.50,
    pnlPercent: 23.4,
    status: "CLOSED",
    mode: "PAPER",
    openedAt: new Date(Date.now() - 86400000 * 2),
    closedAt: new Date(Date.now() - 86400000),
  },
  {
    id: "trade_2",
    asset: "ETHUSDT",
    direction: "LONG",
    entryPrice: 3380,
    size: 0.5,
    leverage: 7,
    status: "OPEN",
    mode: "PAPER",
    openedAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    id: "trade_3",
    asset: "SOLUSDT",
    direction: "SHORT",
    entryPrice: 192.50,
    exitPrice: 186.50,
    size: 2,
    leverage: 5,
    pnl: 60.00,
    pnlPercent: 15.6,
    status: "CLOSED",
    mode: "PAPER",
    openedAt: new Date(Date.now() - 86400000 * 3),
    closedAt: new Date(Date.now() - 86400000 * 2),
  },
];

// ============================================
// MOCK PAPER WALLET
// ============================================

export interface MockPaperWallet {
  balance: number;
  initialBalance: number;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  usedMargin: number;
}

export const MOCK_PAPER_WALLET: MockPaperWallet = {
  balance: 10172.50,
  initialBalance: 10000,
  totalPnl: 172.50,
  totalTrades: 5,
  winningTrades: 3,
  losingTrades: 2,
  usedMargin: 241.43,
};
