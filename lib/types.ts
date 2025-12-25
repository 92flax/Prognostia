// Trading data types for AQTE

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  sparkline: number[];
}

export interface PortfolioSummary {
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  quantity: number;
  price: number;
  total: number;
  timestamp: Date;
  status: 'pending' | 'filled' | 'cancelled';
}

export interface AISignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timestamp: Date;
  source: 'timesfm' | 'finbert' | 'combined';
}

export interface PriceForecast {
  symbol: string;
  currentPrice: number;
  predictions: {
    horizon: '24h' | '7d' | '30d';
    predicted: number;
    lower: number;
    upper: number;
    confidence: number;
  }[];
  generatedAt: Date;
}

export interface SentimentData {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  headlines: {
    text: string;
    score: number;
    source: string;
    timestamp: Date;
  }[];
  trend: number[]; // Historical sentiment scores
}

export interface KellyMetrics {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitLossRatio: number;
  optimalFraction: number;
  halfKellyFraction: number;
  maxLeverage: number;
  recommendedSize: number;
}

export interface VolatilityMetrics {
  currentVolatility: number; // Annualized
  targetVolatility: number;
  rollingVolatility: number[];
  positionAdjustment: number; // Multiplier
}

export interface ChandelierExit {
  atr: number;
  atrPeriod: number;
  multiplier: number;
  longStop: number;
  shortStop: number;
  currentPrice: number;
}

export interface ExchangeConnection {
  id: string;
  name: 'binance' | 'alpaca';
  displayName: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  error?: string;
}

export interface RiskSettings {
  maxLeverage: number;
  targetVolatility: number;
  atrMultiplier: number;
  useHalfKelly: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP';
  notifications: boolean;
}
