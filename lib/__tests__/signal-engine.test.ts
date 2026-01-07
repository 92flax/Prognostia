import { describe, it, expect } from "vitest";
import {
  calculateLeverage,
  calculateStopLoss,
  calculateTakeProfit,
  getRiskLevel,
  calculateConfidence,
  determineDirection,
  generateSignal,
  formatSignalForClipboard,
  calculatePositionSize,
  calculateHurstExponent,
  detectRegime,
  estimateOUParameters,
  generateOUSignal,
  scaleATRForTimeframe,
  DEFAULT_CONFIG,
  TIMEFRAME_SCALERS,
  type MarketConditions,
} from "../signal-engine";

describe("Signal Engine", () => {
  describe("calculateLeverage", () => {
    it("should calculate leverage based on volatility", () => {
      // 5% daily volatility with safety factor 2 = 1 / (0.05 * 2) = 10x
      const leverage = calculateLeverage(0.05, 2.0, 20, 1, "1d");
      expect(leverage).toBe(10);
    });

    it("should clamp leverage to max", () => {
      const leverage = calculateLeverage(0.01, 1.0, 20, 1, "1d");
      expect(leverage).toBeLessThanOrEqual(20);
    });

    it("should clamp leverage to min", () => {
      const leverage = calculateLeverage(0.5, 2.0, 20, 1, "1d");
      expect(leverage).toBeGreaterThanOrEqual(1);
    });

    it("should return min leverage for zero volatility", () => {
      const leverage = calculateLeverage(0, 2.0, 20, 1, "1d");
      expect(leverage).toBe(1);
    });

    it("should scale leverage for shorter timeframes", () => {
      const dailyLeverage = calculateLeverage(0.05, 2.0, 50, 1, "1d");
      const hourlyLeverage = calculateLeverage(0.05, 2.0, 50, 1, "1h");
      // Shorter timeframes should allow higher leverage (tighter stops)
      expect(hourlyLeverage).toBeGreaterThan(dailyLeverage);
    });
  });

  describe("calculateStopLoss", () => {
    it("should calculate SL below entry for LONG", () => {
      const sl = calculateStopLoss(100000, 2000, "LONG", 3.0, "1d");
      expect(sl).toBe(94000); // 100000 - (2000 * 3)
    });

    it("should calculate SL above entry for SHORT", () => {
      const sl = calculateStopLoss(100000, 2000, "SHORT", 3.0, "1d");
      expect(sl).toBe(106000); // 100000 + (2000 * 3)
    });

    it("should scale ATR for different timeframes", () => {
      const dailySL = calculateStopLoss(100000, 2000, "LONG", 3.0, "1d");
      const hourlySL = calculateStopLoss(100000, 2000, "LONG", 3.0, "1h");
      // Hourly SL should be tighter (closer to entry)
      expect(hourlySL).toBeGreaterThan(dailySL);
    });
  });

  describe("calculateTakeProfit", () => {
    it("should calculate TP above entry for LONG", () => {
      const tp = calculateTakeProfit(100000, 94000, "LONG", 2.0);
      expect(tp).toBe(112000); // 100000 + (6000 * 2)
    });

    it("should calculate TP below entry for SHORT", () => {
      const tp = calculateTakeProfit(100000, 106000, "SHORT", 2.0);
      expect(tp).toBe(88000); // 100000 - (6000 * 2)
    });
  });

  describe("getRiskLevel", () => {
    it("should return LOW for leverage <= 3", () => {
      expect(getRiskLevel(1)).toBe("LOW");
      expect(getRiskLevel(3)).toBe("LOW");
    });

    it("should return MEDIUM for leverage 4-7", () => {
      expect(getRiskLevel(5)).toBe("MEDIUM");
      expect(getRiskLevel(7)).toBe("MEDIUM");
    });

    it("should return HIGH for leverage 8-15", () => {
      expect(getRiskLevel(10)).toBe("HIGH");
      expect(getRiskLevel(15)).toBe("HIGH");
    });

    it("should return EXTREME for leverage > 15", () => {
      expect(getRiskLevel(20)).toBe("EXTREME");
      expect(getRiskLevel(50)).toBe("EXTREME");
    });
  });

  describe("Hurst Exponent", () => {
    it("should return 0.5 for insufficient data", () => {
      const hurst = calculateHurstExponent([100, 101, 102]);
      expect(hurst).toBe(0.5);
    });

    it("should calculate Hurst exponent for trending data", () => {
      // Generate trending data (persistent)
      const trendingPrices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5);
      const hurst = calculateHurstExponent(trendingPrices);
      expect(hurst).toBeGreaterThan(0.4); // Should show persistence
    });

    it("should calculate Hurst exponent for mean-reverting data", () => {
      // Generate mean-reverting data (oscillating)
      const meanRevertingPrices = Array.from(
        { length: 100 },
        (_, i) => 100 + Math.sin(i * 0.5) * 5
      );
      const hurst = calculateHurstExponent(meanRevertingPrices);
      expect(hurst).toBeLessThan(0.6); // Should show anti-persistence
    });
  });

  describe("detectRegime", () => {
    it("should detect MEAN_REVERSION for H < 0.45", () => {
      expect(detectRegime(0.3)).toBe("MEAN_REVERSION");
      expect(detectRegime(0.44)).toBe("MEAN_REVERSION");
    });

    it("should detect TRENDING for H > 0.55", () => {
      expect(detectRegime(0.6)).toBe("TRENDING");
      expect(detectRegime(0.8)).toBe("TRENDING");
    });

    it("should detect RANDOM_WALK for H around 0.5", () => {
      expect(detectRegime(0.5)).toBe("RANDOM_WALK");
      expect(detectRegime(0.52)).toBe("RANDOM_WALK");
    });
  });

  describe("Ornstein-Uhlenbeck Process", () => {
    it("should estimate OU parameters", () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.2) * 5);
      const params = estimateOUParameters(prices);

      expect(params).toHaveProperty("theta");
      expect(params).toHaveProperty("mu");
      expect(params).toHaveProperty("sigma");
      expect(params.theta).toBeGreaterThan(0);
    });

    it("should generate LONG signal when price is below mean", () => {
      const params = { theta: 0.1, mu: 100, sigma: 5 };
      const signal = generateOUSignal(85, params); // 3 sigma below mean
      expect(signal.direction).toBe("LONG");
      expect(signal.zScore).toBeLessThan(-2);
    });

    it("should generate SHORT signal when price is above mean", () => {
      const params = { theta: 0.1, mu: 100, sigma: 5 };
      const signal = generateOUSignal(115, params); // 3 sigma above mean
      expect(signal.direction).toBe("SHORT");
      expect(signal.zScore).toBeGreaterThan(2);
    });

    it("should return null direction when price is near mean", () => {
      const params = { theta: 0.1, mu: 100, sigma: 5 };
      const signal = generateOUSignal(100, params);
      expect(signal.direction).toBeNull();
    });
  });

  describe("scaleATRForTimeframe", () => {
    it("should scale ATR correctly for different timeframes", () => {
      const dailyATR = 2000;
      
      expect(scaleATRForTimeframe(dailyATR, "1d")).toBe(2000);
      expect(scaleATRForTimeframe(dailyATR, "1h")).toBeCloseTo(408, 0);
      expect(scaleATRForTimeframe(dailyATR, "15m")).toBeCloseTo(204, 0);
    });
  });

  describe("calculateConfidence", () => {
    it("should return base score for neutral conditions", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
      };
      const confidence = calculateConfidence(market, "RANDOM_WALK", 0.5);
      expect(confidence).toBeGreaterThanOrEqual(40);
      expect(confidence).toBeLessThanOrEqual(60);
    });

    it("should increase confidence for clear regime", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        sentimentScore: 0.8,
      };
      const confidence = calculateConfidence(market, "TRENDING", 0.7);
      expect(confidence).toBeGreaterThan(50);
    });
  });

  describe("determineDirection", () => {
    it("should return LONG for bullish conditions in trending regime", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        sentimentScore: 0.8,
        rsi: 60,
        ema200: 95000,
      };
      expect(determineDirection(market, "TRENDING")).toBe("LONG");
    });

    it("should use OU signal in mean-reversion regime", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
      };
      const ouSignal = { direction: "SHORT" as const, zScore: 2.5 };
      expect(determineDirection(market, "MEAN_REVERSION", ouSignal)).toBe("SHORT");
    });
  });

  describe("generateSignal", () => {
    it("should generate a complete signal setup", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        sentimentScore: 0.5,
        rsi: 45,
        ema200: 95000,
      };

      const signal = generateSignal(market);

      expect(signal).toHaveProperty("id");
      expect(signal.asset).toBe("BTCUSDT");
      expect(signal.entryPrice).toBe(100000);
      expect(signal.leverageRecommendation).toBeGreaterThan(0);
      expect(signal.riskRewardRatio).toBe(2.0);
      expect(signal.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(signal.confidenceScore).toBeLessThanOrEqual(100);
      expect(signal.rationale).toBeTruthy();
      expect(["LOW", "MEDIUM", "HIGH", "EXTREME"]).toContain(signal.riskLevel);
    });

    it("should include quantitative fields when historical data provided", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        historicalPrices: Array.from({ length: 100 }, (_, i) => 95000 + i * 50),
      };

      const signal = generateSignal(market);

      expect(signal.regime).toBeDefined();
      expect(signal.hurstExponent).toBeDefined();
      expect(signal.timeframe).toBe("15m"); // Default
    });
  });

  describe("formatSignalForClipboard", () => {
    it("should format signal for clipboard", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
      };
      const signal = generateSignal(market);
      const formatted = formatSignalForClipboard(signal);

      expect(formatted).toContain("BTCUSDT");
      expect(formatted).toContain("TRADE SETUP");
      expect(formatted).toContain("LEV:");
      expect(formatted).toContain("ENTRY:");
      expect(formatted).toContain("TP:");
      expect(formatted).toContain("SL:");
      expect(formatted).toContain("#AQTE");
    });
  });

  describe("calculatePositionSize", () => {
    it("should calculate position size based on risk", () => {
      const result = calculatePositionSize(
        10000, // $10,000 account
        0.02, // 2% risk
        100000, // Entry at $100,000
        94000, // SL at $94,000 (6% away)
        10 // 10x leverage
      );

      expect(result.riskAmount).toBe(200); // 2% of 10000
      expect(result.positionSize).toBeCloseTo(3333.33, 0); // 200 / 0.06
      expect(result.margin).toBeCloseTo(333.33, 0); // positionSize / leverage
    });
  });

  describe("TIMEFRAME_SCALERS", () => {
    it("should have correct scaling factors", () => {
      expect(TIMEFRAME_SCALERS["1d"]).toBe(1.0);
      expect(TIMEFRAME_SCALERS["4h"]).toBeCloseTo(0.408, 2);
      expect(TIMEFRAME_SCALERS["1h"]).toBeCloseTo(0.204, 2);
      expect(TIMEFRAME_SCALERS["15m"]).toBeCloseTo(0.102, 2);
      expect(TIMEFRAME_SCALERS["5m"]).toBeCloseTo(0.059, 2);
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("should have sensible defaults", () => {
      expect(DEFAULT_CONFIG.safetyFactor).toBe(2.0);
      expect(DEFAULT_CONFIG.atrMultiplier).toBe(3.0);
      expect(DEFAULT_CONFIG.minRiskRewardRatio).toBe(2.0);
      expect(DEFAULT_CONFIG.maxLeverage).toBe(20);
      expect(DEFAULT_CONFIG.minLeverage).toBe(1);
      expect(DEFAULT_CONFIG.timeframe).toBe("15m");
    });
  });
});
