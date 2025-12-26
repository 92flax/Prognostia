/**
 * Bitget Exchange Integration
 * 
 * Provides unified interface for:
 * - Market data (prices, orderbook, volatility)
 * - Order management (limit, market, post-only)
 * - Position management (leverage, liquidation)
 * - Account balance queries
 */

export interface BitgetCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

export interface OrderBook {
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][];
  timestamp: number;
}

export interface VolatilityData {
  symbol: string;
  dailyVolatility: number; // Percentage (e.g., 0.05 = 5%)
  weeklyVolatility: number;
  atr14: number; // Average True Range
  timestamp: number;
}

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  margin: number;
}

export interface OrderParams {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "post_only";
  quantity: number;
  price?: number; // Required for limit/post_only
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  reduceOnly?: boolean;
}

export interface OrderResult {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  status: "open" | "filled" | "cancelled" | "rejected";
  price: number;
  quantity: number;
  filledQuantity: number;
  avgFillPrice?: number;
  timestamp: number;
}

export interface AccountBalance {
  currency: string;
  available: number;
  frozen: number;
  total: number;
}

/**
 * Calculate volatility-based maximum leverage
 * Formula: MaxLeverage = (1 / DailyVolatility) * SafetyFactor
 * 
 * @param dailyVolatility - Daily price volatility as decimal (e.g., 0.05 = 5%)
 * @param safetyFactor - Safety multiplier (default 0.5 for conservative)
 * @param maxAllowed - Maximum allowed leverage by exchange (default 125x)
 * @returns Recommended maximum leverage
 */
export function calculateVolatilityBasedLeverage(
  dailyVolatility: number,
  safetyFactor: number = 0.5,
  maxAllowed: number = 125
): number {
  if (dailyVolatility <= 0) return 1;
  
  const rawLeverage = (1 / dailyVolatility) * safetyFactor;
  const cappedLeverage = Math.min(rawLeverage, maxAllowed);
  
  // Round down to nearest 0.5
  return Math.floor(cappedLeverage * 2) / 2;
}

/**
 * Calculate liquidation price for a position
 * 
 * @param entryPrice - Entry price of the position
 * @param leverage - Leverage used
 * @param side - Position side (long/short)
 * @param maintenanceMargin - Maintenance margin rate (default 0.5%)
 * @returns Liquidation price
 */
export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: "long" | "short",
  maintenanceMargin: number = 0.005
): number {
  const marginRate = 1 / leverage;
  
  if (side === "long") {
    // Long: Liquidation when price drops enough to consume margin
    return entryPrice * (1 - marginRate + maintenanceMargin);
  } else {
    // Short: Liquidation when price rises enough to consume margin
    return entryPrice * (1 + marginRate - maintenanceMargin);
  }
}

/**
 * Calculate distance to liquidation as percentage
 */
export function calculateLiquidationDistance(
  currentPrice: number,
  liquidationPrice: number,
  side: "long" | "short"
): number {
  if (side === "long") {
    return ((currentPrice - liquidationPrice) / currentPrice) * 100;
  } else {
    return ((liquidationPrice - currentPrice) / currentPrice) * 100;
  }
}

/**
 * Calculate position size based on Kelly Criterion
 * 
 * @param winRate - Historical win rate (0-1)
 * @param avgWin - Average winning trade return
 * @param avgLoss - Average losing trade return (positive number)
 * @param fraction - Kelly fraction (0.25 = quarter, 0.5 = half, 1 = full)
 * @returns Recommended position size as fraction of capital
 */
export function calculateKellyPositionSize(
  winRate: number,
  avgWin: number,
  avgLoss: number,
  fraction: number = 0.5
): number {
  if (avgLoss === 0) return 0;
  
  const b = avgWin / avgLoss; // Win/loss ratio
  const p = winRate;
  const q = 1 - p;
  
  // Kelly formula: f* = (bp - q) / b
  const kellyFraction = (b * p - q) / b;
  
  // Apply fraction (quarter, half, full Kelly)
  const adjustedFraction = kellyFraction * fraction;
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, adjustedFraction));
}

/**
 * Mock Bitget API client for development
 * In production, this would use ccxt or direct API calls
 */
export class BitgetClient {
  private credentials: BitgetCredentials | null = null;
  private isTestnet: boolean = true;

  constructor(credentials?: BitgetCredentials, testnet: boolean = true) {
    this.credentials = credentials || null;
    this.isTestnet = testnet;
  }

  isAuthenticated(): boolean {
    return this.credentials !== null;
  }

  /**
   * Get current ticker for a symbol
   */
  async getTicker(symbol: string): Promise<MarketTicker> {
    // Mock data - in production, call Bitget API
    const mockPrices: Record<string, number> = {
      "BTC/USDT": 98500,
      "ETH/USDT": 3450,
      "SOL/USDT": 185,
    };

    const price = mockPrices[symbol] || 100;
    const change = (Math.random() - 0.5) * 0.1 * price;

    return {
      symbol,
      price,
      change24h: change,
      changePercent24h: (change / price) * 100,
      high24h: price * 1.05,
      low24h: price * 0.95,
      volume24h: Math.random() * 1000000000,
      timestamp: Date.now(),
    };
  }

  /**
   * Get volatility data for a symbol
   */
  async getVolatility(symbol: string): Promise<VolatilityData> {
    // Mock volatility data
    const volatilities: Record<string, number> = {
      "BTC/USDT": 0.045, // 4.5% daily volatility
      "ETH/USDT": 0.055, // 5.5% daily volatility
      "SOL/USDT": 0.08,  // 8% daily volatility
    };

    const dailyVol = volatilities[symbol] || 0.05;

    return {
      symbol,
      dailyVolatility: dailyVol,
      weeklyVolatility: dailyVol * Math.sqrt(7),
      atr14: dailyVol * (mockPrices[symbol] || 100),
      timestamp: Date.now(),
    };
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string, depth: number = 10): Promise<OrderBook> {
    const ticker = await this.getTicker(symbol);
    const price = ticker.price;
    
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    for (let i = 0; i < depth; i++) {
      const bidPrice = price * (1 - 0.0001 * (i + 1));
      const askPrice = price * (1 + 0.0001 * (i + 1));
      const quantity = Math.random() * 10;
      
      bids.push([bidPrice, quantity]);
      asks.push([askPrice, quantity]);
    }

    return { bids, asks, timestamp: Date.now() };
  }

  /**
   * Get account balances
   */
  async getBalances(): Promise<AccountBalance[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    // Mock balances
    return [
      { currency: "USDT", available: 10000, frozen: 0, total: 10000 },
      { currency: "BTC", available: 0.1, frozen: 0, total: 0.1 },
      { currency: "ETH", available: 1.5, frozen: 0, total: 1.5 },
    ];
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<Position[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    // Mock positions - empty by default
    return [];
  }

  /**
   * Place an order
   */
  async placeOrder(params: OrderParams): Promise<OrderResult> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    const ticker = await this.getTicker(params.symbol);
    const fillPrice = params.type === "market" 
      ? ticker.price 
      : params.price || ticker.price;

    return {
      orderId: `mock_${Date.now()}`,
      symbol: params.symbol,
      side: params.side,
      type: params.type,
      status: params.type === "market" ? "filled" : "open",
      price: fillPrice,
      quantity: params.quantity,
      filledQuantity: params.type === "market" ? params.quantity : 0,
      avgFillPrice: params.type === "market" ? fillPrice : undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    return true;
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated");
    }

    if (leverage < 1 || leverage > 125) {
      throw new Error("Leverage must be between 1 and 125");
    }

    return true;
  }
}

// Mock prices for development
const mockPrices: Record<string, number> = {
  "BTC/USDT": 98500,
  "ETH/USDT": 3450,
  "SOL/USDT": 185,
};

// Export singleton instance for app-wide use
export const bitgetClient = new BitgetClient();
