/**
 * Signal Engine - The "Brain" of AQTE Signal Intelligence Dashboard
 * 
 * Calculates complete trade setups with mathematically derived:
 * - Leverage (Volatility-Based)
 * - Stop Loss (Chandelier Exit / ATR-Based)
 * - Take Profit (Risk-Reward Ratio)
 */

// ============================================
// TYPES
// ============================================

export type SignalDirection = 'LONG' | 'SHORT';

export interface MarketConditions {
  symbol: string;
  currentPrice: number;
  dailyVolatility: number; // As decimal (e.g., 0.05 = 5%)
  atr: number; // Average True Range in price units
  ema200?: number;
  rsi?: number;
  volume24h?: number;
  sentimentScore?: number; // -1 to 1
}

export interface SignalSetup {
  id: string;
  asset: string;
  direction: SignalDirection;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  leverageRecommendation: number;
  riskRewardRatio: number;
  confidenceScore: number; // 0-100
  rationale: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  timestamp: Date;
}

export interface SignalEngineConfig {
  safetyFactor: number; // Default 2.0 (conservative)
  atrMultiplier: number; // Default 3.0 for Chandelier Exit
  minRiskRewardRatio: number; // Default 2.0
  maxLeverage: number; // Default 20
  minLeverage: number; // Default 1
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const DEFAULT_CONFIG: SignalEngineConfig = {
  safetyFactor: 2.0,
  atrMultiplier: 3.0,
  minRiskRewardRatio: 2.0,
  maxLeverage: 20,
  minLeverage: 1,
};

// ============================================
// CORE CALCULATIONS
// ============================================

/**
 * Calculate recommended leverage based on volatility
 * Formula: Leverage = 1 / (DailyVolatility * SafetyFactor)
 * 
 * Lower volatility = Higher safe leverage
 * Higher volatility = Lower safe leverage
 */
export function calculateLeverage(
  dailyVolatility: number,
  safetyFactor: number = DEFAULT_CONFIG.safetyFactor,
  maxLeverage: number = DEFAULT_CONFIG.maxLeverage,
  minLeverage: number = DEFAULT_CONFIG.minLeverage
): number {
  if (dailyVolatility <= 0) return minLeverage;
  
  const rawLeverage = 1 / (dailyVolatility * safetyFactor);
  const clampedLeverage = Math.max(minLeverage, Math.min(maxLeverage, rawLeverage));
  
  // Round to nearest 0.5 for cleaner display
  return Math.round(clampedLeverage * 2) / 2;
}

/**
 * Calculate Stop Loss using Chandelier Exit logic
 * Long SL = Price - (ATR * Multiplier)
 * Short SL = Price + (ATR * Multiplier)
 */
export function calculateStopLoss(
  entryPrice: number,
  atr: number,
  direction: SignalDirection,
  atrMultiplier: number = DEFAULT_CONFIG.atrMultiplier
): number {
  const stopDistance = atr * atrMultiplier;
  
  if (direction === 'LONG') {
    return entryPrice - stopDistance;
  } else {
    return entryPrice + stopDistance;
  }
}

/**
 * Calculate Take Profit based on Risk-Reward Ratio
 * TP = Entry + (|Entry - SL| * RRR) for LONG
 * TP = Entry - (|Entry - SL| * RRR) for SHORT
 */
export function calculateTakeProfit(
  entryPrice: number,
  stopLossPrice: number,
  direction: SignalDirection,
  riskRewardRatio: number = DEFAULT_CONFIG.minRiskRewardRatio
): number {
  const riskAmount = Math.abs(entryPrice - stopLossPrice);
  const rewardAmount = riskAmount * riskRewardRatio;
  
  if (direction === 'LONG') {
    return entryPrice + rewardAmount;
  } else {
    return entryPrice - rewardAmount;
  }
}

/**
 * Determine risk level based on leverage
 */
export function getRiskLevel(leverage: number): SignalSetup['riskLevel'] {
  if (leverage <= 3) return 'LOW';
  if (leverage <= 7) return 'MEDIUM';
  if (leverage <= 15) return 'HIGH';
  return 'EXTREME';
}

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidence(market: MarketConditions): number {
  let score = 50; // Base score
  
  // Sentiment contribution (±20 points)
  if (market.sentimentScore !== undefined) {
    score += market.sentimentScore * 20;
  }
  
  // RSI contribution (±15 points)
  if (market.rsi !== undefined) {
    if (market.rsi < 30) score += 15; // Oversold = bullish signal
    else if (market.rsi > 70) score -= 15; // Overbought = bearish signal
    else score += 5; // Neutral
  }
  
  // EMA trend contribution (±10 points)
  if (market.ema200 !== undefined) {
    if (market.currentPrice > market.ema200) score += 10;
    else score -= 10;
  }
  
  // Low volatility bonus (+5 points)
  if (market.dailyVolatility < 0.03) score += 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate rationale text based on market conditions
 */
export function generateRationale(
  market: MarketConditions,
  direction: SignalDirection
): string {
  const reasons: string[] = [];
  
  // Sentiment
  if (market.sentimentScore !== undefined) {
    if (market.sentimentScore > 0.5) {
      reasons.push('Strong Bullish Sentiment');
    } else if (market.sentimentScore > 0.2) {
      reasons.push('Positive Sentiment');
    } else if (market.sentimentScore < -0.5) {
      reasons.push('Strong Bearish Sentiment');
    } else if (market.sentimentScore < -0.2) {
      reasons.push('Negative Sentiment');
    }
  }
  
  // RSI
  if (market.rsi !== undefined) {
    if (market.rsi < 30) {
      reasons.push('RSI Oversold');
    } else if (market.rsi > 70) {
      reasons.push('RSI Overbought');
    }
  }
  
  // EMA Trend
  if (market.ema200 !== undefined) {
    if (market.currentPrice > market.ema200 * 1.02) {
      reasons.push('Above 200 EMA');
    } else if (market.currentPrice < market.ema200 * 0.98) {
      reasons.push('Below 200 EMA');
    }
  }
  
  // Volatility
  if (market.dailyVolatility < 0.025) {
    reasons.push('Low Volatility');
  } else if (market.dailyVolatility > 0.06) {
    reasons.push('High Volatility');
  }
  
  if (reasons.length === 0) {
    return direction === 'LONG' 
      ? 'Technical indicators favor upside'
      : 'Technical indicators favor downside';
  }
  
  return reasons.slice(0, 3).join(' + ');
}

/**
 * Determine signal direction based on market conditions
 */
export function determineDirection(market: MarketConditions): SignalDirection {
  let bullishScore = 0;
  
  // Sentiment weight: 40%
  if (market.sentimentScore !== undefined) {
    bullishScore += market.sentimentScore * 40;
  }
  
  // RSI weight: 30%
  if (market.rsi !== undefined) {
    if (market.rsi < 30) bullishScore += 30;
    else if (market.rsi > 70) bullishScore -= 30;
    else bullishScore += (50 - market.rsi) * 0.6;
  }
  
  // EMA weight: 30%
  if (market.ema200 !== undefined && market.currentPrice > 0) {
    const emaRatio = (market.currentPrice - market.ema200) / market.ema200;
    bullishScore += Math.max(-30, Math.min(30, emaRatio * 300));
  }
  
  return bullishScore >= 0 ? 'LONG' : 'SHORT';
}

// ============================================
// MAIN SIGNAL GENERATOR
// ============================================

/**
 * Generate a complete trading signal setup
 */
export function generateSignal(
  market: MarketConditions,
  config: Partial<SignalEngineConfig> = {}
): SignalSetup {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Determine direction
  const direction = determineDirection(market);
  
  // Calculate leverage
  const leverage = calculateLeverage(
    market.dailyVolatility,
    cfg.safetyFactor,
    cfg.maxLeverage,
    cfg.minLeverage
  );
  
  // Entry is current market price
  const entryPrice = market.currentPrice;
  
  // Calculate SL using Chandelier Exit
  const stopLossPrice = calculateStopLoss(
    entryPrice,
    market.atr,
    direction,
    cfg.atrMultiplier
  );
  
  // Calculate TP with Risk-Reward Ratio
  const takeProfitPrice = calculateTakeProfit(
    entryPrice,
    stopLossPrice,
    direction,
    cfg.minRiskRewardRatio
  );
  
  // Calculate confidence
  const confidenceScore = calculateConfidence(market);
  
  // Generate rationale
  const rationale = generateRationale(market, direction);
  
  // Determine risk level
  const riskLevel = getRiskLevel(leverage);
  
  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    asset: market.symbol,
    direction,
    entryPrice,
    takeProfitPrice,
    stopLossPrice,
    leverageRecommendation: leverage,
    riskRewardRatio: cfg.minRiskRewardRatio,
    confidenceScore,
    rationale,
    riskLevel,
    timestamp: new Date(),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format signal for clipboard copy
 */
export function formatSignalForClipboard(signal: SignalSetup): string {
  const directionEmoji = signal.direction === 'LONG' ? '🟢' : '🔴';
  const riskEmoji = {
    LOW: '✅',
    MEDIUM: '⚠️',
    HIGH: '🔶',
    EXTREME: '🚨',
  }[signal.riskLevel];
  
  return `${directionEmoji} ${signal.asset} ${signal.direction}

📊 TRADE SETUP
━━━━━━━━━━━━━━━━━━
LEV: ${signal.leverageRecommendation}x Isolated ${riskEmoji}
ENTRY: $${signal.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TP: $${signal.takeProfitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
SL: $${signal.stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
━━━━━━━━━━━━━━━━━━
R:R = 1:${signal.riskRewardRatio}
Confidence: ${signal.confidenceScore}%

💡 ${signal.rationale}

⏰ ${signal.timestamp.toLocaleString()}
#AQTE #Crypto #Trading`;
}

/**
 * Calculate position size based on account balance and risk
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercent: number, // e.g., 0.02 for 2%
  entryPrice: number,
  stopLossPrice: number,
  leverage: number
): { positionSize: number; margin: number; riskAmount: number } {
  const riskAmount = accountBalance * riskPercent;
  const stopLossPercent = Math.abs(entryPrice - stopLossPrice) / entryPrice;
  const positionSize = riskAmount / stopLossPercent;
  const margin = positionSize / leverage;
  
  return {
    positionSize,
    margin,
    riskAmount,
  };
}
