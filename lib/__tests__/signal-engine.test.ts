import { describe, it, expect } from "vitest";
import {
  calculateLeverage,
  calculateStopLoss,
  calculateTakeProfit,
  getRiskLevel,
  calculateConfidence,
  generateRationale,
  determineDirection,
  generateSignal,
  formatSignalForClipboard,
  calculatePositionSize,
  DEFAULT_CONFIG,
  type MarketConditions,
} from "../signal-engine";

describe("Signal Engine", () => {
  describe("calculateLeverage", () => {
    it("should calculate leverage based on volatility", () => {
      // 5% daily volatility with safety factor 2 = 1 / (0.05 * 2) = 10x
      const leverage = calculateLeverage(0.05, 2.0);
      expect(leverage).toBe(10);
    });

    it("should clamp leverage to max", () => {
      // Very low volatility would give high leverage, but should be clamped
      const leverage = calculateLeverage(0.01, 1.0, 20);
      expect(leverage).toBeLessThanOrEqual(20);
    });

    it("should clamp leverage to min", () => {
      // Very high volatility would give low leverage, but should be clamped to min
      const leverage = calculateLeverage(0.5, 2.0, 20, 1);
      expect(leverage).toBeGreaterThanOrEqual(1);
    });

    it("should return min leverage for zero volatility", () => {
      const leverage = calculateLeverage(0, 2.0, 20, 1);
      expect(leverage).toBe(1);
    });
  });

  describe("calculateStopLoss", () => {
    it("should calculate SL below entry for LONG", () => {
      const sl = calculateStopLoss(100000, 2000, "LONG", 3.0);
      expect(sl).toBe(94000); // 100000 - (2000 * 3)
    });

    it("should calculate SL above entry for SHORT", () => {
      const sl = calculateStopLoss(100000, 2000, "SHORT", 3.0);
      expect(sl).toBe(106000); // 100000 + (2000 * 3)
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

  describe("calculateConfidence", () => {
    it("should return base score for neutral conditions", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
      };
      const confidence = calculateConfidence(market);
      expect(confidence).toBe(50);
    });

    it("should increase confidence for positive sentiment", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        sentimentScore: 0.8,
      };
      const confidence = calculateConfidence(market);
      expect(confidence).toBeGreaterThan(50);
    });

    it("should increase confidence for oversold RSI", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        rsi: 25,
      };
      const confidence = calculateConfidence(market);
      expect(confidence).toBeGreaterThan(50);
    });
  });

  describe("determineDirection", () => {
    it("should return LONG for bullish conditions", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        sentimentScore: 0.8,
        rsi: 40,
        ema200: 95000,
      };
      expect(determineDirection(market)).toBe("LONG");
    });

    it("should return SHORT for bearish conditions", () => {
      const market: MarketConditions = {
        symbol: "BTCUSDT",
        currentPrice: 100000,
        dailyVolatility: 0.04,
        atr: 2000,
        sentimentScore: -0.8,
        rsi: 75,
        ema200: 105000,
      };
      expect(determineDirection(market)).toBe("SHORT");
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
      expect(signal.direction).toBe("LONG");
      expect(signal.entryPrice).toBe(100000);
      expect(signal.takeProfitPrice).toBeGreaterThan(signal.entryPrice);
      expect(signal.stopLossPrice).toBeLessThan(signal.entryPrice);
      expect(signal.leverageRecommendation).toBeGreaterThan(0);
      expect(signal.riskRewardRatio).toBe(2.0);
      expect(signal.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(signal.confidenceScore).toBeLessThanOrEqual(100);
      expect(signal.rationale).toBeTruthy();
      expect(["LOW", "MEDIUM", "HIGH", "EXTREME"]).toContain(signal.riskLevel);
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

  describe("DEFAULT_CONFIG", () => {
    it("should have sensible defaults", () => {
      expect(DEFAULT_CONFIG.safetyFactor).toBe(2.0);
      expect(DEFAULT_CONFIG.atrMultiplier).toBe(3.0);
      expect(DEFAULT_CONFIG.minRiskRewardRatio).toBe(2.0);
      expect(DEFAULT_CONFIG.maxLeverage).toBe(20);
      expect(DEFAULT_CONFIG.minLeverage).toBe(1);
    });
  });
});
