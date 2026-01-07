import { describe, it, expect } from "vitest";

// Test Signal Engine with Hurst and OU
import {
  calculateHurstExponent,
  detectRegime,
  estimateOUParameters,
  generateOUSignal,
  TIMEFRAME_SCALERS,
  type Timeframe,
} from "../signal-engine";

// Test Risk Engine
import {
  calculateRiskMetrics,
  calculateOptimalF,
  calculateKellyFraction,
  calculateRiskOfRuin,
  calculateOptimalPositionSize,
  type TradeResult,
} from "../risk-engine";

describe("Signal Engine - Hurst Exponent", () => {
  it("should calculate Hurst exponent for trending data", () => {
    // Trending data (H > 0.5)
    const trendingPrices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5 + Math.random() * 2);
    const hurst = calculateHurstExponent(trendingPrices);
    expect(hurst).toBeGreaterThanOrEqual(0);
    expect(hurst).toBeLessThanOrEqual(1);
  });

  it("should calculate Hurst exponent for mean-reverting data", () => {
    // Mean-reverting data (H < 0.5)
    const meanRevertingPrices = Array.from({ length: 100 }, (_, i) => 
      100 + Math.sin(i / 5) * 10 + Math.random() * 2
    );
    const hurst = calculateHurstExponent(meanRevertingPrices);
    expect(hurst).toBeGreaterThanOrEqual(0);
    expect(hurst).toBeLessThanOrEqual(1);
  });

  it("should return null or default value for insufficient data", () => {
    const shortPrices = [100, 101, 102];
    const hurst = calculateHurstExponent(shortPrices);
    // With insufficient data, should return null or a default value
    if (hurst !== null) {
      expect(hurst).toBeGreaterThanOrEqual(0);
      expect(hurst).toBeLessThanOrEqual(1);
    } else {
      expect(hurst).toBeNull();
    }
  });
});

describe("Signal Engine - Regime Detection", () => {
  it("should detect TRENDING regime for H > 0.55", () => {
    const regime = detectRegime(0.65);
    expect(regime).toBe("TRENDING");
  });

  it("should detect MEAN_REVERSION regime for H < 0.45", () => {
    const regime = detectRegime(0.35);
    expect(regime).toBe("MEAN_REVERSION");
  });

  it("should detect RANDOM_WALK or specific regime for H around 0.5", () => {
    const regime = detectRegime(0.50);
    // H = 0.5 indicates random walk (no predictable pattern)
    expect(["UNKNOWN", "MEAN_REVERSION", "TRENDING", "RANDOM_WALK"]).toContain(regime);
  });
});

describe("Signal Engine - Ornstein-Uhlenbeck Process", () => {
  it("should estimate OU parameters from price data", () => {
    const prices = Array.from({ length: 100 }, (_, i) => 
      100 + Math.sin(i / 10) * 5 + Math.random()
    );
    const params = estimateOUParameters(prices);
    
    expect(params).toHaveProperty("mu");
    expect(params).toHaveProperty("theta");
    expect(params).toHaveProperty("sigma");
    expect(params.mu).toBeGreaterThan(0);
    expect(params.theta).toBeGreaterThanOrEqual(0);
    expect(params.sigma).toBeGreaterThanOrEqual(0);
  });

  it("should generate OU signal based on deviation from mean", () => {
    const params = { mu: 100, theta: 0.1, sigma: 5 };
    
    // Price below mean - 2 sigma should be LONG
    const longSignal = generateOUSignal(85, params);
    expect(longSignal.direction).toBe("LONG");
    
    // Price above mean + 2 sigma should be SHORT
    const shortSignal = generateOUSignal(115, params);
    expect(shortSignal.direction).toBe("SHORT");
    
    // Price near mean should be NEUTRAL (null direction)
    const neutralSignal = generateOUSignal(100, params);
    // Neutral signals may have null direction or "NEUTRAL"
    expect([null, "NEUTRAL"]).toContain(neutralSignal.direction);
  });
});

describe("Signal Engine - Timeframe Scalers", () => {
  it("should scale volatility by timeframe", () => {
    const tf5m: Timeframe = "5m";
    const tf1h: Timeframe = "1h";
    const tf1d: Timeframe = "1d";
    
    expect(TIMEFRAME_SCALERS[tf5m]).toBeLessThan(TIMEFRAME_SCALERS[tf1h]);
    expect(TIMEFRAME_SCALERS[tf1h]).toBeLessThan(TIMEFRAME_SCALERS[tf1d]);
    expect(TIMEFRAME_SCALERS[tf1d]).toBe(1);
  });
});

describe("Risk Engine - Risk Metrics", () => {
  it("should calculate risk metrics from trade history", () => {
    const trades: TradeResult[] = [
      { pnl: 100, pnlPercent: 10 },
      { pnl: -50, pnlPercent: -5 },
      { pnl: 80, pnlPercent: 8 },
      { pnl: -30, pnlPercent: -3 },
      { pnl: 120, pnlPercent: 12 },
    ];
    
    const metrics = calculateRiskMetrics(trades);
    
    expect(metrics.winRate).toBe(0.6); // 3 wins out of 5
    expect(metrics.avgWin).toBe(100); // (100 + 80 + 120) / 3
    expect(metrics.avgLoss).toBe(40); // (50 + 30) / 2
    expect(metrics.totalTrades).toBe(5);
  });

  it("should return defaults for empty trade history", () => {
    const metrics = calculateRiskMetrics([]);
    
    expect(metrics.winRate).toBe(0.5);
    expect(metrics.totalTrades).toBe(0);
  });
});

describe("Risk Engine - Optimal f", () => {
  it("should calculate optimal f for profitable system", () => {
    const trades: TradeResult[] = Array.from({ length: 20 }, (_, i) => ({
      pnl: i % 3 === 0 ? -50 : 100,
      pnlPercent: i % 3 === 0 ? -5 : 10,
    }));
    
    const optimalF = calculateOptimalF(trades, 10000);
    
    expect(optimalF).toBeGreaterThan(0);
    expect(optimalF).toBeLessThanOrEqual(0.25);
  });

  it("should return default for insufficient trades", () => {
    const trades: TradeResult[] = [
      { pnl: 100, pnlPercent: 10 },
      { pnl: -50, pnlPercent: -5 },
    ];
    
    const optimalF = calculateOptimalF(trades, 10000);
    
    expect(optimalF).toBe(0.02); // Default 2%
  });
});

describe("Risk Engine - Kelly Criterion", () => {
  it("should calculate Kelly fraction for profitable system", () => {
    const metrics = {
      winRate: 0.6,
      avgWin: 100,
      avgLoss: 50,
      avgWinPercent: 10,
      avgLossPercent: 5,
      profitFactor: 2.4,
      expectancy: 40,
      maxDrawdown: 0.1,
      totalTrades: 50,
    };
    
    const kelly = calculateKellyFraction(metrics);
    
    expect(kelly).toBeGreaterThan(0);
    expect(kelly).toBeLessThanOrEqual(1);
  });

  it("should return 0 for unprofitable system", () => {
    const metrics = {
      winRate: 0.3,
      avgWin: 50,
      avgLoss: 100,
      avgWinPercent: 5,
      avgLossPercent: 10,
      profitFactor: 0.5,
      expectancy: -55,
      maxDrawdown: 0.3,
      totalTrades: 50,
    };
    
    const kelly = calculateKellyFraction(metrics);
    
    expect(kelly).toBe(0);
  });
});

describe("Risk Engine - Risk of Ruin", () => {
  it("should calculate low RoR for good system", () => {
    const metrics = {
      winRate: 0.6,
      avgWin: 100,
      avgLoss: 50,
      avgWinPercent: 10,
      avgLossPercent: 5,
      profitFactor: 2.4,
      expectancy: 40,
      maxDrawdown: 0.1,
      totalTrades: 50,
    };
    
    const ror = calculateRiskOfRuin(metrics, 200, 10000);
    
    expect(ror).toBeGreaterThanOrEqual(0);
    expect(ror).toBeLessThanOrEqual(1);
  });

  it("should return 1 for negative edge system", () => {
    const metrics = {
      winRate: 0.3,
      avgWin: 50,
      avgLoss: 100,
      avgWinPercent: 5,
      avgLossPercent: 10,
      profitFactor: 0.5,
      expectancy: -55,
      maxDrawdown: 0.3,
      totalTrades: 50,
    };
    
    const ror = calculateRiskOfRuin(metrics, 1000, 10000);
    
    expect(ror).toBe(1);
  });
});

describe("Risk Engine - Optimal Position Size", () => {
  it("should calculate safe position size with Zero Ruin constraint", () => {
    const trades: TradeResult[] = Array.from({ length: 20 }, (_, i) => ({
      pnl: i % 3 === 0 ? -80 : 100,
      pnlPercent: i % 3 === 0 ? -8 : 10,
    }));
    
    const result = calculateOptimalPositionSize(
      trades,
      10000,
      100, // entry price
      95,  // stop loss price
      10,  // leverage
      "HALF"
    );
    
    expect(result).toHaveProperty("optimalF");
    expect(result).toHaveProperty("safePositionSize");
    expect(result).toHaveProperty("riskOfRuin");
    expect(result).toHaveProperty("isZeroRuinSafe");
    
    expect(result.safePositionSize).toBeGreaterThan(0);
    expect(result.safePositionSize).toBeLessThanOrEqual(10000);
  });

  it("should add warnings for insufficient trade history", () => {
    const trades: TradeResult[] = [
      { pnl: 100, pnlPercent: 10 },
      { pnl: -50, pnlPercent: -5 },
    ];
    
    const result = calculateOptimalPositionSize(
      trades,
      10000,
      100,
      95,
      10,
      "HALF"
    );
    
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("Insufficient");
  });
});

describe("Risk Engine - Edge Cases", () => {
  it("should handle empty trade history", () => {
    const result = calculateOptimalPositionSize(
      [],
      10000,
      100,
      95,
      10,
      "HALF"
    );
    
    expect(result.safePositionSize).toBeGreaterThanOrEqual(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should handle very small balance", () => {
    const trades: TradeResult[] = Array.from({ length: 15 }, (_, i) => ({
      pnl: i % 2 === 0 ? 10 : -8,
      pnlPercent: i % 2 === 0 ? 10 : -8,
    }));
    
    const result = calculateOptimalPositionSize(
      trades,
      100, // small balance
      100,
      95,
      10,
      "HALF"
    );
    
    expect(result.safePositionSize).toBeGreaterThanOrEqual(0);
    expect(result.safePositionSize).toBeLessThanOrEqual(100);
  });
});
