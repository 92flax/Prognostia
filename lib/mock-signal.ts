/**
 * Mock Signal Data for Signal Intelligence Dashboard
 * Uses the signal engine to generate realistic demo signals
 */

import { generateSignal, type SignalSetup, type MarketConditions } from './signal-engine';

// Current market conditions (simulated)
export const mockMarketConditions: MarketConditions = {
  symbol: 'BTCUSDT',
  currentPrice: 98432.50,
  dailyVolatility: 0.042, // 4.2% daily volatility
  atr: 2450.50, // Average True Range
  ema200: 94500.00,
  rsi: 58,
  volume24h: 28500000000,
  sentimentScore: 0.65, // Positive sentiment
};

// Generate the active signal using the engine
export const mockActiveSignal: SignalSetup = generateSignal(mockMarketConditions);

// Alternative market conditions for different scenarios
export const mockBearishConditions: MarketConditions = {
  symbol: 'BTCUSDT',
  currentPrice: 95200.00,
  dailyVolatility: 0.058, // Higher volatility
  atr: 3200.00,
  ema200: 98000.00, // Price below EMA
  rsi: 72, // Overbought
  volume24h: 32000000000,
  sentimentScore: -0.45, // Negative sentiment
};

export const mockBearishSignal: SignalSetup = generateSignal(mockBearishConditions);

// ETH market conditions
export const mockEthConditions: MarketConditions = {
  symbol: 'ETHUSDT',
  currentPrice: 3456.78,
  dailyVolatility: 0.038,
  atr: 145.50,
  ema200: 3200.00,
  rsi: 52,
  volume24h: 12300000000,
  sentimentScore: 0.35,
};

export const mockEthSignal: SignalSetup = generateSignal(mockEthConditions);

// Signal history for display
export const mockSignalHistory: SignalSetup[] = [
  mockActiveSignal,
  mockBearishSignal,
  mockEthSignal,
];

// Market summary data
export interface MarketSummary {
  symbol: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export const mockMarketSummary: MarketSummary[] = [
  {
    symbol: 'BTCUSDT',
    price: 98432.50,
    change24h: 2341.20,
    changePercent: 2.44,
    volume24h: 28500000000,
    high24h: 99100.00,
    low24h: 95800.00,
  },
  {
    symbol: 'ETHUSDT',
    price: 3456.78,
    change24h: -45.32,
    changePercent: -1.29,
    volume24h: 12300000000,
    high24h: 3520.00,
    low24h: 3410.00,
  },
  {
    symbol: 'SOLUSDT',
    price: 185.42,
    change24h: 8.75,
    changePercent: 4.95,
    volume24h: 4500000000,
    high24h: 188.50,
    low24h: 175.20,
  },
];
