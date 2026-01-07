/**
 * Quantitative Signal Engine - The "Brain" of AQTE
 * 
 * Implements mathematically rigorous trading signals using:
 * - Hurst Exponent for Regime Detection (Trending vs Mean-Reversion)
 * - Ornstein-Uhlenbeck Process for Mean-Reversion signals
 * - Square Root of Time Volatility Scaling
 * - Chandelier Exit for Stop Loss
 */

// ============================================
// TYPES
// ============================================

export type SignalDirection = "LONG" | "SHORT";

/** Market regime detected by Hurst Exponent */
export type MarketRegime = "TRENDING" | "MEAN_REVERSION" | "RANDOM_WALK";

/** Trading timeframes */
export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d";

export interface MarketConditions {
  symbol: string;
  currentPrice: number;
  dailyVolatility: number;
  atr: number;
  ema200?: number;
  rsi?: number;
  volume24h?: number;
  sentimentScore?: number;
  historicalPrices?: number[]; // Required for Hurst/OU calculations
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
  confidenceScore: number;
  rationale: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  timestamp: Date;
  // Quantitative additions
  regime?: MarketRegime;
  hurstExponent?: number;
  ouParams?: OUParameters;
  timeframe?: Timeframe;
}

export interface SignalEngineConfig {
  safetyFactor: number;
  atrMultiplier: number;
  minRiskRewardRatio: number;
  maxLeverage: number;
  minLeverage: number;
  timeframe: Timeframe;
}

/** Ornstein-Uhlenbeck process parameters */
export interface OUParameters {
  theta: number; // Mean reversion speed
  mu: number; // Long-term mean
  sigma: number; // Volatility
}

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_CONFIG: SignalEngineConfig = {
  safetyFactor: 2.0,
  atrMultiplier: 3.0,
  minRiskRewardRatio: 2.0,
  maxLeverage: 20,
  minLeverage: 1,
  timeframe: "15m",
};

/**
 * Square Root of Time Volatility Scalers
 * Based on √(timeframe_minutes / 1440) normalized to daily
 */
export const TIMEFRAME_SCALERS: Record<Timeframe, number> = {
  "5m": 0.059, // √(5/1440)
  "15m": 0.102, // √(15/1440)
  "1h": 0.204, // √(60/1440)
  "4h": 0.408, // √(240/1440)
  "1d": 1.0, // √(1440/1440)
};

// ============================================
// HURST EXPONENT - Regime Detection
// ============================================

/**
 * Calculate Hurst Exponent using Rescaled Range (R/S) Analysis
 * 
 * H < 0.5: Mean-reverting (anti-persistent)
 * H = 0.5: Random walk (Brownian motion)
 * H > 0.5: Trending (persistent)
 * 
 * @param prices Array of historical prices (minimum 50 data points)
 * @returns Hurst exponent between 0 and 1
 */
export function calculateHurstExponent(prices: number[]): number {
  if (prices.length < 20) {
    return 0.5; // Default to random walk if insufficient data
  }

  // Calculate log returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > 0 && prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }

  if (returns.length < 10) {
    return 0.5;
  }

  // R/S Analysis with multiple chunk sizes
  const chunkSizes = [10, 20, 40, 80].filter((s) => s <= returns.length / 2);
  if (chunkSizes.length < 2) {
    return 0.5;
  }

  const rsValues: { logN: number; logRS: number }[] = [];

  for (const n of chunkSizes) {
    const numChunks = Math.floor(returns.length / n);
    let totalRS = 0;

    for (let chunk = 0; chunk < numChunks; chunk++) {
      const start = chunk * n;
      const chunkData = returns.slice(start, start + n);

      // Mean of chunk
      const mean = chunkData.reduce((a, b) => a + b, 0) / n;

      // Cumulative deviations from mean
      const cumulativeDeviations: number[] = [];
      let cumSum = 0;
      for (const val of chunkData) {
        cumSum += val - mean;
        cumulativeDeviations.push(cumSum);
      }

      // Range (R)
      const range =
        Math.max(...cumulativeDeviations) - Math.min(...cumulativeDeviations);

      // Standard deviation (S)
      const variance =
        chunkData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      // R/S ratio
      if (stdDev > 0) {
        totalRS += range / stdDev;
      }
    }

    const avgRS = totalRS / numChunks;
    if (avgRS > 0) {
      rsValues.push({
        logN: Math.log(n),
        logRS: Math.log(avgRS),
      });
    }
  }

  if (rsValues.length < 2) {
    return 0.5;
  }

  // Linear regression to find slope (Hurst exponent)
  const n = rsValues.length;
  const sumX = rsValues.reduce((sum, v) => sum + v.logN, 0);
  const sumY = rsValues.reduce((sum, v) => sum + v.logRS, 0);
  const sumXY = rsValues.reduce((sum, v) => sum + v.logN * v.logRS, 0);
  const sumX2 = rsValues.reduce((sum, v) => sum + v.logN * v.logN, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Clamp to valid range [0, 1]
  return Math.max(0, Math.min(1, slope));
}

/**
 * Determine market regime from Hurst exponent
 */
export function detectRegime(hurstExponent: number): MarketRegime {
  if (hurstExponent < 0.45) {
    return "MEAN_REVERSION";
  } else if (hurstExponent > 0.55) {
    return "TRENDING";
  }
  return "RANDOM_WALK";
}

// ============================================
// ORNSTEIN-UHLENBECK PROCESS
// ============================================

/**
 * Estimate Ornstein-Uhlenbeck parameters using Maximum Likelihood Estimation
 * 
 * dX = θ(μ - X)dt + σdW
 * 
 * @param prices Historical price series
 * @param dt Time step (default 1 for daily)
 * @returns OU parameters {theta, mu, sigma}
 */
export function estimateOUParameters(
  prices: number[],
  dt: number = 1
): OUParameters {
  if (prices.length < 10) {
    return { theta: 0.1, mu: prices[prices.length - 1] || 0, sigma: 0.02 };
  }

  const n = prices.length;

  // Calculate Sx, Sy, Sxx, Sxy, Syy for regression
  let Sx = 0,
    Sy = 0,
    Sxx = 0,
    Sxy = 0,
    Syy = 0;

  for (let i = 0; i < n - 1; i++) {
    const x = prices[i];
    const y = prices[i + 1];
    Sx += x;
    Sy += y;
    Sxx += x * x;
    Sxy += x * y;
    Syy += y * y;
  }

  const N = n - 1;

  // Linear regression: Y = a + b*X
  // where Y = X(t+dt), X = X(t)
  const denominator = N * Sxx - Sx * Sx;
  if (Math.abs(denominator) < 1e-10) {
    return { theta: 0.1, mu: prices[n - 1], sigma: 0.02 };
  }

  const b = (N * Sxy - Sx * Sy) / denominator;
  const a = (Sy - b * Sx) / N;

  // OU parameters from regression coefficients
  // X(t+dt) = X(t) * exp(-θdt) + μ(1 - exp(-θdt)) + noise
  // So: b = exp(-θdt), a = μ(1 - b)

  // Ensure b is in valid range
  const bClamped = Math.max(0.01, Math.min(0.99, b));
  const theta = -Math.log(bClamped) / dt;
  const mu = a / (1 - bClamped);

  // Estimate sigma from residuals
  let sumSquaredResiduals = 0;
  for (let i = 0; i < n - 1; i++) {
    const predicted = a + b * prices[i];
    const residual = prices[i + 1] - predicted;
    sumSquaredResiduals += residual * residual;
  }
  const variance = sumSquaredResiduals / N;
  const sigma = Math.sqrt((2 * theta * variance) / (1 - bClamped * bClamped));

  return {
    theta: Math.max(0.01, theta),
    mu: mu,
    sigma: Math.max(0.001, sigma),
  };
}

/**
 * Generate OU-based trading signal for mean-reverting markets
 * 
 * Long when Price < μ - 2σ (oversold)
 * Short when Price > μ + 2σ (overbought)
 */
export function generateOUSignal(
  currentPrice: number,
  ouParams: OUParameters
): { direction: SignalDirection | null; zScore: number } {
  const { mu, sigma } = ouParams;

  // Calculate z-score (how many standard deviations from mean)
  const zScore = (currentPrice - mu) / sigma;

  if (zScore < -2) {
    return { direction: "LONG", zScore };
  } else if (zScore > 2) {
    return { direction: "SHORT", zScore };
  }

  return { direction: null, zScore };
}

// ============================================
// VOLATILITY SCALING
// ============================================

/**
 * Scale ATR based on timeframe using Square Root of Time rule
 * This ensures stops are appropriately sized for each timeframe
 */
export function scaleATRForTimeframe(
  dailyATR: number,
  timeframe: Timeframe
): number {
  return dailyATR * TIMEFRAME_SCALERS[timeframe];
}

/**
 * Calculate recommended leverage with timeframe adjustment
 */
export function calculateLeverage(
  dailyVolatility: number,
  safetyFactor: number = DEFAULT_CONFIG.safetyFactor,
  maxLeverage: number = DEFAULT_CONFIG.maxLeverage,
  minLeverage: number = DEFAULT_CONFIG.minLeverage,
  timeframe: Timeframe = "1d"
): number {
  if (dailyVolatility <= 0) return minLeverage;

  // Scale volatility for timeframe
  const scaledVolatility = dailyVolatility * TIMEFRAME_SCALERS[timeframe];

  // Higher leverage allowed for shorter timeframes (tighter stops)
  const rawLeverage = 1 / (scaledVolatility * safetyFactor);
  const clampedLeverage = Math.max(
    minLeverage,
    Math.min(maxLeverage, rawLeverage)
  );

  return Math.round(clampedLeverage * 2) / 2;
}

/**
 * Calculate Stop Loss with timeframe-scaled ATR
 */
export function calculateStopLoss(
  entryPrice: number,
  dailyATR: number,
  direction: SignalDirection,
  atrMultiplier: number = DEFAULT_CONFIG.atrMultiplier,
  timeframe: Timeframe = "1d"
): number {
  const scaledATR = scaleATRForTimeframe(dailyATR, timeframe);
  const stopDistance = scaledATR * atrMultiplier;

  if (direction === "LONG") {
    return entryPrice - stopDistance;
  } else {
    return entryPrice + stopDistance;
  }
}

/**
 * Calculate Take Profit based on Risk-Reward Ratio
 */
export function calculateTakeProfit(
  entryPrice: number,
  stopLossPrice: number,
  direction: SignalDirection,
  riskRewardRatio: number = DEFAULT_CONFIG.minRiskRewardRatio
): number {
  const riskAmount = Math.abs(entryPrice - stopLossPrice);
  const rewardAmount = riskAmount * riskRewardRatio;

  if (direction === "LONG") {
    return entryPrice + rewardAmount;
  } else {
    return entryPrice - rewardAmount;
  }
}

// ============================================
// CONFIDENCE & RATIONALE
// ============================================

export function getRiskLevel(leverage: number): SignalSetup["riskLevel"] {
  if (leverage <= 3) return "LOW";
  if (leverage <= 7) return "MEDIUM";
  if (leverage <= 15) return "HIGH";
  return "EXTREME";
}

export function calculateConfidence(
  market: MarketConditions,
  regime: MarketRegime,
  hurstExponent: number,
  ouSignal?: { direction: SignalDirection | null; zScore: number }
): number {
  let score = 50;

  // Regime clarity bonus (±15 points)
  const regimeClarity = Math.abs(hurstExponent - 0.5) * 2; // 0 to 1
  score += regimeClarity * 15;

  // OU z-score strength for mean-reversion (±20 points)
  if (regime === "MEAN_REVERSION" && ouSignal?.direction) {
    const zStrength = Math.min(Math.abs(ouSignal.zScore) - 2, 2); // 0 to 2
    score += zStrength * 10;
  }

  // Sentiment contribution (±15 points)
  if (market.sentimentScore !== undefined) {
    score += market.sentimentScore * 15;
  }

  // RSI contribution (±10 points)
  if (market.rsi !== undefined) {
    if (market.rsi < 30) score += 10;
    else if (market.rsi > 70) score += 10; // Extreme RSI = clearer signal
    else score -= 5;
  }

  // EMA trend alignment (±10 points)
  if (market.ema200 !== undefined) {
    const aboveEMA = market.currentPrice > market.ema200;
    if (regime === "TRENDING") {
      score += aboveEMA ? 10 : -10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function generateRationale(
  market: MarketConditions,
  direction: SignalDirection,
  regime: MarketRegime,
  hurstExponent: number,
  ouParams?: OUParameters,
  zScore?: number
): string {
  const reasons: string[] = [];

  // Regime explanation
  if (regime === "MEAN_REVERSION") {
    reasons.push(`Mean-Reverting (H=${hurstExponent.toFixed(2)})`);
    if (zScore !== undefined) {
      reasons.push(`Z-Score: ${zScore.toFixed(1)}σ`);
    }
  } else if (regime === "TRENDING") {
    reasons.push(`Trending (H=${hurstExponent.toFixed(2)})`);
  }

  // OU mean level
  if (ouParams && regime === "MEAN_REVERSION") {
    const pctFromMean =
      ((market.currentPrice - ouParams.mu) / ouParams.mu) * 100;
    if (Math.abs(pctFromMean) > 2) {
      reasons.push(
        `${Math.abs(pctFromMean).toFixed(1)}% from mean ($${ouParams.mu.toFixed(0)})`
      );
    }
  }

  // Sentiment
  if (market.sentimentScore !== undefined) {
    if (market.sentimentScore > 0.5) {
      reasons.push("Bullish Sentiment");
    } else if (market.sentimentScore < -0.5) {
      reasons.push("Bearish Sentiment");
    }
  }

  // RSI
  if (market.rsi !== undefined) {
    if (market.rsi < 30) reasons.push("RSI Oversold");
    else if (market.rsi > 70) reasons.push("RSI Overbought");
  }

  if (reasons.length === 0) {
    return direction === "LONG"
      ? "Technical indicators favor upside"
      : "Technical indicators favor downside";
  }

  return reasons.slice(0, 3).join(" + ");
}

/**
 * Determine signal direction based on regime and market conditions
 */
export function determineDirection(
  market: MarketConditions,
  regime: MarketRegime,
  ouSignal?: { direction: SignalDirection | null; zScore: number }
): SignalDirection {
  // For mean-reversion regime, use OU signal
  if (regime === "MEAN_REVERSION" && ouSignal?.direction) {
    return ouSignal.direction;
  }

  // For trending regime, use momentum indicators
  let bullishScore = 0;

  if (market.sentimentScore !== undefined) {
    bullishScore += market.sentimentScore * 40;
  }

  if (market.rsi !== undefined) {
    if (regime === "TRENDING") {
      // In trending markets, follow momentum
      if (market.rsi > 50) bullishScore += 20;
      else bullishScore -= 20;
    } else {
      // In random walk, use mean reversion
      if (market.rsi < 30) bullishScore += 30;
      else if (market.rsi > 70) bullishScore -= 30;
    }
  }

  if (market.ema200 !== undefined && market.currentPrice > 0) {
    const emaRatio = (market.currentPrice - market.ema200) / market.ema200;
    bullishScore += Math.max(-30, Math.min(30, emaRatio * 300));
  }

  return bullishScore >= 0 ? "LONG" : "SHORT";
}

// ============================================
// MAIN SIGNAL GENERATOR
// ============================================

/**
 * Generate a complete trading signal with quantitative analysis
 */
export function generateSignal(
  market: MarketConditions,
  config: Partial<SignalEngineConfig> = {}
): SignalSetup {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Calculate Hurst exponent if historical data available
  const hurstExponent = market.historicalPrices
    ? calculateHurstExponent(market.historicalPrices)
    : 0.5;

  // Detect market regime
  const regime = detectRegime(hurstExponent);

  // Estimate OU parameters for mean-reversion
  let ouParams: OUParameters | undefined;
  let ouSignal: { direction: SignalDirection | null; zScore: number } | undefined;

  if (market.historicalPrices && market.historicalPrices.length >= 10) {
    ouParams = estimateOUParameters(market.historicalPrices);
    ouSignal = generateOUSignal(market.currentPrice, ouParams);
  }

  // Determine direction based on regime
  const direction = determineDirection(market, regime, ouSignal);

  // Calculate leverage with timeframe scaling
  const leverage = calculateLeverage(
    market.dailyVolatility,
    cfg.safetyFactor,
    cfg.maxLeverage,
    cfg.minLeverage,
    cfg.timeframe
  );

  const entryPrice = market.currentPrice;

  // Calculate SL with timeframe-scaled ATR
  const stopLossPrice = calculateStopLoss(
    entryPrice,
    market.atr,
    direction,
    cfg.atrMultiplier,
    cfg.timeframe
  );

  // Calculate TP
  const takeProfitPrice = calculateTakeProfit(
    entryPrice,
    stopLossPrice,
    direction,
    cfg.minRiskRewardRatio
  );

  // Calculate confidence
  const confidenceScore = calculateConfidence(
    market,
    regime,
    hurstExponent,
    ouSignal
  );

  // Generate rationale
  const rationale = generateRationale(
    market,
    direction,
    regime,
    hurstExponent,
    ouParams,
    ouSignal?.zScore
  );

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
    regime,
    hurstExponent,
    ouParams,
    timeframe: cfg.timeframe,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatSignalForClipboard(signal: SignalSetup): string {
  const directionEmoji = signal.direction === "LONG" ? "🟢" : "🔴";
  const riskEmoji = {
    LOW: "✅",
    MEDIUM: "⚠️",
    HIGH: "🔶",
    EXTREME: "🚨",
  }[signal.riskLevel];

  const regimeText = signal.regime
    ? `\nRegime: ${signal.regime} (H=${signal.hurstExponent?.toFixed(2)})`
    : "";

  return `${directionEmoji} ${signal.asset} ${signal.direction}

📊 TRADE SETUP
━━━━━━━━━━━━━━━━━━
LEV: ${signal.leverageRecommendation}x Isolated ${riskEmoji}
ENTRY: $${signal.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TP: $${signal.takeProfitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
SL: $${signal.stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
━━━━━━━━━━━━━━━━━━
R:R = 1:${signal.riskRewardRatio}
Confidence: ${signal.confidenceScore}%${regimeText}

💡 ${signal.rationale}

⏰ ${signal.timestamp.toLocaleString()}
#AQTE #Crypto #Trading`;
}

export function calculatePositionSize(
  accountBalance: number,
  riskPercent: number,
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
