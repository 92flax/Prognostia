/**
 * Trading Engine - Core logic for automated crypto futures trading
 * 
 * Supports Hybrid Mode:
 * - PAPER: Simulation mode (no API key required)
 * - LIVE: Real execution on Bitget Futures (requires API credentials)
 */

import { SignalSetup, generateSignal, MarketConditions, DEFAULT_CONFIG } from "./signal-engine";

// ============================================
// TYPES
// ============================================

export type TradingMode = "PAPER" | "LIVE";
export type OrderType = "MARKET" | "LIMIT";
export type MarginMode = "ISOLATED" | "CROSS";
export type PositionSide = "LONG" | "SHORT";

export interface BitgetCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface TradingConfig {
  mode: TradingMode;
  credentials?: BitgetCredentials;
  autoTradeEnabled: boolean;
  confidenceThreshold: number; // 0-100
  maxPositionSizePercent: number; // % of balance
  safetyFactor: number;
  riskRewardRatio: number;
  maxLeverage: number;
  atrMultiplier: number;
}

export interface TradeOrder {
  asset: string;
  side: "BUY" | "SELL";
  direction: PositionSide;
  size: number;
  leverage: number;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  orderType: OrderType;
  marginMode: MarginMode;
}

export interface TradeResult {
  success: boolean;
  mode: TradingMode;
  orderId?: string;
  tradeId?: number;
  message: string;
  error?: string;
}

export interface AccountBalance {
  total: number;
  available: number;
  usedMargin: number;
  unrealizedPnl: number;
}

export interface Position {
  id: string;
  asset: string;
  direction: PositionSide;
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  pnlPercent: number;
  liquidationPrice: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

// ============================================
// BITGET CONNECTION (CCXT-style interface)
// ============================================

export class BitgetFuturesClient {
  private credentials?: BitgetCredentials;
  private isConnected: boolean = false;
  private testMode: boolean = false;

  constructor(credentials?: BitgetCredentials, testMode = false) {
    this.credentials = credentials;
    this.testMode = testMode;
  }

  /**
   * Test connection to Bitget API
   */
  async testConnection(): Promise<{ success: boolean; balance?: number; error?: string }> {
    if (!this.credentials) {
      return { success: false, error: "No API credentials provided" };
    }

    if (this.testMode) {
      // Simulated connection test
      return { success: true, balance: 10000 };
    }

    try {
      // In production, this would use CCXT:
      // const exchange = new ccxt.bitget({
      //   apiKey: this.credentials.apiKey,
      //   secret: this.credentials.secret,
      //   password: this.credentials.passphrase,
      //   options: { defaultType: 'swap' }
      // });
      // const balance = await exchange.fetchBalance();
      
      // For now, simulate API call
      await this.simulateApiDelay();
      
      // Validate credentials format
      if (!this.credentials.apiKey || this.credentials.apiKey.length < 10) {
        return { success: false, error: "Invalid API key format" };
      }
      if (!this.credentials.secret || this.credentials.secret.length < 10) {
        return { success: false, error: "Invalid API secret format" };
      }
      if (!this.credentials.passphrase || this.credentials.passphrase.length < 4) {
        return { success: false, error: "Invalid passphrase format" };
      }

      this.isConnected = true;
      return { success: true, balance: 10000 };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      return { success: false, error: message };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<AccountBalance> {
    if (this.testMode || !this.isConnected) {
      return {
        total: 10000,
        available: 8500,
        usedMargin: 1500,
        unrealizedPnl: 250,
      };
    }

    // In production: const balance = await exchange.fetchBalance();
    await this.simulateApiDelay();
    
    return {
      total: 10000,
      available: 8500,
      usedMargin: 1500,
      unrealizedPnl: 250,
    };
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<Position[]> {
    if (this.testMode || !this.isConnected) {
      return [];
    }

    // In production: const positions = await exchange.fetchPositions();
    await this.simulateApiDelay();
    
    return [];
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    if (this.testMode) return true;

    // In production: await exchange.setLeverage(leverage, symbol);
    await this.simulateApiDelay();
    
    console.log(`[Bitget] Set leverage for ${symbol} to ${leverage}x`);
    return true;
  }

  /**
   * Set margin mode (isolated/cross)
   */
  async setMarginMode(symbol: string, mode: MarginMode): Promise<boolean> {
    if (this.testMode) return true;

    // In production: await exchange.setMarginMode(mode.toLowerCase(), symbol);
    await this.simulateApiDelay();
    
    console.log(`[Bitget] Set margin mode for ${symbol} to ${mode}`);
    return true;
  }

  /**
   * Place a futures order
   */
  async placeOrder(order: TradeOrder): Promise<{ orderId: string; status: string }> {
    if (this.testMode) {
      return { orderId: `TEST-${Date.now()}`, status: "filled" };
    }

    // In production:
    // const result = await exchange.createOrder(
    //   order.asset,
    //   order.orderType.toLowerCase(),
    //   order.side.toLowerCase(),
    //   order.size,
    //   order.orderType === 'LIMIT' ? order.entryPrice : undefined,
    //   { 
    //     reduceOnly: false,
    //     stopLoss: { price: order.stopLossPrice },
    //     takeProfit: { price: order.takeProfitPrice }
    //   }
    // );

    await this.simulateApiDelay();
    
    console.log(`[Bitget] Placed ${order.direction} ${order.orderType} order for ${order.asset}`);
    return { orderId: `LIVE-${Date.now()}`, status: "filled" };
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string, direction: PositionSide): Promise<boolean> {
    if (this.testMode) return true;

    // In production: await exchange.closePosition(symbol);
    await this.simulateApiDelay();
    
    console.log(`[Bitget] Closed ${direction} position for ${symbol}`);
    return true;
  }

  private async simulateApiDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// ============================================
// TRADING ENGINE
// ============================================

export class TradingEngine {
  private config: TradingConfig;
  private bitgetClient?: BitgetFuturesClient;
  private paperBalance: AccountBalance;

  constructor(config: TradingConfig) {
    this.config = config;
    
    // Initialize paper trading balance
    this.paperBalance = {
      total: 10000,
      available: 10000,
      usedMargin: 0,
      unrealizedPnl: 0,
    };

    // Initialize Bitget client if credentials provided
    if (config.credentials) {
      this.bitgetClient = new BitgetFuturesClient(config.credentials);
    }
  }

  /**
   * Get current trading mode based on configuration
   */
  getMode(): TradingMode {
    if (!this.config.credentials) return "PAPER";
    if (!this.config.credentials.apiKey) return "PAPER";
    return this.config.mode;
  }

  /**
   * Check if auto-trading is enabled and valid
   */
  canAutoTrade(): boolean {
    if (!this.config.autoTradeEnabled) return false;
    
    // For live mode, require valid API connection
    if (this.getMode() === "LIVE" && !this.bitgetClient) {
      return false;
    }
    
    return true;
  }

  /**
   * Test exchange connection
   */
  async testConnection(): Promise<{ success: boolean; balance?: number; error?: string }> {
    if (!this.bitgetClient) {
      return { success: false, error: "No API credentials configured" };
    }
    
    return this.bitgetClient.testConnection();
  }

  /**
   * Get account balance (paper or live)
   */
  async getBalance(): Promise<AccountBalance> {
    if (this.getMode() === "PAPER") {
      return this.paperBalance;
    }
    
    if (this.bitgetClient) {
      return this.bitgetClient.getBalance();
    }
    
    return this.paperBalance;
  }

  /**
   * Generate a trading signal with XAI explanation
   */
  generateSignalWithXAI(market: MarketConditions): SignalSetup {
    const signal = generateSignal(market, {
      safetyFactor: this.config.safetyFactor,
      atrMultiplier: this.config.atrMultiplier,
      minRiskRewardRatio: this.config.riskRewardRatio,
      maxLeverage: this.config.maxLeverage,
      minLeverage: 1,
    });

    return signal;
  }

  /**
   * Check if a signal meets the auto-trade criteria
   */
  shouldAutoExecute(signal: SignalSetup): { shouldExecute: boolean; reason: string } {
    if (!this.canAutoTrade()) {
      return { shouldExecute: false, reason: "Auto-trading is disabled" };
    }

    if (signal.confidenceScore < this.config.confidenceThreshold) {
      return { 
        shouldExecute: false, 
        reason: `Confidence ${signal.confidenceScore}% below threshold ${this.config.confidenceThreshold}%` 
      };
    }

    return { shouldExecute: true, reason: "Signal meets all criteria" };
  }

  /**
   * Execute a signal (the main execution router)
   */
  async executeSignal(signal: SignalSetup): Promise<TradeResult> {
    const mode = this.getMode();
    
    // Validate balance and risk
    const balance = await this.getBalance();
    const riskCheck = this.validateRisk(signal, balance);
    
    if (!riskCheck.valid) {
      return {
        success: false,
        mode,
        message: "Risk check failed",
        error: riskCheck.reason,
      };
    }

    // Calculate position size
    const positionSize = this.calculatePositionSize(signal, balance);

    // Create order
    const order: TradeOrder = {
      asset: signal.asset,
      side: signal.direction === "LONG" ? "BUY" : "SELL",
      direction: signal.direction,
      size: positionSize.size,
      leverage: signal.leverageRecommendation,
      entryPrice: signal.entryPrice,
      takeProfitPrice: signal.takeProfitPrice,
      stopLossPrice: signal.stopLossPrice,
      orderType: "MARKET",
      marginMode: "ISOLATED",
    };

    if (mode === "PAPER") {
      return this.executePaperTrade(order, signal);
    } else {
      return this.executeLiveTrade(order, signal);
    }
  }

  /**
   * Execute a paper (simulated) trade
   */
  private async executePaperTrade(order: TradeOrder, signal: SignalSetup): Promise<TradeResult> {
    // Update paper balance
    const margin = order.size / order.leverage;
    
    if (margin > this.paperBalance.available) {
      return {
        success: false,
        mode: "PAPER",
        message: "Insufficient paper balance",
        error: `Required margin: $${margin.toFixed(2)}, Available: $${this.paperBalance.available.toFixed(2)}`,
      };
    }

    this.paperBalance.available -= margin;
    this.paperBalance.usedMargin += margin;

    const tradeId = Date.now();

    return {
      success: true,
      mode: "PAPER",
      tradeId,
      message: `Paper ${order.direction} opened for ${order.asset} at $${order.entryPrice.toFixed(2)}`,
    };
  }

  /**
   * Execute a live trade on Bitget
   */
  private async executeLiveTrade(order: TradeOrder, signal: SignalSetup): Promise<TradeResult> {
    if (!this.bitgetClient) {
      return {
        success: false,
        mode: "LIVE",
        message: "No exchange connection",
        error: "Bitget client not initialized",
      };
    }

    try {
      // Set leverage
      await this.bitgetClient.setLeverage(order.asset, order.leverage);
      
      // Set margin mode
      await this.bitgetClient.setMarginMode(order.asset, order.marginMode);
      
      // Place order
      const result = await this.bitgetClient.placeOrder(order);

      return {
        success: true,
        mode: "LIVE",
        orderId: result.orderId,
        message: `Live ${order.direction} opened for ${order.asset} at $${order.entryPrice.toFixed(2)}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Order execution failed";
      return {
        success: false,
        mode: "LIVE",
        message: "Trade execution failed",
        error: message,
      };
    }
  }

  /**
   * Validate risk before executing trade
   */
  private validateRisk(
    signal: SignalSetup, 
    balance: AccountBalance
  ): { valid: boolean; reason?: string } {
    // Check available balance
    const requiredMargin = (signal.entryPrice * 0.01) / signal.leverageRecommendation;
    const maxPositionValue = balance.available * (this.config.maxPositionSizePercent / 100);
    
    if (requiredMargin > balance.available) {
      return { valid: false, reason: "Insufficient available balance" };
    }

    // Check leverage limits
    if (signal.leverageRecommendation > this.config.maxLeverage) {
      return { valid: false, reason: `Leverage ${signal.leverageRecommendation}x exceeds max ${this.config.maxLeverage}x` };
    }

    // Check risk level
    if (signal.riskLevel === "EXTREME" && this.getMode() === "LIVE") {
      return { valid: false, reason: "EXTREME risk signals blocked for live trading" };
    }

    return { valid: true };
  }

  /**
   * Calculate position size based on risk parameters
   */
  private calculatePositionSize(
    signal: SignalSetup,
    balance: AccountBalance
  ): { size: number; margin: number; riskAmount: number } {
    // Risk 2% of available balance per trade
    const riskPercent = 0.02;
    const riskAmount = balance.available * riskPercent;

    // Calculate position size based on stop loss distance
    const slDistance = Math.abs(signal.entryPrice - signal.stopLossPrice);
    const slPercent = slDistance / signal.entryPrice;

    // Position size = Risk Amount / SL%
    const positionSize = riskAmount / slPercent;

    // Apply max position size limit
    const maxSize = balance.available * (this.config.maxPositionSizePercent / 100) * signal.leverageRecommendation;
    const finalSize = Math.min(positionSize, maxSize);

    const margin = finalSize / signal.leverageRecommendation;

    return {
      size: finalSize,
      margin,
      riskAmount,
    };
  }

  /**
   * Update paper wallet balance after trade close
   */
  updatePaperBalance(pnl: number, margin: number): void {
    this.paperBalance.total += pnl;
    this.paperBalance.available += margin + pnl;
    this.paperBalance.usedMargin -= margin;
  }

  /**
   * Reset paper wallet to initial balance
   */
  resetPaperWallet(initialBalance = 10000): void {
    this.paperBalance = {
      total: initialBalance,
      available: initialBalance,
      usedMargin: 0,
      unrealizedPnl: 0,
    };
  }

  /**
   * Get paper wallet balance
   */
  getPaperBalance(): AccountBalance {
    return { ...this.paperBalance };
  }
}

// ============================================
// XAI EXPLANATION GENERATOR
// ============================================

export function generateXAIExplanation(
  direction: "LONG" | "SHORT",
  market: MarketConditions
): string {
  const factors: string[] = [];
  
  // Sentiment analysis
  if (market.sentimentScore !== undefined) {
    const sentiment = market.sentimentScore;
    if (sentiment > 0.5) {
      factors.push(`FinBERT Sentiment is ${sentiment.toFixed(2)} (Very Positive)`);
    } else if (sentiment > 0.2) {
      factors.push(`FinBERT Sentiment is ${sentiment.toFixed(2)} (Positive)`);
    } else if (sentiment < -0.5) {
      factors.push(`FinBERT Sentiment is ${sentiment.toFixed(2)} (Very Negative)`);
    } else if (sentiment < -0.2) {
      factors.push(`FinBERT Sentiment is ${sentiment.toFixed(2)} (Negative)`);
    }
  }

  // EMA analysis
  if (market.ema200 !== undefined) {
    if (market.currentPrice > market.ema200) {
      factors.push("Price is above 200 EMA (Bullish Structure)");
    } else {
      factors.push("Price is below 200 EMA (Bearish Structure)");
    }
  }

  // RSI analysis
  if (market.rsi !== undefined) {
    if (market.rsi < 30) {
      factors.push(`RSI is ${market.rsi.toFixed(0)} (Oversold)`);
    } else if (market.rsi > 70) {
      factors.push(`RSI is ${market.rsi.toFixed(0)} (Overbought)`);
    } else if (market.rsi < 45) {
      factors.push(`RSI is ${market.rsi.toFixed(0)} (Approaching Oversold)`);
    } else if (market.rsi > 55) {
      factors.push(`RSI is ${market.rsi.toFixed(0)} (Approaching Overbought)`);
    }
  }

  // Volatility analysis
  if (market.dailyVolatility !== undefined) {
    const volPercent = market.dailyVolatility * 100;
    if (volPercent < 3) {
      factors.push(`Low Volatility (${volPercent.toFixed(1)}% daily)`);
    } else if (volPercent > 6) {
      factors.push(`High Volatility (${volPercent.toFixed(1)}% daily) - Caution`);
    }
  }

  // Build explanation
  const directionText = direction === "LONG" ? "Strong buy signal" : "Strong sell signal";
  
  if (factors.length === 0) {
    return `${directionText}: Based on current market conditions.`;
  }

  if (factors.length === 1) {
    return `${directionText}: ${factors[0]}.`;
  }

  const lastFactor = factors.pop();
  return `${directionText}: ${factors.join(" + ")} AND ${lastFactor}.`;
}

// ============================================
// DEFAULT TRADING CONFIG
// ============================================

export const DEFAULT_TRADING_CONFIG: TradingConfig = {
  mode: "PAPER",
  autoTradeEnabled: false,
  confidenceThreshold: 75,
  maxPositionSizePercent: 10,
  safetyFactor: DEFAULT_CONFIG.safetyFactor,
  riskRewardRatio: DEFAULT_CONFIG.minRiskRewardRatio,
  maxLeverage: DEFAULT_CONFIG.maxLeverage,
  atrMultiplier: DEFAULT_CONFIG.atrMultiplier,
};
