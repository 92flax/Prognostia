import { ScrollView, Text, View, RefreshControl, Pressable, StyleSheet, Alert } from "react-native";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PositionCard } from "@/components/position-card";
import { TradeHistoryItem } from "@/components/trade-history-item";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { PerformanceStatsCard, PerformanceStats } from "@/components/performance-stats-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercent } from "@/lib/format";
import { generateProfitProjection, EquityPoint, ProjectionPoint } from "@/lib/analytics-engine";
import {
  MOCK_TRADE_HISTORY,
  MOCK_PAPER_WALLET,
  MockTrade,
} from "@/lib/mock-trading-data";

type TabType = "overview" | "positions" | "history";

// Generate mock equity curve data
function generateMockEquityCurve(startingBalance: number, days: number = 30): EquityPoint[] {
  const curve: EquityPoint[] = [];
  let balance = startingBalance;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random daily change between -3% and +4%
    const change = (Math.random() - 0.4) * 0.07;
    balance = balance * (1 + change);
    
    curve.push({
      date,
      balance,
      pnl: balance * change,
    });
  }
  
  return curve;
}

// Generate mock projection data
function generateMockProjection(currentBalance: number, days: number = 30): ProjectionPoint[] {
  const projection: ProjectionPoint[] = [];
  let balance = currentBalance;
  const now = new Date();
  
  // Assume 55% win rate, 2% avg win, 1.5% avg loss
  const expectedDailyReturn = 0.003; // ~0.3% per day
  const volatility = 0.02;
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    balance = balance * (1 + expectedDailyReturn);
    const uncertainty = volatility * Math.sqrt(i);
    
    projection.push({
      date,
      projectedBalance: balance,
      upperBound: balance * (1 + uncertainty),
      lowerBound: balance * (1 - uncertainty),
      confidence: Math.max(50, 95 - i * 1.5),
    });
  }
  
  return projection;
}

/**
 * Portfolio Screen - View positions, trade history, and performance analytics
 * 
 * Features:
 * - Equity curve chart with projection
 * - Performance statistics
 * - Open positions list
 * - Trade history
 */
export default function PortfolioScreen() {
  const colors = useColors();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [tradingMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [wallet, setWallet] = useState(MOCK_PAPER_WALLET);
  const [trades, setTrades] = useState<MockTrade[]>(MOCK_TRADE_HISTORY);

  // Generate equity curve and projection
  const equityCurve = useMemo(() => generateMockEquityCurve(10000, 30), []);
  const projection = useMemo(() => generateMockProjection(wallet.balance, 30), [wallet.balance]);

  // Calculate performance stats
  const performanceStats: PerformanceStats = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === "CLOSED");
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl || 0) <= 0);
    
    const avgWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / losses.length)
      : 0;
    
    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    return {
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
      avgWin,
      avgLoss,
      maxDrawdown: 8.5, // Mock value
      totalTrades: closedTrades.length,
    };
  }, [trades]);

  // Get open and closed positions
  const openPositions = trades.filter(t => t.status === "OPEN");
  const closedTrades = trades.filter(t => t.status === "CLOSED");

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // Handle close position
  const handleClosePosition = (tradeId: string) => {
    Alert.alert(
      "Close Position",
      "Are you sure you want to close this position?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setTrades(prev =>
              prev.map(t =>
                t.id === tradeId
                  ? {
                      ...t,
                      status: "CLOSED" as const,
                      exitPrice: t.entryPrice * (t.direction === "LONG" ? 1.02 : 0.98),
                      pnl: t.size * t.entryPrice * 0.02 * t.leverage,
                      pnlPercent: 2 * t.leverage,
                      closedAt: new Date(),
                    }
                  : t
              )
            );
          },
        },
      ]
    );
  };

  // Calculate current price for open positions (mock)
  const getCurrentPrice = (trade: MockTrade) => {
    const change = trade.direction === "LONG" ? 1.015 : 0.985;
    return trade.entryPrice * change;
  };

  // Calculate unrealized P&L
  const getUnrealizedPnl = (trade: MockTrade) => {
    const currentPrice = getCurrentPrice(trade);
    const priceDiff = trade.direction === "LONG"
      ? currentPrice - trade.entryPrice
      : trade.entryPrice - currentPrice;
    return priceDiff * trade.size * trade.leverage;
  };

  const getPnlPercent = (trade: MockTrade) => {
    const currentPrice = getCurrentPrice(trade);
    const priceDiff = trade.direction === "LONG"
      ? (currentPrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - currentPrice) / trade.entryPrice;
    return priceDiff * 100 * trade.leverage;
  };

  // Calculate total unrealized P&L
  const totalUnrealizedPnl = openPositions.reduce((sum, t) => sum + getUnrealizedPnl(t), 0);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Portfolio
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Analytics & Performance
            </Text>
          </View>
          <View
            style={[
              styles.modeBadge,
              { backgroundColor: tradingMode === "PAPER" ? colors.success + "20" : colors.error + "20" },
            ]}
          >
            <Text
              style={[
                styles.modeText,
                { color: tradingMode === "PAPER" ? colors.success : colors.error },
              ]}
            >
              {tradingMode}
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.section}>
          <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setActiveTab("overview")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "overview" && { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "overview" ? "#FFFFFF" : colors.muted },
                ]}
              >
                Overview
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("positions")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "positions" && { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "positions" ? "#FFFFFF" : colors.muted },
                ]}
              >
                Positions ({openPositions.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("history")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "history" && { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "history" ? "#FFFFFF" : colors.muted },
                ]}
              >
                History
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Equity Curve Chart */}
            <View style={styles.section}>
              <EquityCurveChart
                equityCurve={equityCurve}
                projection={projection}
                currentBalance={wallet.balance}
                startingBalance={10000}
              />
            </View>

            {/* Performance Stats */}
            <View style={styles.section}>
              <PerformanceStatsCard stats={performanceStats} />
            </View>

            {/* Quick Stats */}
            <View style={styles.section}>
              <View style={[styles.quickStatsCard, { backgroundColor: colors.surface }]}>
                <View style={styles.quickStatRow}>
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
                      Total Balance
                    </Text>
                    <Text style={[styles.quickStatValue, { color: colors.foreground }]}>
                      {formatCurrency(wallet.balance)}
                    </Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
                      Unrealized P&L
                    </Text>
                    <Text
                      style={[
                        styles.quickStatValue,
                        { color: totalUnrealizedPnl >= 0 ? colors.success : colors.error },
                      ]}
                    >
                      {totalUnrealizedPnl >= 0 ? "+" : ""}{formatCurrency(totalUnrealizedPnl)}
                    </Text>
                  </View>
                </View>
                <View style={styles.quickStatRow}>
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
                      Open Positions
                    </Text>
                    <Text style={[styles.quickStatValue, { color: colors.foreground }]}>
                      {openPositions.length}
                    </Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
                      30-Day Projection
                    </Text>
                    <Text style={[styles.quickStatValue, { color: colors.success }]}>
                      {formatCurrency(projection[projection.length - 1]?.projectedBalance || wallet.balance)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <View style={styles.section}>
            {openPositions.length > 0 ? (
              <View style={styles.positionsList}>
                {openPositions.map(trade => (
                  <PositionCard
                    key={trade.id}
                    asset={trade.asset}
                    direction={trade.direction}
                    entryPrice={trade.entryPrice}
                    currentPrice={getCurrentPrice(trade)}
                    size={trade.size}
                    leverage={trade.leverage}
                    unrealizedPnl={getUnrealizedPnl(trade)}
                    pnlPercent={getPnlPercent(trade)}
                    mode={trade.mode}
                    onClose={() => handleClosePosition(trade.id)}
                  />
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <IconSymbol name="briefcase.fill" size={32} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No open positions
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                  Execute a signal to open a position
                </Text>
              </View>
            )}
          </View>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <View style={styles.section}>
            {closedTrades.length > 0 ? (
              <View style={styles.historyList}>
                {closedTrades.map(trade => (
                  <TradeHistoryItem
                    key={trade.id}
                    asset={trade.asset}
                    direction={trade.direction}
                    entryPrice={trade.entryPrice}
                    exitPrice={trade.exitPrice || trade.entryPrice}
                    leverage={trade.leverage}
                    pnl={trade.pnl || 0}
                    pnlPercent={trade.pnlPercent || 0}
                    mode={trade.mode}
                    closedAt={trade.closedAt || new Date()}
                  />
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <IconSymbol name="clock.fill" size={32} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No trade history
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                  Closed trades will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  quickStatsCard: {
    borderRadius: 16,
    padding: 16,
  },
  quickStatRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  quickStat: {
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  positionsList: {
    gap: 12,
  },
  historyList: {
    gap: 8,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
  },
  bottomSpacer: {
    height: 40,
  },
});
