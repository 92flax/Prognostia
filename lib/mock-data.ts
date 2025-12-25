// Mock data for AQTE trading app demonstration
import type {
  MarketData,
  PortfolioSummary,
  Holding,
  Trade,
  AISignal,
  PriceForecast,
  SentimentData,
  KellyMetrics,
  VolatilityMetrics,
  ChandelierExit,
  ExchangeConnection,
  RiskSettings,
} from './types';

// Generate sparkline data
const generateSparkline = (base: number, volatility: number, points: number = 24): number[] => {
  const data: number[] = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current = current * (1 + (Math.random() - 0.5) * volatility);
    data.push(current);
  }
  return data;
};

export const mockMarketData: MarketData[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 98432.50,
    change24h: 2341.20,
    changePercent24h: 2.44,
    high24h: 99100.00,
    low24h: 95800.00,
    volume24h: 28500000000,
    sparkline: generateSparkline(96000, 0.02),
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3456.78,
    change24h: -45.32,
    changePercent24h: -1.29,
    high24h: 3520.00,
    low24h: 3410.00,
    volume24h: 12300000000,
    sparkline: generateSparkline(3500, 0.015),
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 254.32,
    change24h: 3.45,
    changePercent24h: 1.38,
    high24h: 255.80,
    low24h: 250.10,
    volume24h: 45000000,
    sparkline: generateSparkline(251, 0.008),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 137.85,
    change24h: 5.67,
    changePercent24h: 4.29,
    high24h: 139.20,
    low24h: 131.50,
    volume24h: 89000000,
    sparkline: generateSparkline(132, 0.025),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 421.56,
    change24h: -8.90,
    changePercent24h: -2.07,
    high24h: 435.00,
    low24h: 418.20,
    volume24h: 67000000,
    sparkline: generateSparkline(430, 0.02),
  },
];

export const mockPortfolioSummary: PortfolioSummary = {
  totalValue: 125432.50,
  dailyPnL: 2341.20,
  dailyPnLPercent: 1.90,
  totalReturn: 25432.50,
  totalReturnPercent: 25.43,
};

export const mockHoldings: Holding[] = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    quantity: 0.85,
    avgPrice: 65000,
    currentPrice: 98432.50,
    value: 83667.63,
    pnl: 28417.63,
    pnlPercent: 51.43,
    allocation: 66.7,
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    quantity: 5.2,
    avgPrice: 2800,
    currentPrice: 3456.78,
    value: 17975.26,
    pnl: 3415.26,
    pnlPercent: 23.45,
    allocation: 14.3,
  },
  {
    id: '3',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    quantity: 50,
    avgPrice: 120,
    currentPrice: 137.85,
    value: 6892.50,
    pnl: 892.50,
    pnlPercent: 14.88,
    allocation: 5.5,
  },
  {
    id: '4',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 40,
    avgPrice: 180,
    currentPrice: 254.32,
    value: 10172.80,
    pnl: 2972.80,
    pnlPercent: 41.29,
    allocation: 8.1,
  },
  {
    id: '5',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    quantity: 16,
    avgPrice: 350,
    currentPrice: 421.56,
    value: 6744.96,
    pnl: 1144.96,
    pnlPercent: 20.45,
    allocation: 5.4,
  },
];

export const mockTrades: Trade[] = [
  {
    id: '1',
    symbol: 'BTC',
    type: 'buy',
    orderType: 'market',
    quantity: 0.1,
    price: 97500,
    total: 9750,
    timestamp: new Date(Date.now() - 3600000),
    status: 'filled',
  },
  {
    id: '2',
    symbol: 'NVDA',
    type: 'buy',
    orderType: 'limit',
    quantity: 10,
    price: 135.50,
    total: 1355,
    timestamp: new Date(Date.now() - 7200000),
    status: 'filled',
  },
  {
    id: '3',
    symbol: 'ETH',
    type: 'sell',
    orderType: 'market',
    quantity: 0.5,
    price: 3480,
    total: 1740,
    timestamp: new Date(Date.now() - 86400000),
    status: 'filled',
  },
  {
    id: '4',
    symbol: 'AAPL',
    type: 'buy',
    orderType: 'limit',
    quantity: 5,
    price: 252,
    total: 1260,
    timestamp: new Date(Date.now() - 172800000),
    status: 'filled',
  },
];

export const mockAISignal: AISignal = {
  direction: 'bullish',
  confidence: 0.78,
  timestamp: new Date(),
  source: 'combined',
};

export const mockPriceForecast: PriceForecast = {
  symbol: 'BTC',
  currentPrice: 98432.50,
  predictions: [
    {
      horizon: '24h',
      predicted: 99850,
      lower: 96500,
      upper: 103200,
      confidence: 0.82,
    },
    {
      horizon: '7d',
      predicted: 105000,
      lower: 92000,
      upper: 118000,
      confidence: 0.68,
    },
    {
      horizon: '30d',
      predicted: 115000,
      lower: 85000,
      upper: 145000,
      confidence: 0.52,
    },
  ],
  generatedAt: new Date(),
};

export const mockSentimentData: SentimentData = {
  score: 0.45,
  label: 'positive',
  headlines: [
    {
      text: 'Bitcoin ETF sees record inflows as institutional interest surges',
      score: 0.85,
      source: 'Bloomberg',
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      text: 'Fed signals potential rate cuts in 2025, crypto markets rally',
      score: 0.72,
      source: 'Reuters',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      text: 'Major bank announces Bitcoin custody services for clients',
      score: 0.68,
      source: 'CNBC',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      text: 'Regulatory concerns mount as SEC reviews crypto exchange practices',
      score: -0.45,
      source: 'WSJ',
      timestamp: new Date(Date.now() - 14400000),
    },
    {
      text: 'Bitcoin mining difficulty reaches all-time high',
      score: 0.15,
      source: 'CoinDesk',
      timestamp: new Date(Date.now() - 21600000),
    },
  ],
  trend: [0.2, 0.25, 0.3, 0.28, 0.35, 0.4, 0.38, 0.42, 0.45],
};

export const mockKellyMetrics: KellyMetrics = {
  winRate: 0.62,
  avgWin: 3250,
  avgLoss: 1850,
  profitLossRatio: 1.76,
  optimalFraction: 0.284,
  halfKellyFraction: 0.142,
  maxLeverage: 3.0,
  recommendedSize: 17810.50,
};

export const mockVolatilityMetrics: VolatilityMetrics = {
  currentVolatility: 0.28, // 28% annualized
  targetVolatility: 0.20, // 20% target
  rollingVolatility: [0.22, 0.24, 0.26, 0.25, 0.27, 0.28, 0.29, 0.28, 0.27, 0.28],
  positionAdjustment: 0.714, // 20/28 = reduce position by ~29%
};

export const mockChandelierExit: ChandelierExit = {
  atr: 2450.50,
  atrPeriod: 22,
  multiplier: 3.0,
  longStop: 91081.00, // 98432.50 - (3 * 2450.50)
  shortStop: 105784.00, // 98432.50 + (3 * 2450.50)
  currentPrice: 98432.50,
};

export const mockExchangeConnections: ExchangeConnection[] = [
  {
    id: '1',
    name: 'binance',
    displayName: 'Binance',
    status: 'connected',
    lastSync: new Date(Date.now() - 60000),
  },
  {
    id: '2',
    name: 'alpaca',
    displayName: 'Alpaca',
    status: 'disconnected',
    error: 'API key expired',
  },
];

export const mockRiskSettings: RiskSettings = {
  maxLeverage: 3.0,
  targetVolatility: 0.20,
  atrMultiplier: 3.0,
  useHalfKelly: true,
};
