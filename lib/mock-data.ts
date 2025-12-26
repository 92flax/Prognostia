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
  AIReasoning,
  TradingMode,
  PaperWallet,
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
    id: 'btc',
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
    id: 'eth',
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
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    price: 185.42,
    change24h: 8.75,
    changePercent24h: 4.95,
    high24h: 188.50,
    low24h: 175.20,
    volume24h: 4500000000,
    sparkline: generateSparkline(176, 0.03),
  },
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'Ripple',
    price: 2.34,
    change24h: 0.12,
    changePercent24h: 5.41,
    high24h: 2.38,
    low24h: 2.18,
    volume24h: 8900000000,
    sparkline: generateSparkline(2.2, 0.025),
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.3245,
    change24h: -0.0123,
    changePercent24h: -3.65,
    high24h: 0.3420,
    low24h: 0.3180,
    volume24h: 2100000000,
    sparkline: generateSparkline(0.335, 0.035),
  },
];

export const mockPortfolioSummary: PortfolioSummary = {
  totalValue: 125432.50,
  dailyPnL: 2341.20,
  dailyPnLPercent: 1.90,
  totalReturn: 25432.50,
  totalReturnPercent: 25.43,
  availableBalance: 15000,
  marginUsed: 8500,
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
    symbol: 'SOL',
    name: 'Solana',
    quantity: 45,
    avgPrice: 120,
    currentPrice: 185.42,
    value: 8343.90,
    pnl: 2943.90,
    pnlPercent: 54.52,
    allocation: 6.7,
  },
  {
    id: '4',
    symbol: 'XRP',
    name: 'Ripple',
    quantity: 3500,
    avgPrice: 1.85,
    currentPrice: 2.34,
    value: 8190.00,
    pnl: 1715.00,
    pnlPercent: 26.49,
    allocation: 6.5,
  },
  {
    id: '5',
    symbol: 'DOGE',
    name: 'Dogecoin',
    quantity: 22000,
    avgPrice: 0.28,
    currentPrice: 0.3245,
    value: 7139.00,
    pnl: 979.00,
    pnlPercent: 15.89,
    allocation: 5.7,
  },
];

export const mockTrades: Trade[] = [
  {
    id: '1',
    symbol: 'BTC',
    type: 'buy',
    side: 'long',
    orderType: 'limit',
    quantity: 0.1,
    price: 97500,
    total: 9750,
    leverage: 10,
    liquidationPrice: 88125,
    timestamp: new Date(Date.now() - 3600000),
    status: 'filled',
    isSimulated: false,
  },
  {
    id: '2',
    symbol: 'ETH',
    type: 'buy',
    side: 'long',
    orderType: 'post_only',
    quantity: 2.5,
    price: 3420,
    total: 8550,
    leverage: 15,
    liquidationPrice: 3192,
    timestamp: new Date(Date.now() - 7200000),
    status: 'filled',
    isSimulated: false,
  },
  {
    id: '3',
    symbol: 'SOL',
    type: 'sell',
    side: 'short',
    orderType: 'market',
    quantity: 10,
    price: 182.50,
    total: 1825,
    leverage: 20,
    liquidationPrice: 191.63,
    timestamp: new Date(Date.now() - 86400000),
    status: 'closed',
    pnl: 145.50,
    pnlPercent: 7.97,
    isSimulated: true,
  },
  {
    id: '4',
    symbol: 'XRP',
    type: 'buy',
    side: 'long',
    orderType: 'limit',
    quantity: 500,
    price: 2.28,
    total: 1140,
    leverage: 25,
    liquidationPrice: 2.19,
    timestamp: new Date(Date.now() - 172800000),
    status: 'filled',
    isSimulated: true,
  },
];

// AI Reasoning for explainable AI
export const mockAIReasoning: AIReasoning = {
  summary: "Bullish signal based on strong positive sentiment and price above key moving averages.",
  factors: [
    {
      name: "FinBERT Sentiment",
      value: 0.78,
      impact: "positive",
      weight: 0.35,
      explanation: "Very positive sentiment (+0.78) from recent news. ETF inflows and institutional adoption driving optimism.",
    },
    {
      name: "Price vs 200 EMA",
      value: "Above",
      impact: "positive",
      weight: 0.25,
      explanation: "Price ($98,432) is 12.5% above the 200-day EMA ($87,495), indicating strong uptrend.",
    },
    {
      name: "RSI (14)",
      value: 62,
      impact: "neutral",
      weight: 0.15,
      explanation: "RSI at 62 is in neutral territory. Not overbought, room for upside.",
    },
    {
      name: "Volume Trend",
      value: "+18%",
      impact: "positive",
      weight: 0.15,
      explanation: "24h volume is 18% above 7-day average, confirming buying pressure.",
    },
    {
      name: "Volatility",
      value: "4.5%",
      impact: "neutral",
      weight: 0.10,
      explanation: "Daily volatility at 4.5% is moderate. Recommended max leverage: 11x.",
    },
  ],
};

export const mockAISignal: AISignal = {
  id: 'signal_1',
  pair: 'BTC/USDT',
  direction: 'bullish',
  confidence: 0.78,
  timestamp: new Date(),
  source: 'combined',
  reasoning: mockAIReasoning,
};

export const mockPriceForecast: PriceForecast = {
  symbol: 'BTC',
  pair: 'BTC/USDT',
  currentPrice: 98432.50,
  model: 'TimesFM 2.0',
  predictions: [
    {
      horizon: '24h',
      predicted: 99850,
      lower: 96500,
      upper: 103200,
      confidence: 0.82,
      changePercent: 1.44,
    },
    {
      horizon: '7d',
      predicted: 105000,
      lower: 92000,
      upper: 118000,
      confidence: 0.68,
      changePercent: 6.67,
    },
    {
      horizon: '30d',
      predicted: 115000,
      lower: 85000,
      upper: 145000,
      confidence: 0.52,
      changePercent: 16.83,
    },
  ],
  generatedAt: new Date(),
};

export const mockSentimentData: SentimentData = {
  pair: 'BTC/USDT',
  score: 0.78,
  label: 'positive',
  confidence: 0.85,
  model: 'FinBERT',
  headlines: [
    {
      id: '1',
      text: 'Bitcoin ETF sees record inflows as institutional interest surges',
      title: 'Bitcoin ETF sees record inflows as institutional interest surges',
      score: 0.92,
      source: 'Bloomberg',
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: '2',
      text: 'Fed signals potential rate cuts in 2025, crypto markets rally',
      title: 'Fed signals potential rate cuts in 2025, crypto markets rally',
      score: 0.85,
      source: 'Reuters',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      text: 'Major bank announces Bitcoin custody services for clients',
      title: 'Major bank announces Bitcoin custody services for clients',
      score: 0.78,
      source: 'CNBC',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '4',
      text: 'Regulatory concerns mount as SEC reviews crypto exchange practices',
      title: 'Regulatory concerns mount as SEC reviews crypto exchange practices',
      score: -0.45,
      source: 'WSJ',
      timestamp: new Date(Date.now() - 14400000),
    },
    {
      id: '5',
      text: 'Bitcoin mining difficulty reaches all-time high',
      title: 'Bitcoin mining difficulty reaches all-time high',
      score: 0.25,
      source: 'CoinDesk',
      timestamp: new Date(Date.now() - 21600000),
    },
  ],
  trend: [0.2, 0.25, 0.3, 0.28, 0.35, 0.4, 0.38, 0.42, 0.45, 0.55, 0.62, 0.78],
  analyzedAt: new Date(),
};

export const mockKellyMetrics: KellyMetrics = {
  winRate: 0.62,
  avgWin: 3250,
  avgLoss: 1850,
  profitLossRatio: 1.76,
  optimalFraction: 0.284,
  halfKellyFraction: 0.142,
  quarterKellyFraction: 0.071,
  currentFraction: 'half',
  maxLeverage: 3.0,
  recommendedSize: 17810.50,
  recommendedPositionSize: 0.142,
  historicalTrades: 156,
};

export const mockVolatilityMetrics: VolatilityMetrics = {
  currentVolatility: 0.045, // 4.5% daily volatility
  targetVolatility: 0.03, // 3% target
  rollingVolatility: [0.038, 0.042, 0.044, 0.043, 0.045, 0.046, 0.048, 0.045, 0.044, 0.045],
  positionAdjustment: 0.667, // 3/4.5 = reduce position by ~33%
  recommendedLeverage: 11, // (1/0.045) * 0.5 safety factor
  maxSafeLeverage: 15, // Conservative max based on volatility
};

export const mockChandelierExit: ChandelierExit = {
  atr: 2450.50,
  atrPeriod: 22,
  multiplier: 3.0,
  longStop: 91081.00, // 98432.50 - (3 * 2450.50)
  shortStop: 105784.00, // 98432.50 + (3 * 2450.50)
  currentPrice: 98432.50,
};

// Updated to Bitget as primary exchange
export const mockExchangeConnections: ExchangeConnection[] = [
  {
    id: '1',
    name: 'bitget',
    displayName: 'Bitget',
    status: 'connected',
    lastSync: new Date(Date.now() - 60000),
    capabilities: ['spot', 'futures', 'margin', 'copy_trading'],
    balance: 12450.00,
  },
  {
    id: '2',
    name: 'alpaca',
    displayName: 'Alpaca (Stocks)',
    status: 'disconnected',
    capabilities: ['stocks', 'options', 'crypto'],
  },
];

export const mockRiskSettings: RiskSettings = {
  maxLeverage: 15,
  targetVolatility: 0.03,
  atrMultiplier: 3.0,
  useHalfKelly: true,
  kellyFraction: 'half',
  stopLossPercent: 2.0,
  takeProfitPercent: 6.0,
  maxPositionSize: 0.25,
  maxDrawdown: 0.15,
};

// Paper wallet for simulation mode
export const mockPaperWallet: PaperWallet = {
  userId: 1,
  usdtBalance: 10000,
  btcBalance: 0,
  ethBalance: 0,
  initialBalance: 10000,
  peakBalance: 12500,
  totalTrades: 45,
  winningTrades: 28,
  totalPnl: 2500,
  maxDrawdown: 0.08,
  winRate: 0.622,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  lastTradeAt: new Date(Date.now() - 3600000),
};

// Current trading mode
export const mockTradingMode: TradingMode = 'simulation';

// Liquidation info helper
export const mockLiquidationInfo = {
  liquidationPrice: 89250,
  distancePercent: 9.33,
  distanceAbsolute: 9182.50,
  riskLevel: 'safe' as const,
  marginRatio: 0.15,
};
