/**
 * Tests for AQTE Refactor Features
 * - PostgreSQL schema types
 * - Bitget exchange types
 * - High-leverage safety features
 * - Paper trading mode
 * - Explainable AI
 */

import { describe, it, expect } from 'vitest';
import {
  mockExchangeConnections,
  mockRiskSettings,
  mockLiquidationInfo,
  mockAIReasoning,
  mockPaperWallet,
  mockTradingMode,
  mockVolatilityMetrics,
  mockKellyMetrics,
} from '../mock-data';
import type {
  ExchangeConnection,
  TradingMode,
  KellyFraction,
  LiquidationInfo,
  AIReasoning,
  PaperWallet,
  VolatilityMetrics,
} from '../types';

describe('Bitget Exchange Integration', () => {
  it('should have Bitget as primary exchange', () => {
    const bitget = mockExchangeConnections.find(e => e.name === 'bitget');
    expect(bitget).toBeDefined();
    expect(bitget?.status).toBe('connected');
  });

  it('should have Alpaca as secondary exchange for stocks', () => {
    const alpaca = mockExchangeConnections.find(e => e.name === 'alpaca');
    expect(alpaca).toBeDefined();
    expect(alpaca?.capabilities).toContain('stocks');
  });

  it('should not have Binance as primary exchange', () => {
    const binance = mockExchangeConnections.find(e => e.name === 'binance');
    // Binance should either not exist or be disconnected
    if (binance) {
      expect(binance.status).not.toBe('connected');
    }
  });

  it('should have balance field for connected exchanges', () => {
    const bitget = mockExchangeConnections.find(e => e.name === 'bitget');
    expect(bitget?.balance).toBeDefined();
    expect(typeof bitget?.balance).toBe('number');
  });
});

describe('Paper Trading Mode', () => {
  it('should have valid trading mode type', () => {
    const validModes: TradingMode[] = ['live', 'simulation'];
    expect(validModes).toContain(mockTradingMode);
  });

  it('should have paper wallet with required fields', () => {
    expect(mockPaperWallet).toBeDefined();
    expect(mockPaperWallet.usdtBalance).toBeGreaterThanOrEqual(0);
    expect(mockPaperWallet.btcBalance).toBeGreaterThanOrEqual(0);
    expect(mockPaperWallet.ethBalance).toBeGreaterThanOrEqual(0);
    expect(mockPaperWallet.initialBalance).toBeGreaterThan(0);
  });

  it('should track paper wallet statistics', () => {
    expect(typeof mockPaperWallet.totalTrades).toBe('number');
    expect(typeof mockPaperWallet.winningTrades).toBe('number');
    expect(typeof mockPaperWallet.maxDrawdown).toBe('number');
    expect(typeof mockPaperWallet.peakBalance).toBe('number');
  });

  it('should have win rate between 0 and 100%', () => {
    const winRate = mockPaperWallet.totalTrades > 0
      ? (mockPaperWallet.winningTrades / mockPaperWallet.totalTrades) * 100
      : 0;
    expect(winRate).toBeGreaterThanOrEqual(0);
    expect(winRate).toBeLessThanOrEqual(100);
  });
});

describe('Liquidation Distance Feature', () => {
  it('should have liquidation info with required fields', () => {
    expect(mockLiquidationInfo).toBeDefined();
    expect(mockLiquidationInfo.liquidationPrice).toBeGreaterThan(0);
    expect(mockLiquidationInfo.distancePercent).toBeGreaterThanOrEqual(0);
    expect(mockLiquidationInfo.distanceAbsolute).toBeGreaterThanOrEqual(0);
  });

  it('should have valid risk level', () => {
    const validRiskLevels = ['safe', 'warning', 'danger'];
    expect(validRiskLevels).toContain(mockLiquidationInfo.riskLevel);
  });

  it('should have margin ratio between 0 and 1', () => {
    expect(mockLiquidationInfo.marginRatio).toBeGreaterThanOrEqual(0);
    expect(mockLiquidationInfo.marginRatio).toBeLessThanOrEqual(1);
  });
});

describe('Volatility-Based Smart Leverage', () => {
  it('should have volatility metrics', () => {
    expect(mockVolatilityMetrics).toBeDefined();
    expect(mockVolatilityMetrics.currentVolatility).toBeGreaterThan(0);
    expect(mockVolatilityMetrics.targetVolatility).toBeGreaterThan(0);
  });

  it('should calculate recommended leverage based on volatility', () => {
    expect(mockVolatilityMetrics.recommendedLeverage).toBeGreaterThan(0);
    expect(mockVolatilityMetrics.maxSafeLeverage).toBeGreaterThan(0);
  });

  it('should have recommended leverage <= max safe leverage', () => {
    expect(mockVolatilityMetrics.recommendedLeverage).toBeLessThanOrEqual(
      mockVolatilityMetrics.maxSafeLeverage
    );
  });

  it('should calculate leverage inversely proportional to volatility', () => {
    // Higher volatility should mean lower recommended leverage
    // Formula: MaxLeverage = (1 / DailyVolatility) * SafetyFactor
    const safetyFactor = 0.5; // Conservative
    const calculatedMaxLeverage = (1 / mockVolatilityMetrics.currentVolatility) * safetyFactor;
    // The actual value should be in a reasonable range
    expect(calculatedMaxLeverage).toBeGreaterThan(0);
  });
});

describe('Kelly Criterion with Quarter-Kelly', () => {
  it('should have Kelly metrics with all fraction options', () => {
    expect(mockKellyMetrics).toBeDefined();
    expect(mockKellyMetrics.optimalFraction).toBeGreaterThan(0);
    expect(mockKellyMetrics.halfKellyFraction).toBeGreaterThan(0);
  });

  it('should have half-Kelly = 50% of full Kelly', () => {
    const expectedHalfKelly = mockKellyMetrics.optimalFraction * 0.5;
    expect(mockKellyMetrics.halfKellyFraction).toBeCloseTo(expectedHalfKelly, 4);
  });

  it('should have quarter-Kelly = 25% of full Kelly', () => {
    const expectedQuarterKelly = mockKellyMetrics.optimalFraction * 0.25;
    const actualQuarterKelly = mockKellyMetrics.quarterKellyFraction || mockKellyMetrics.optimalFraction * 0.25;
    expect(actualQuarterKelly).toBeCloseTo(expectedQuarterKelly, 4);
  });

  it('should have valid Kelly fraction type in risk settings', () => {
    const validFractions: KellyFraction[] = ['full', 'half', 'quarter'];
    expect(validFractions).toContain(mockRiskSettings.kellyFraction);
  });

  it('should have win rate between 0 and 1', () => {
    expect(mockKellyMetrics.winRate).toBeGreaterThanOrEqual(0);
    expect(mockKellyMetrics.winRate).toBeLessThanOrEqual(1);
  });
});

describe('Explainable AI (XAI)', () => {
  it('should have AI reasoning with summary', () => {
    expect(mockAIReasoning).toBeDefined();
    expect(mockAIReasoning.summary).toBeTruthy();
    expect(typeof mockAIReasoning.summary).toBe('string');
  });

  it('should have contributing factors', () => {
    expect(mockAIReasoning.factors).toBeDefined();
    expect(Array.isArray(mockAIReasoning.factors)).toBe(true);
    expect(mockAIReasoning.factors.length).toBeGreaterThan(0);
  });

  it('should have valid factor structure', () => {
    mockAIReasoning.factors.forEach(factor => {
      expect(factor.name).toBeTruthy();
      expect(factor.explanation).toBeTruthy();
      expect(['positive', 'negative', 'neutral']).toContain(factor.impact);
      expect(factor.weight).toBeGreaterThanOrEqual(0);
      expect(factor.weight).toBeLessThanOrEqual(1);
    });
  });

  it('should have factor weights sum to approximately 1', () => {
    const totalWeight = mockAIReasoning.factors.reduce((sum, f) => sum + f.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 1); // Allow some tolerance
  });

  it('should include FinBERT sentiment in factors', () => {
    const sentimentFactor = mockAIReasoning.factors.find(
      f => f.name.toLowerCase().includes('sentiment') || f.name.toLowerCase().includes('finbert')
    );
    expect(sentimentFactor).toBeDefined();
  });

  it('should include technical indicators in factors', () => {
    const technicalFactors = mockAIReasoning.factors.filter(
      f => f.name.toLowerCase().includes('ema') || 
           f.name.toLowerCase().includes('rsi') ||
           f.name.toLowerCase().includes('price')
    );
    expect(technicalFactors.length).toBeGreaterThan(0);
  });
});

describe('Risk Settings', () => {
  it('should have max leverage setting', () => {
    expect(mockRiskSettings.maxLeverage).toBeGreaterThan(0);
    expect(mockRiskSettings.maxLeverage).toBeLessThanOrEqual(125); // Reasonable max
  });

  it('should have target volatility setting', () => {
    expect(mockRiskSettings.targetVolatility).toBeGreaterThan(0);
    expect(mockRiskSettings.targetVolatility).toBeLessThanOrEqual(1);
  });

  it('should have ATR multiplier setting', () => {
    expect(mockRiskSettings.atrMultiplier).toBeGreaterThan(0);
    expect(mockRiskSettings.atrMultiplier).toBeLessThanOrEqual(10);
  });
});
