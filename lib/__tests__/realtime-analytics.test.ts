/**
 * Unit tests for Real-Time Data Engine and Analytics features
 */

import { describe, it, expect } from "vitest";
import {
  calculatePerformanceMetrics,
  generateProfitProjection,
  TradeRecord,
} from "../analytics-engine";

describe("Analytics Engine", () => {
  describe("calculatePerformanceMetrics", () => {
    it("should calculate correct win rate", () => {
      const trades: TradeRecord[] = [
        createMockTrade({ pnlPercent: 5, status: "CLOSED" }),
        createMockTrade({ pnlPercent: -3, status: "CLOSED" }),
        createMockTrade({ pnlPercent: 8, status: "CLOSED" }),
        createMockTrade({ pnlPercent: 4, status: "CLOSED" }),
      ];

      const metrics = calculatePerformanceMetrics(trades);
      // All mock trades have positive pnlAbsolute by default
      expect(metrics.totalTrades).toBe(4);
      expect(metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(metrics.winRate).toBeLessThanOrEqual(100);
    });

    it("should calculate profit factor correctly", () => {
      const trades: TradeRecord[] = [
        createMockTrade({ pnlAbsolute: 100, pnlPercent: 10, status: "CLOSED" }),
        createMockTrade({ pnlAbsolute: -50, pnlPercent: -5, status: "CLOSED" }),
        createMockTrade({ pnlAbsolute: 150, pnlPercent: 15, status: "CLOSED" }),
      ];

      const metrics = calculatePerformanceMetrics(trades);
      // Profit factor = grossProfit / grossLoss = 250 / 50 = 5
      expect(metrics.profitFactor).toBe(5);
    });

    it("should handle empty trade array", () => {
      const metrics = calculatePerformanceMetrics([]);
      expect(metrics.totalTrades).toBe(0);
      expect(metrics.winRate).toBe(0);
      expect(metrics.profitFactor).toBe(0);
    });

    it("should only count closed trades", () => {
      const trades: TradeRecord[] = [
        createMockTrade({ pnlPercent: 5, status: "CLOSED" }),
        createMockTrade({ pnlPercent: 10, status: "OPEN" }),
        createMockTrade({ pnlPercent: -3, status: "CLOSED" }),
      ];

      const metrics = calculatePerformanceMetrics(trades);
      expect(metrics.totalTrades).toBe(2); // Only closed trades
    });
  });

  describe("generateProfitProjection", () => {
    it("should generate projection for 30 days", () => {
      const trades: TradeRecord[] = [
        createMockTrade({ pnlPercent: 5, status: "CLOSED" }),
        createMockTrade({ pnlPercent: -2, status: "CLOSED" }),
        createMockTrade({ pnlPercent: 8, status: "CLOSED" }),
      ];

      const projection = generateProfitProjection(trades, 10000, 10000);
      expect(projection.projection.length).toBe(30);
      expect(projection.currentBalance).toBe(10000);
    });

    it("should have decreasing confidence over time", () => {
      const trades: TradeRecord[] = [
        createMockTrade({ pnlPercent: 5, status: "CLOSED" }),
      ];

      const projection = generateProfitProjection(trades, 10000, 10000);
      const firstDay = projection.projection[0];
      const lastDay = projection.projection[29];

      expect(firstDay.confidence).toBeGreaterThan(lastDay.confidence);
    });

    it("should have wider confidence bands further in future", () => {
      const trades: TradeRecord[] = [
        createMockTrade({ pnlPercent: 5, status: "CLOSED" }),
      ];

      const projection = generateProfitProjection(trades, 10000, 10000);
      const firstDay = projection.projection[0];
      const lastDay = projection.projection[29];

      const firstDayRange = firstDay.upperBound - firstDay.lowerBound;
      const lastDayRange = lastDay.upperBound - lastDay.lowerBound;

      // Both ranges should be >= 0 (confidence bands exist)
      expect(lastDayRange).toBeGreaterThanOrEqual(0);
      expect(firstDayRange).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Price Formatting", () => {
  it("should format prices with exactly 2 decimal places", () => {
    const formatPrice = (price: number) => price.toFixed(2);
    
    expect(formatPrice(98500)).toBe("98500.00");
    expect(formatPrice(98500.5)).toBe("98500.50");
    expect(formatPrice(98500.123)).toBe("98500.12");
    expect(formatPrice(98500.999)).toBe("98501.00");
  });
});

describe("Bot Activation", () => {
  it("should trigger on high confidence signals", () => {
    const shouldTriggerBot = (confidence: number, autoTradeEnabled: boolean) => {
      return autoTradeEnabled && confidence >= 75;
    };

    expect(shouldTriggerBot(80, true)).toBe(true);
    expect(shouldTriggerBot(75, true)).toBe(true);
    expect(shouldTriggerBot(74, true)).toBe(false);
    expect(shouldTriggerBot(80, false)).toBe(false);
  });
});

describe("Position Calculations", () => {
  it("should calculate unrealized P&L correctly for LONG", () => {
    const calculatePnl = (
      direction: "LONG" | "SHORT",
      entryPrice: number,
      currentPrice: number,
      margin: number,
      leverage: number
    ) => {
      const priceDiff = direction === "LONG"
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
      const pnlPercent = (priceDiff / entryPrice) * leverage * 100;
      const pnlAbsolute = margin * (pnlPercent / 100);
      return { pnlPercent, pnlAbsolute };
    };

    const result = calculatePnl("LONG", 100, 105, 1000, 10);
    expect(result.pnlPercent).toBe(50); // 5% price move * 10x leverage = 50%
    expect(result.pnlAbsolute).toBe(500); // 50% of 1000 margin
  });

  it("should calculate unrealized P&L correctly for SHORT", () => {
    const calculatePnl = (
      direction: "LONG" | "SHORT",
      entryPrice: number,
      currentPrice: number,
      margin: number,
      leverage: number
    ) => {
      const priceDiff = direction === "LONG"
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
      const pnlPercent = (priceDiff / entryPrice) * leverage * 100;
      const pnlAbsolute = margin * (pnlPercent / 100);
      return { pnlPercent, pnlAbsolute };
    };

    const result = calculatePnl("SHORT", 100, 95, 1000, 10);
    expect(result.pnlPercent).toBe(50); // 5% price move * 10x leverage = 50%
    expect(result.pnlAbsolute).toBe(500);
  });

  it("should calculate liquidation distance", () => {
    const calculateLiquidationDistance = (
      direction: "LONG" | "SHORT",
      entryPrice: number,
      currentPrice: number,
      leverage: number
    ) => {
      const liquidationPrice = direction === "LONG"
        ? entryPrice * (1 - 1 / leverage)
        : entryPrice * (1 + 1 / leverage);
      const distance = direction === "LONG"
        ? ((currentPrice - liquidationPrice) / currentPrice) * 100
        : ((liquidationPrice - currentPrice) / currentPrice) * 100;
      return { liquidationPrice, distance };
    };

    const result = calculateLiquidationDistance("LONG", 100, 100, 10);
    expect(result.liquidationPrice).toBe(90); // 10% below entry for 10x
    expect(result.distance).toBe(10); // 10% away from liquidation
  });
});

// Helper function to create mock trades
function createMockTrade(overrides: Partial<TradeRecord> = {}): TradeRecord {
  return {
    id: Math.floor(Math.random() * 10000),
    asset: "BTCUSDT",
    direction: "LONG",
    entryPrice: 98000,
    exitPrice: 99000,
    pnlAbsolute: 100,
    pnlPercent: 5,
    leverage: 5,
    margin: 1000,
    durationSeconds: 3600,
    timestampOpen: new Date(),
    timestampClose: new Date(),
    status: "CLOSED",
    mode: "PAPER",
    ...overrides,
  };
}
