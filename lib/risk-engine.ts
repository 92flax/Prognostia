/**
 * Risk Engine - Position Sizing with Mathematical Rigor
 * 
 * Implements:
 * - Ralph Vince's Optimal f for position sizing
 * - Risk of Ruin (RoR) calculation
 * - Zero Ruin Constraint (RoR < 0.01%)
 * - Kelly Criterion variants (Full, Half, Quarter)
 */

// ============================================
// TYPES
// ============================================

export interface TradeResult {
  pnl: number; // Profit/Loss in absolute terms
  pnlPercent: number; // Profit/Loss as percentage of entry
}

export interface RiskMetrics {
  winRate: number; // 0 to 1
  avgWin: number; // Average winning trade (absolute)
  avgLoss: number; // Average losing trade (absolute, positive number)
  avgWinPercent: number; // Average win as percentage
  avgLossPercent: number; // Average loss as percentage
  profitFactor: number; // Total wins / Total losses
  expectancy: number; // Expected value per trade
  maxDrawdown: number; // Maximum historical drawdown
  totalTrades: number;
}

export interface PositionSizeResult {
  optimalF: number; // Optimal fraction (0 to 1)
  kellyFraction: number; // Kelly Criterion fraction
  riskOfRuin: number; // Probability of ruin (0 to 1)
  safePositionSize: number; // Position size in USDT
  safePositionPercent: number; // Position size as % of account
  leverageAdjustedSize: number; // Size adjusted for leverage
  marginRequired: number; // Margin needed for position
  maxLossAmount: number; // Maximum loss if SL hit
  isZeroRuinSafe: boolean; // Passes Zero Ruin constraint
  warnings: string[];
}

export type KellyMode = "FULL" | "HALF" | "QUARTER";

// ============================================
// CONSTANTS
// ============================================

/** Maximum acceptable Risk of Ruin for Zero Ruin constraint */
const MAX_RISK_OF_RUIN = 0.0001; // 0.01%

/** Minimum number of trades for reliable statistics */
const MIN_TRADES_FOR_STATS = 10;

/** Default risk metrics when insufficient data */
const DEFAULT_RISK_METRICS: RiskMetrics = {
  winRate: 0.5,
  avgWin: 100,
  avgLoss: 100,
  avgWinPercent: 2,
  avgLossPercent: 2,
  profitFactor: 1.0,
  expectancy: 0,
  maxDrawdown: 0.1,
  totalTrades: 0,
};

// ============================================
// RISK METRICS CALCULATION
// ============================================

/**
 * Calculate risk metrics from trade history
 */
export function calculateRiskMetrics(trades: TradeResult[]): RiskMetrics {
  if (trades.length === 0) {
    return DEFAULT_RISK_METRICS;
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  const winRate = wins.length / trades.length;

  const avgWin = wins.length > 0
    ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length
    : 0;

  const avgLoss = losses.length > 0
    ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length)
    : 0;

  const avgWinPercent = wins.length > 0
    ? wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length
    : 0;

  const avgLossPercent = losses.length > 0
    ? Math.abs(losses.reduce((sum, t) => sum + t.pnlPercent, 0) / losses.length)
    : 0;

  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 1;

  // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

  // Calculate max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;

  for (const trade of trades) {
    cumulative += trade.pnl;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drawdown = peak > 0 ? (peak - cumulative) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    winRate,
    avgWin,
    avgLoss,
    avgWinPercent,
    avgLossPercent,
    profitFactor,
    expectancy,
    maxDrawdown,
    totalTrades: trades.length,
  };
}

// ============================================
// OPTIMAL f (RALPH VINCE)
// ============================================

/**
 * Calculate Optimal f using Ralph Vince's method
 * 
 * Optimal f is the fraction of capital to risk that maximizes
 * the geometric growth rate of the account.
 * 
 * Formula: f* = argmax[G(f)] where G(f) = ∏(1 + f * R_i)^(1/n)
 * 
 * We use numerical optimization to find the optimal f.
 */
export function calculateOptimalF(
  trades: TradeResult[],
  accountBalance: number
): number {
  if (trades.length < MIN_TRADES_FOR_STATS) {
    return 0.02; // Default 2% risk with insufficient data
  }

  // Normalize trades to percentage returns
  const returns = trades.map((t) => t.pnl / accountBalance);

  // Find the largest loss (most negative return)
  const largestLoss = Math.min(...returns);
  if (largestLoss >= 0) {
    return 0.1; // No losses, use conservative 10%
  }

  // Search for optimal f between 0 and 1
  let optimalF = 0;
  let maxTWR = 0; // Terminal Wealth Relative

  for (let f = 0.01; f <= 1.0; f += 0.01) {
    // Calculate TWR for this f
    let twr = 1;
    let valid = true;

    for (const r of returns) {
      // HPR = 1 + f * (-R / largestLoss)
      // This normalizes returns by the largest loss
      const hpr = 1 + f * (-r / largestLoss);
      
      if (hpr <= 0) {
        valid = false;
        break;
      }
      twr *= hpr;
    }

    if (valid && twr > maxTWR) {
      maxTWR = twr;
      optimalF = f;
    }
  }

  // Convert optimal f to fraction of account
  // The actual risk fraction is f * |largestLoss|
  return Math.min(0.25, optimalF * Math.abs(largestLoss));
}

// ============================================
// KELLY CRITERION
// ============================================

/**
 * Calculate Kelly Criterion fraction
 * 
 * Kelly Formula: f* = (bp - q) / b
 * where:
 *   b = odds received on the bet (avgWin / avgLoss)
 *   p = probability of winning (winRate)
 *   q = probability of losing (1 - winRate)
 */
export function calculateKellyFraction(metrics: RiskMetrics): number {
  const { winRate, avgWin, avgLoss } = metrics;

  if (avgLoss === 0 || winRate === 0) {
    return 0;
  }

  const b = avgWin / avgLoss; // Win/Loss ratio
  const p = winRate;
  const q = 1 - winRate;

  const kelly = (b * p - q) / b;

  // Kelly can be negative (don't bet) or very high
  return Math.max(0, Math.min(1, kelly));
}

/**
 * Apply Kelly mode (Full, Half, Quarter)
 */
export function applyKellyMode(kellyFraction: number, mode: KellyMode): number {
  switch (mode) {
    case "FULL":
      return kellyFraction;
    case "HALF":
      return kellyFraction * 0.5;
    case "QUARTER":
      return kellyFraction * 0.25;
    default:
      return kellyFraction * 0.5;
  }
}

// ============================================
// RISK OF RUIN
// ============================================

/**
 * Calculate Risk of Ruin (probability of losing entire account)
 * 
 * Using the formula:
 * RoR = ((1 - edge) / (1 + edge))^(units)
 * 
 * where:
 *   edge = (winRate * avgWin - lossRate * avgLoss) / avgLoss
 *   units = accountBalance / riskPerTrade
 */
export function calculateRiskOfRuin(
  metrics: RiskMetrics,
  riskPerTrade: number,
  accountBalance: number
): number {
  const { winRate, avgWin, avgLoss } = metrics;

  if (avgLoss === 0 || riskPerTrade === 0) {
    return 0;
  }

  // Calculate edge
  const edge = (winRate * avgWin - (1 - winRate) * avgLoss) / avgLoss;

  // If edge is negative or zero, ruin is certain
  if (edge <= 0) {
    return 1;
  }

  // Number of "units" (how many losses to wipe out account)
  const units = accountBalance / riskPerTrade;

  // Risk of Ruin formula
  const ror = Math.pow((1 - edge) / (1 + edge), units);

  return Math.max(0, Math.min(1, ror));
}

/**
 * Find maximum position size that satisfies Zero Ruin constraint
 */
export function findZeroRuinSize(
  metrics: RiskMetrics,
  accountBalance: number,
  maxRoR: number = MAX_RISK_OF_RUIN
): number {
  // Binary search for maximum safe position size
  let low = 0;
  let high = accountBalance * 0.5; // Max 50% of account
  let safeSize = 0;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const ror = calculateRiskOfRuin(metrics, mid, accountBalance);

    if (ror <= maxRoR) {
      safeSize = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return safeSize;
}

// ============================================
// MAIN POSITION SIZING FUNCTION
// ============================================

/**
 * Calculate optimal position size with all risk constraints
 */
export function calculateOptimalPositionSize(
  trades: TradeResult[],
  accountBalance: number,
  entryPrice: number,
  stopLossPrice: number,
  leverage: number,
  kellyMode: KellyMode = "HALF"
): PositionSizeResult {
  const warnings: string[] = [];

  // Calculate risk metrics
  const metrics = calculateRiskMetrics(trades);

  if (metrics.totalTrades < MIN_TRADES_FOR_STATS) {
    warnings.push(`Insufficient trade history (${metrics.totalTrades}/${MIN_TRADES_FOR_STATS}). Using conservative defaults.`);
  }

  // Calculate stop loss percentage
  const stopLossPercent = Math.abs(entryPrice - stopLossPrice) / entryPrice;

  // Calculate Optimal f
  const optimalF = calculateOptimalF(trades, accountBalance);

  // Calculate Kelly fraction
  const kellyFraction = calculateKellyFraction(metrics);
  const adjustedKelly = applyKellyMode(kellyFraction, kellyMode);

  // Use the more conservative of Optimal f and Kelly
  const conservativeFraction = Math.min(optimalF, adjustedKelly);

  // Calculate initial position size
  let positionPercent = conservativeFraction;

  // Calculate Risk of Ruin for this position size
  const riskAmount = accountBalance * positionPercent * stopLossPercent * leverage;
  let riskOfRuin = calculateRiskOfRuin(metrics, riskAmount, accountBalance);

  // Apply Zero Ruin constraint
  let isZeroRuinSafe = riskOfRuin <= MAX_RISK_OF_RUIN;

  if (!isZeroRuinSafe) {
    // Find safe position size
    const safeRiskAmount = findZeroRuinSize(metrics, accountBalance, MAX_RISK_OF_RUIN);
    positionPercent = safeRiskAmount / (accountBalance * stopLossPercent * leverage);
    riskOfRuin = calculateRiskOfRuin(metrics, safeRiskAmount, accountBalance);
    isZeroRuinSafe = true;
    warnings.push("Position size reduced to satisfy Zero Ruin constraint.");
  }

  // Ensure minimum position
  positionPercent = Math.max(0.005, positionPercent); // Min 0.5%

  // Ensure maximum position
  positionPercent = Math.min(0.25, positionPercent); // Max 25%

  // Calculate final values
  const safePositionSize = accountBalance * positionPercent;
  const leverageAdjustedSize = safePositionSize * leverage;
  const marginRequired = safePositionSize;
  const maxLossAmount = safePositionSize * stopLossPercent * leverage;

  // Additional warnings
  if (leverage > 10 && kellyMode === "FULL") {
    warnings.push("High leverage with Full Kelly is extremely risky. Consider Half or Quarter Kelly.");
  }

  if (metrics.profitFactor < 1.2) {
    warnings.push("Low profit factor. System edge may be insufficient.");
  }

  if (metrics.maxDrawdown > 0.3) {
    warnings.push("Historical max drawdown exceeds 30%. Exercise caution.");
  }

  return {
    optimalF,
    kellyFraction,
    riskOfRuin,
    safePositionSize,
    safePositionPercent: positionPercent * 100,
    leverageAdjustedSize,
    marginRequired,
    maxLossAmount,
    isZeroRuinSafe,
    warnings,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format risk metrics for display
 */
export function formatRiskMetrics(metrics: RiskMetrics): string {
  return `Win Rate: ${(metrics.winRate * 100).toFixed(1)}%
Avg Win: $${metrics.avgWin.toFixed(2)} (${metrics.avgWinPercent.toFixed(2)}%)
Avg Loss: $${metrics.avgLoss.toFixed(2)} (${metrics.avgLossPercent.toFixed(2)}%)
Profit Factor: ${metrics.profitFactor.toFixed(2)}
Expectancy: $${metrics.expectancy.toFixed(2)}
Max Drawdown: ${(metrics.maxDrawdown * 100).toFixed(1)}%
Total Trades: ${metrics.totalTrades}`;
}

/**
 * Get recommended Kelly mode based on leverage
 */
export function getRecommendedKellyMode(leverage: number): KellyMode {
  if (leverage <= 5) return "HALF";
  if (leverage <= 10) return "QUARTER";
  return "QUARTER"; // Always Quarter for high leverage
}

/**
 * Calculate position size for a specific risk percentage
 */
export function calculatePositionForRisk(
  accountBalance: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number,
  leverage: number
): { positionSize: number; margin: number; riskAmount: number } {
  const stopLossPercent = Math.abs(entryPrice - stopLossPrice) / entryPrice;
  const riskAmount = accountBalance * riskPercent;
  const positionSize = riskAmount / stopLossPercent;
  const margin = positionSize / leverage;

  return {
    positionSize,
    margin,
    riskAmount,
  };
}
