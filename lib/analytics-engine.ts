/**
 * Analytics Engine - Self-Correcting Profit Forecast
 * 
 * Analyzes trade history to generate dynamic profit projections
 * that adapt based on actual trading performance.
 */

export interface TradeRecord {
  id: number;
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  pnlAbsolute: number;
  pnlPercent: number;
  leverage: number;
  margin: number;
  durationSeconds: number;
  timestampOpen: Date;
  timestampClose: Date;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  mode: "PAPER" | "LIVE";
}

export interface PerformanceMetrics {
  // Trade counts
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  
  // Win rate (0-100)
  winRate: number;
  
  // Average P&L
  avgWinAmount: number;
  avgLossAmount: number;
  avgWinPercent: number;
  avgLossPercent: number;
  
  // Risk/Reward
  avgRiskRewardRatio: number;
  profitFactor: number; // grossProfit / grossLoss
  
  // Totals
  totalProfit: number;
  totalLoss: number;
  netPnl: number;
  
  // Drawdown
  maxDrawdown: number;
  currentDrawdown: number;
  
  // Streaks
  currentStreak: number; // positive = wins, negative = losses
  longestWinStreak: number;
  longestLossStreak: number;
  
  // Time metrics
  avgTradeDurationSeconds: number;
  
  // Best/Worst
  bestTrade: TradeRecord | null;
  worstTrade: TradeRecord | null;
}

export interface EquityPoint {
  date: Date;
  balance: number;
  pnl: number;
  tradeId?: number;
}

export interface ProjectionPoint {
  date: Date;
  projectedBalance: number;
  upperBound: number; // Optimistic scenario
  lowerBound: number; // Pessimistic scenario
  confidence: number; // 0-100
}

export interface ProfitProjection {
  // Current state
  currentBalance: number;
  startingBalance: number;
  
  // Performance metrics
  metrics: PerformanceMetrics;
  
  // Historical equity curve
  equityCurve: EquityPoint[];
  
  // Future projection (30 days)
  projection: ProjectionPoint[];
  
  // Summary
  projectedBalanceIn30Days: number;
  projectedPnlIn30Days: number;
  projectedPnlPercent: number;
  
  // Confidence level
  projectionConfidence: number; // 0-100, based on sample size
}

/**
 * Calculate performance metrics from trade history
 */
export function calculatePerformanceMetrics(trades: TradeRecord[]): PerformanceMetrics {
  const closedTrades = trades.filter(t => t.status === "CLOSED" && t.exitPrice > 0);
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWinAmount: 0,
      avgLossAmount: 0,
      avgWinPercent: 0,
      avgLossPercent: 0,
      avgRiskRewardRatio: 0,
      profitFactor: 0,
      totalProfit: 0,
      totalLoss: 0,
      netPnl: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      avgTradeDurationSeconds: 0,
      bestTrade: null,
      worstTrade: null,
    };
  }

  // Separate wins and losses
  const wins = closedTrades.filter(t => t.pnlAbsolute > 0);
  const losses = closedTrades.filter(t => t.pnlAbsolute <= 0);

  // Calculate totals
  const totalProfit = wins.reduce((sum, t) => sum + t.pnlAbsolute, 0);
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnlAbsolute, 0));
  const netPnl = totalProfit - totalLoss;

  // Calculate averages
  const avgWinAmount = wins.length > 0 ? totalProfit / wins.length : 0;
  const avgLossAmount = losses.length > 0 ? totalLoss / losses.length : 0;
  const avgWinPercent = wins.length > 0 
    ? wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length 
    : 0;
  const avgLossPercent = losses.length > 0 
    ? Math.abs(losses.reduce((sum, t) => sum + t.pnlPercent, 0)) / losses.length 
    : 0;

  // Calculate profit factor
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  // Calculate risk/reward ratio
  const avgRiskRewardRatio = avgLossAmount > 0 ? avgWinAmount / avgLossAmount : 0;

  // Calculate streaks
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  // Sort by timestamp
  const sortedTrades = [...closedTrades].sort(
    (a, b) => new Date(a.timestampClose).getTime() - new Date(b.timestampClose).getTime()
  );

  for (const trade of sortedTrades) {
    if (trade.pnlAbsolute > 0) {
      tempWinStreak++;
      tempLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      currentStreak = tempWinStreak;
    } else {
      tempLossStreak++;
      tempWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
      currentStreak = -tempLossStreak;
    }
  }

  // Calculate drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningBalance = 0;

  for (const trade of sortedTrades) {
    runningBalance += trade.pnlAbsolute;
    peak = Math.max(peak, runningBalance);
    const drawdown = peak > 0 ? ((peak - runningBalance) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  const currentDrawdown = peak > 0 ? ((peak - runningBalance) / peak) * 100 : 0;

  // Calculate average duration
  const avgTradeDurationSeconds = closedTrades.reduce((sum, t) => sum + (t.durationSeconds || 0), 0) / closedTrades.length;

  // Find best and worst trades
  const bestTrade = closedTrades.reduce((best, t) => 
    !best || t.pnlAbsolute > best.pnlAbsolute ? t : best, 
    null as TradeRecord | null
  );
  const worstTrade = closedTrades.reduce((worst, t) => 
    !worst || t.pnlAbsolute < worst.pnlAbsolute ? t : worst, 
    null as TradeRecord | null
  );

  return {
    totalTrades: closedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: (wins.length / closedTrades.length) * 100,
    avgWinAmount,
    avgLossAmount,
    avgWinPercent,
    avgLossPercent,
    avgRiskRewardRatio,
    profitFactor,
    totalProfit,
    totalLoss,
    netPnl,
    maxDrawdown,
    currentDrawdown,
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    avgTradeDurationSeconds,
    bestTrade,
    worstTrade,
  };
}

/**
 * Generate equity curve from trade history
 */
export function generateEquityCurve(
  trades: TradeRecord[],
  startingBalance: number
): EquityPoint[] {
  const closedTrades = trades
    .filter(t => t.status === "CLOSED")
    .sort((a, b) => new Date(a.timestampClose).getTime() - new Date(b.timestampClose).getTime());

  const equityCurve: EquityPoint[] = [
    { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), balance: startingBalance, pnl: 0 }
  ];

  let currentBalance = startingBalance;

  for (const trade of closedTrades) {
    currentBalance += trade.pnlAbsolute;
    equityCurve.push({
      date: new Date(trade.timestampClose),
      balance: currentBalance,
      pnl: trade.pnlAbsolute,
      tradeId: trade.id,
    });
  }

  return equityCurve;
}

/**
 * Generate self-correcting profit projection
 * 
 * The projection adapts based on actual trading performance:
 * - If user wins more, projection steepens
 * - If user loses, projection flattens or dips
 */
export function generateProfitProjection(
  trades: TradeRecord[],
  currentBalance: number,
  startingBalance: number = 10000,
  projectionDays: number = 30,
  tradesPerDay: number = 2 // Expected trades per day
): ProfitProjection {
  // Use last 50 trades for analysis (or all if less)
  const recentTrades = trades
    .filter(t => t.status === "CLOSED")
    .sort((a, b) => new Date(b.timestampClose).getTime() - new Date(a.timestampClose).getTime())
    .slice(0, 50);

  const metrics = calculatePerformanceMetrics(recentTrades);
  const equityCurve = generateEquityCurve(trades, startingBalance);

  // Calculate expected value per trade
  // EV = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const winRate = metrics.winRate / 100;
  const lossRate = 1 - winRate;
  const expectedValuePerTrade = (winRate * metrics.avgWinAmount) - (lossRate * metrics.avgLossAmount);

  // Calculate standard deviation for confidence intervals
  const pnlValues = recentTrades.map(t => t.pnlAbsolute);
  const mean = pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0;
  const variance = pnlValues.length > 1 
    ? pnlValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (pnlValues.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);

  // Generate projection points
  const projection: ProjectionPoint[] = [];
  let projectedBalance = currentBalance;
  const today = new Date();

  // Confidence decreases as we project further into the future
  // Also affected by sample size
  const baseSampleConfidence = Math.min(100, recentTrades.length * 2); // Max 100% at 50 trades

  for (let day = 1; day <= projectionDays; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    // Expected change for this day
    const expectedDailyChange = expectedValuePerTrade * tradesPerDay;
    projectedBalance += expectedDailyChange;

    // Calculate bounds using standard deviation
    // 1 std dev covers ~68% of outcomes
    const dailyStdDev = stdDev * Math.sqrt(tradesPerDay);
    const cumulativeStdDev = dailyStdDev * Math.sqrt(day);

    const upperBound = currentBalance + (expectedDailyChange * day) + (cumulativeStdDev * 1.5);
    const lowerBound = Math.max(0, currentBalance + (expectedDailyChange * day) - (cumulativeStdDev * 1.5));

    // Confidence decreases over time
    const timeDecay = Math.max(0, 100 - (day * 2)); // Loses 2% per day
    const confidence = Math.round((baseSampleConfidence * timeDecay) / 100);

    projection.push({
      date,
      projectedBalance: Math.max(0, projectedBalance),
      upperBound,
      lowerBound,
      confidence,
    });
  }

  // Final projection values
  const finalProjection = projection[projection.length - 1];
  const projectedPnlIn30Days = finalProjection.projectedBalance - currentBalance;
  const projectedPnlPercent = currentBalance > 0 
    ? (projectedPnlIn30Days / currentBalance) * 100 
    : 0;

  return {
    currentBalance,
    startingBalance,
    metrics,
    equityCurve,
    projection,
    projectedBalanceIn30Days: finalProjection.projectedBalance,
    projectedPnlIn30Days,
    projectedPnlPercent,
    projectionConfidence: baseSampleConfidence,
  };
}

/**
 * Format price with exactly 2 decimal places
 */
export function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Format price with currency symbol and 2 decimal places
 */
export function formatPriceWithCurrency(price: number, currency: string = "$"): string {
  const formatted = Math.abs(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = price < 0 ? "-" : "";
  return `${sign}${currency}${formatted}`;
}

/**
 * Format percentage with 2 decimal places
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Calculate Kelly Criterion for optimal position sizing
 */
export function calculateKellyCriterion(winRate: number, avgWinLossRatio: number): number {
  // Kelly % = W - [(1-W) / R]
  // W = Win rate (0-1)
  // R = Win/Loss ratio
  const W = winRate / 100;
  const R = avgWinLossRatio;
  
  if (R <= 0) return 0;
  
  const kelly = W - ((1 - W) / R);
  return Math.max(0, Math.min(kelly, 1)); // Clamp between 0 and 1
}

/**
 * Generate mock trade history for testing
 */
export function generateMockTradeHistory(count: number, winRate: number = 55): TradeRecord[] {
  const trades: TradeRecord[] = [];
  const assets = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  const baseTime = Date.now() - (count * 4 * 60 * 60 * 1000); // 4 hours per trade

  for (let i = 0; i < count; i++) {
    const isWin = Math.random() * 100 < winRate;
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const direction = Math.random() > 0.5 ? "LONG" : "SHORT";
    const leverage = Math.floor(Math.random() * 15) + 5; // 5-20x
    const margin = 100 + Math.random() * 400; // $100-500
    const entryPrice = asset === "BTCUSDT" ? 98000 + Math.random() * 2000 
      : asset === "ETHUSDT" ? 3400 + Math.random() * 100 
      : 185 + Math.random() * 10;
    
    const pnlPercent = isWin 
      ? (Math.random() * 15 + 5) // 5-20% win
      : -(Math.random() * 10 + 3); // 3-13% loss
    const pnlAbsolute = margin * (pnlPercent / 100);
    
    const exitPrice = direction === "LONG"
      ? entryPrice * (1 + pnlPercent / 100 / leverage)
      : entryPrice * (1 - pnlPercent / 100 / leverage);

    const timestampOpen = new Date(baseTime + i * 4 * 60 * 60 * 1000);
    const durationSeconds = Math.floor(Math.random() * 14400) + 1800; // 30min - 4h
    const timestampClose = new Date(timestampOpen.getTime() + durationSeconds * 1000);

    trades.push({
      id: i + 1,
      asset,
      direction,
      entryPrice,
      exitPrice,
      pnlAbsolute,
      pnlPercent,
      leverage,
      margin,
      durationSeconds,
      timestampOpen,
      timestampClose,
      status: "CLOSED",
      mode: "PAPER",
    });
  }

  return trades;
}
