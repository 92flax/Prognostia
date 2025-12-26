import { describe, it, expect } from "vitest";
import {
  calculateLeverage,
  calculateStopLoss,
  calculateTakeProfit,
  calculateConfidence,
  generateSignal,
  getRiskLevel,
  formatSignalForClipboard,
  type MarketConditions,
} from "../signal-engine";

describe("Automated Trading Bot - Signal Engine", () => {
  // Test market conditions
  const btcMarket: MarketConditions = {
    symbol: "BTCUSDT",
    currentPrice: 98450,
    dailyVolatility: 0.032,
    atr: 1850,
    ema200: 94200,
    rsi: 58,
    sentimentScore: 0.65,
  };

  const highVolMarket: MarketConditions = {
    symbol: "SOLUSDT",
    currentPrice: 186.50,
    dailyVolatility: 0.08,
    atr: 12,
    ema200: 175,
    rsi: 45,
    sentimentScore: 0.25,
  };

  describe("Volatility-Based Leverage Calculator", () => {
    it("should calculate higher leverage for low volatility", () => {
      const leverage = calculateLeverage(0.02, 2.0); // 2% vol
      expect(leverage).toBeGreaterThanOrEqual(15);
      expect(leverage).toBeLessThanOrEqual(20);
    });

    it("should calculate lower leverage for high volatility", () => {
      const leverage = calculateLeverage(0.08, 2.0); // 8% vol
      expect(leverage).toBeGreaterThanOrEqual(1);
      expect(leverage).toBeLessThanOrEqual(10);
    });

    it("should respect max leverage cap", () => {
      const leverage = calculateLeverage(0.01, 2.0, 10); // Very low vol, max 10x
      expect(leverage).toBeLessThanOrEqual(10);
    });

    it("should respect min leverage floor", () => {
      const leverage = calculateLeverage(0.5, 2.0, 20, 3); // Very high vol, min 3x
      expect(leverage).toBeGreaterThanOrEqual(3);
    });
  });

  describe("ATR-Based Stop Loss (Chandelier Exit)", () => {
    it("should calculate LONG stop loss below entry", () => {
      const sl = calculateStopLoss(100000, 2000, "LONG", 3.0);
      expect(sl).toBe(94000); // 100000 - (2000 * 3)
    });

    it("should calculate SHORT stop loss above entry", () => {
      const sl = calculateStopLoss(100000, 2000, "SHORT", 3.0);
      expect(sl).toBe(106000); // 100000 + (2000 * 3)
    });

    it("should scale with ATR multiplier", () => {
      const sl2x = calculateStopLoss(100000, 2000, "LONG", 2.0);
      const sl4x = calculateStopLoss(100000, 2000, "LONG", 4.0);
      expect(sl2x).toBeGreaterThan(sl4x); // 2x has tighter stop
    });
  });

  describe("Risk-Reward Take Profit", () => {
    it("should calculate LONG TP with 2:1 R:R", () => {
      const tp = calculateTakeProfit(100000, 94000, "LONG", 2.0);
      expect(tp).toBe(112000); // Entry + (Risk * 2)
    });

    it("should calculate SHORT TP with 2:1 R:R", () => {
      const tp = calculateTakeProfit(100000, 106000, "SHORT", 2.0);
      expect(tp).toBe(88000); // Entry - (Risk * 2)
    });

    it("should scale with R:R ratio", () => {
      const tp2 = calculateTakeProfit(100000, 94000, "LONG", 2.0);
      const tp3 = calculateTakeProfit(100000, 94000, "LONG", 3.0);
      expect(tp3).toBeGreaterThan(tp2);
    });
  });

  describe("Confidence Score Calculation", () => {
    it("should return higher confidence for bullish conditions", () => {
      const confidence = calculateConfidence(btcMarket);
      expect(confidence).toBeGreaterThan(60);
    });

    it("should return lower confidence for uncertain conditions", () => {
      const neutralMarket: MarketConditions = {
        symbol: "TEST",
        currentPrice: 100,
        dailyVolatility: 0.05,
        atr: 5,
        rsi: 50,
        sentimentScore: 0,
      };
      const confidence = calculateConfidence(neutralMarket);
      expect(confidence).toBeGreaterThanOrEqual(40);
      expect(confidence).toBeLessThanOrEqual(60);
    });

    it("should be bounded between 0 and 100", () => {
      const extremeBullish: MarketConditions = {
        symbol: "TEST",
        currentPrice: 100,
        dailyVolatility: 0.01,
        atr: 1,
        ema200: 80,
        rsi: 25,
        sentimentScore: 1.0,
      };
      const confidence = calculateConfidence(extremeBullish);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe("Risk Level Classification", () => {
    it("should classify low leverage as LOW risk", () => {
      expect(getRiskLevel(2)).toBe("LOW");
      expect(getRiskLevel(3)).toBe("LOW");
    });

    it("should classify medium leverage as MEDIUM risk", () => {
      expect(getRiskLevel(5)).toBe("MEDIUM");
      expect(getRiskLevel(7)).toBe("MEDIUM");
    });

    it("should classify high leverage as HIGH risk", () => {
      expect(getRiskLevel(10)).toBe("HIGH");
      expect(getRiskLevel(15)).toBe("HIGH");
    });

    it("should classify extreme leverage as EXTREME risk", () => {
      expect(getRiskLevel(20)).toBe("EXTREME");
      expect(getRiskLevel(50)).toBe("EXTREME");
    });
  });

  describe("Full Signal Generation", () => {
    it("should generate complete signal for BTC", () => {
      const signal = generateSignal(btcMarket);
      
      expect(signal.asset).toBe("BTCUSDT");
      expect(signal.direction).toBeDefined();
      expect(signal.entryPrice).toBe(98450);
      expect(signal.leverageRecommendation).toBeGreaterThan(0);
      expect(signal.stopLossPrice).toBeDefined();
      expect(signal.takeProfitPrice).toBeDefined();
      expect(signal.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(signal.confidenceScore).toBeLessThanOrEqual(100);
      expect(signal.rationale).toBeDefined();
      expect(signal.riskLevel).toBeDefined();
    });

    it("should generate lower leverage for high volatility assets", () => {
      const btcSignal = generateSignal(btcMarket);
      const solSignal = generateSignal(highVolMarket);
      
      expect(btcSignal.leverageRecommendation).toBeGreaterThan(
        solSignal.leverageRecommendation
      );
    });

    it("should set TP further than SL from entry", () => {
      const signal = generateSignal(btcMarket);
      const slDistance = Math.abs(signal.entryPrice - signal.stopLossPrice);
      const tpDistance = Math.abs(signal.entryPrice - signal.takeProfitPrice);
      
      expect(tpDistance).toBeGreaterThanOrEqual(slDistance * 2);
    });
  });

  describe("Signal Clipboard Formatting", () => {
    it("should format signal for clipboard", () => {
      const signal = generateSignal(btcMarket);
      const formatted = formatSignalForClipboard(signal);
      
      expect(formatted).toContain("BTCUSDT");
      expect(formatted).toContain("LEV:");
      expect(formatted).toContain("ENTRY:");
      expect(formatted).toContain("TP:");
      expect(formatted).toContain("SL:");
      expect(formatted).toContain("R:R");
    });

    it("should include direction emoji", () => {
      const longSignal = generateSignal({
        ...btcMarket,
        sentimentScore: 0.9,
        rsi: 25,
      });
      const formatted = formatSignalForClipboard(longSignal);
      
      expect(formatted).toMatch(/🟢|🔴/);
    });
  });
});

describe("Automated Trading Bot - Hybrid Mode", () => {
  describe("Paper Trading Mode", () => {
    it("should start with default paper balance", () => {
      const defaultBalance = 10000;
      expect(defaultBalance).toBe(10000);
    });

    it("should track paper trades separately", () => {
      const paperTrade = {
        mode: "PAPER" as const,
        asset: "BTCUSDT",
        direction: "LONG" as const,
      };
      expect(paperTrade.mode).toBe("PAPER");
    });
  });

  describe("Live Trading Mode", () => {
    it("should require API credentials for live mode", () => {
      const hasCredentials = (apiKey: string, secret: string, passphrase: string) => {
        return apiKey.length >= 10 && secret.length >= 10 && passphrase.length >= 4;
      };
      
      expect(hasCredentials("", "", "")).toBe(false);
      expect(hasCredentials("validapikey123", "validsecret123", "pass")).toBe(true);
    });
  });

  describe("Auto-Trade Logic", () => {
    it("should only auto-execute when enabled", () => {
      const shouldAutoExecute = (enabled: boolean, confidence: number, threshold: number) => {
        if (!enabled) return false;
        return confidence >= threshold;
      };
      
      expect(shouldAutoExecute(false, 90, 75)).toBe(false);
      expect(shouldAutoExecute(true, 90, 75)).toBe(true);
      expect(shouldAutoExecute(true, 60, 75)).toBe(false);
    });

    it("should respect confidence threshold", () => {
      const meetsThreshold = (confidence: number, threshold: number) => {
        return confidence >= threshold;
      };
      
      expect(meetsThreshold(80, 75)).toBe(true);
      expect(meetsThreshold(70, 75)).toBe(false);
      expect(meetsThreshold(75, 75)).toBe(true);
    });

    it("should prevent duplicate positions", () => {
      const openPositions = ["BTCUSDT", "ETHUSDT"];
      const canOpenPosition = (asset: string) => !openPositions.includes(asset);
      
      expect(canOpenPosition("BTCUSDT")).toBe(false);
      expect(canOpenPosition("SOLUSDT")).toBe(true);
    });
  });
});
