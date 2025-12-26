import { describe, it, expect } from "vitest";

describe("Wallet Balance & Position Sizing", () => {
  describe("Wallet Balance Calculations", () => {
    it("should calculate utilization percentage correctly", () => {
      const totalBalance = 10000;
      const lockedBalance = 2500;
      const utilization = Math.round((lockedBalance / totalBalance) * 100);
      expect(utilization).toBe(25);
    });

    it("should handle zero balance", () => {
      const totalBalance = 0;
      const lockedBalance = 0;
      const utilization = totalBalance > 0 
        ? Math.round((lockedBalance / totalBalance) * 100) 
        : 0;
      expect(utilization).toBe(0);
    });

    it("should calculate available balance", () => {
      const totalBalance = 10000;
      const lockedBalance = 3000;
      const availableBalance = totalBalance - lockedBalance;
      expect(availableBalance).toBe(7000);
    });

    it("should track balance after trade execution", () => {
      let availableBalance = 10000;
      let lockedBalance = 0;
      
      // Execute trade with $500 margin
      const tradeMargin = 500;
      availableBalance -= tradeMargin;
      lockedBalance += tradeMargin;
      
      expect(availableBalance).toBe(9500);
      expect(lockedBalance).toBe(500);
    });
  });

  describe("Position Size Calculations", () => {
    it("should calculate position size from percentage", () => {
      const availableBalance = 10000;
      const percent = 25;
      const positionSize = Math.floor((availableBalance * percent) / 100);
      expect(positionSize).toBe(2500);
    });

    it("should calculate position value with leverage", () => {
      const marginAmount = 1000;
      const leverage = 10;
      const positionValue = marginAmount * leverage;
      expect(positionValue).toBe(10000);
    });

    it("should calculate position size in asset units", () => {
      const marginAmount = 1000;
      const leverage = 10;
      const assetPrice = 98000;
      const positionSizeAsset = (marginAmount * leverage) / assetPrice;
      expect(positionSizeAsset).toBeCloseTo(0.102, 3);
    });

    it("should validate position size against available balance", () => {
      const availableBalance = 5000;
      const requestedSize = 6000;
      const exceedsBalance = requestedSize > availableBalance;
      expect(exceedsBalance).toBe(true);
    });

    it("should not exceed available balance", () => {
      const availableBalance = 5000;
      const requestedSize = 4000;
      const exceedsBalance = requestedSize > availableBalance;
      expect(exceedsBalance).toBe(false);
    });
  });

  describe("Percentage Options", () => {
    const PERCENTAGE_OPTIONS = [25, 50, 75, 100];
    const availableBalance = 10000;

    it("should calculate 25% correctly", () => {
      const size = Math.floor((availableBalance * 25) / 100);
      expect(size).toBe(2500);
    });

    it("should calculate 50% correctly", () => {
      const size = Math.floor((availableBalance * 50) / 100);
      expect(size).toBe(5000);
    });

    it("should calculate 75% correctly", () => {
      const size = Math.floor((availableBalance * 75) / 100);
      expect(size).toBe(7500);
    });

    it("should calculate 100% correctly", () => {
      const size = Math.floor((availableBalance * 100) / 100);
      expect(size).toBe(10000);
    });

    it("should have all expected percentage options", () => {
      expect(PERCENTAGE_OPTIONS).toEqual([25, 50, 75, 100]);
    });
  });

  describe("Risk/Reward Calculations", () => {
    it("should calculate max loss correctly", () => {
      const positionSize = 1000;
      const entryPrice = 98000;
      const stopLossPrice = 95000;
      const riskPercent = Math.abs(entryPrice - stopLossPrice) / entryPrice;
      const maxLoss = positionSize * riskPercent;
      expect(maxLoss).toBeCloseTo(30.61, 1);
    });

    it("should calculate target profit correctly", () => {
      const positionSize = 1000;
      const entryPrice = 98000;
      const takeProfitPrice = 104000;
      const rewardPercent = Math.abs(takeProfitPrice - entryPrice) / entryPrice;
      const targetProfit = positionSize * rewardPercent;
      expect(targetProfit).toBeCloseTo(61.22, 1);
    });

    it("should maintain 2:1 risk-reward ratio", () => {
      const entryPrice = 98000;
      const stopLossPrice = 95000;
      const riskDistance = Math.abs(entryPrice - stopLossPrice);
      const takeProfitPrice = entryPrice + (riskDistance * 2);
      
      expect(takeProfitPrice).toBe(104000);
      
      const riskPercent = riskDistance / entryPrice;
      const rewardPercent = (takeProfitPrice - entryPrice) / entryPrice;
      const rrRatio = rewardPercent / riskPercent;
      
      expect(rrRatio).toBeCloseTo(2, 1);
    });
  });

  describe("Trade Execution Flow", () => {
    it("should update balances after paper trade", () => {
      let totalBalance = 10000;
      let availableBalance = 10000;
      let lockedBalance = 0;
      
      // Execute paper trade
      const tradeSize = 500;
      availableBalance -= tradeSize;
      lockedBalance += tradeSize;
      
      expect(totalBalance).toBe(10000); // Total unchanged
      expect(availableBalance).toBe(9500);
      expect(lockedBalance).toBe(500);
    });

    it("should prevent trade if insufficient balance", () => {
      const availableBalance = 100;
      const requestedSize = 500;
      const canExecute = requestedSize <= availableBalance;
      expect(canExecute).toBe(false);
    });

    it("should allow trade if sufficient balance", () => {
      const availableBalance = 1000;
      const requestedSize = 500;
      const canExecute = requestedSize <= availableBalance;
      expect(canExecute).toBe(true);
    });

    it("should require position size > 0", () => {
      const positionSize = 0;
      const canExecute = positionSize > 0;
      expect(canExecute).toBe(false);
    });
  });

  describe("Margin Calculations", () => {
    it("should calculate margin required", () => {
      const positionSize = 1000; // USDT
      const marginRequired = positionSize; // In isolated margin, margin = position size
      expect(marginRequired).toBe(1000);
    });

    it("should calculate effective position with leverage", () => {
      const margin = 1000;
      const leverage = 10;
      const effectivePosition = margin * leverage;
      expect(effectivePosition).toBe(10000);
    });

    it("should calculate liquidation price for LONG", () => {
      const entryPrice = 98000;
      const leverage = 10;
      const maintenanceMarginRate = 0.005; // 0.5%
      // Simplified liquidation formula
      const liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
      expect(liquidationPrice).toBeCloseTo(88690, -1);
    });

    it("should calculate liquidation price for SHORT", () => {
      const entryPrice = 98000;
      const leverage = 10;
      const maintenanceMarginRate = 0.005; // 0.5%
      // Simplified liquidation formula
      const liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
      expect(liquidationPrice).toBeCloseTo(107310, -1);
    });
  });
});
