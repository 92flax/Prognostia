import { describe, it, expect } from 'vitest';
import {
  mockMarketData,
  mockPortfolioSummary,
  mockHoldings,
  mockTrades,
  mockAISignal,
  mockPriceForecast,
  mockSentimentData,
  mockKellyMetrics,
  mockVolatilityMetrics,
  mockChandelierExit,
  mockExchangeConnections,
  mockRiskSettings,
} from '../mock-data';

describe('mockMarketData', () => {
  it('contains market data entries', () => {
    expect(mockMarketData.length).toBeGreaterThan(0);
  });

  it('has valid market data structure', () => {
    const btc = mockMarketData.find(m => m.symbol === 'BTC');
    expect(btc).toBeDefined();
    expect(btc?.price).toBeGreaterThan(0);
    expect(btc?.sparkline.length).toBeGreaterThan(0);
  });
});

describe('mockPortfolioSummary', () => {
  it('has valid portfolio values', () => {
    expect(mockPortfolioSummary.totalValue).toBeGreaterThan(0);
    expect(typeof mockPortfolioSummary.dailyPnL).toBe('number');
    expect(typeof mockPortfolioSummary.dailyPnLPercent).toBe('number');
  });
});

describe('mockHoldings', () => {
  it('contains holdings', () => {
    expect(mockHoldings.length).toBeGreaterThan(0);
  });

  it('has valid holding structure', () => {
    const holding = mockHoldings[0];
    expect(holding.symbol).toBeDefined();
    expect(holding.quantity).toBeGreaterThan(0);
    expect(holding.value).toBeGreaterThan(0);
    expect(holding.allocation).toBeGreaterThan(0);
    expect(holding.allocation).toBeLessThanOrEqual(100);
  });

  it('allocations sum to approximately 100%', () => {
    const totalAllocation = mockHoldings.reduce((sum, h) => sum + h.allocation, 0);
    expect(totalAllocation).toBeCloseTo(100, 0);
  });
});

describe('mockTrades', () => {
  it('contains trades', () => {
    expect(mockTrades.length).toBeGreaterThan(0);
  });

  it('has valid trade structure', () => {
    const trade = mockTrades[0];
    expect(['buy', 'sell']).toContain(trade.type);
    expect(['market', 'limit']).toContain(trade.orderType);
    expect(trade.quantity).toBeGreaterThan(0);
    expect(trade.price).toBeGreaterThan(0);
  });
});

describe('mockAISignal', () => {
  it('has valid signal direction', () => {
    expect(['bullish', 'bearish', 'neutral']).toContain(mockAISignal.direction);
  });

  it('has confidence between 0 and 1', () => {
    expect(mockAISignal.confidence).toBeGreaterThanOrEqual(0);
    expect(mockAISignal.confidence).toBeLessThanOrEqual(1);
  });
});

describe('mockPriceForecast', () => {
  it('has predictions for multiple horizons', () => {
    expect(mockPriceForecast.predictions.length).toBeGreaterThan(0);
  });

  it('has valid prediction structure', () => {
    const pred = mockPriceForecast.predictions[0];
    expect(['24h', '7d', '30d']).toContain(pred.horizon);
    expect(pred.predicted).toBeGreaterThan(0);
    expect(pred.lower).toBeLessThan(pred.predicted);
    expect(pred.upper).toBeGreaterThan(pred.predicted);
    expect(pred.confidence).toBeGreaterThanOrEqual(0);
    expect(pred.confidence).toBeLessThanOrEqual(1);
  });
});

describe('mockSentimentData', () => {
  it('has score between -1 and 1', () => {
    expect(mockSentimentData.score).toBeGreaterThanOrEqual(-1);
    expect(mockSentimentData.score).toBeLessThanOrEqual(1);
  });

  it('has valid label', () => {
    expect(['positive', 'negative', 'neutral']).toContain(mockSentimentData.label);
  });

  it('has headlines', () => {
    expect(mockSentimentData.headlines.length).toBeGreaterThan(0);
  });
});

describe('mockKellyMetrics', () => {
  it('has valid win rate', () => {
    expect(mockKellyMetrics.winRate).toBeGreaterThan(0);
    expect(mockKellyMetrics.winRate).toBeLessThanOrEqual(1);
  });

  it('has half kelly less than optimal', () => {
    expect(mockKellyMetrics.halfKellyFraction).toBeLessThan(mockKellyMetrics.optimalFraction);
  });

  it('has positive profit/loss ratio', () => {
    expect(mockKellyMetrics.profitLossRatio).toBeGreaterThan(0);
  });
});

describe('mockVolatilityMetrics', () => {
  it('has valid volatility values', () => {
    expect(mockVolatilityMetrics.currentVolatility).toBeGreaterThan(0);
    expect(mockVolatilityMetrics.targetVolatility).toBeGreaterThan(0);
  });

  it('has rolling volatility data', () => {
    expect(mockVolatilityMetrics.rollingVolatility.length).toBeGreaterThan(0);
  });
});

describe('mockChandelierExit', () => {
  it('has valid ATR value', () => {
    expect(mockChandelierExit.atr).toBeGreaterThan(0);
  });

  it('has long stop below current price', () => {
    expect(mockChandelierExit.longStop).toBeLessThan(mockChandelierExit.currentPrice);
  });

  it('has short stop above current price', () => {
    expect(mockChandelierExit.shortStop).toBeGreaterThan(mockChandelierExit.currentPrice);
  });
});

describe('mockExchangeConnections', () => {
  it('contains exchange connections', () => {
    expect(mockExchangeConnections.length).toBeGreaterThan(0);
  });

  it('has valid connection status', () => {
    mockExchangeConnections.forEach(conn => {
      expect(['connected', 'disconnected', 'error']).toContain(conn.status);
    });
  });
});

describe('mockRiskSettings', () => {
  it('has valid max leverage', () => {
    expect(mockRiskSettings.maxLeverage).toBeGreaterThan(0);
  });

  it('has valid target volatility', () => {
    expect(mockRiskSettings.targetVolatility).toBeGreaterThan(0);
    expect(mockRiskSettings.targetVolatility).toBeLessThanOrEqual(1);
  });
});
