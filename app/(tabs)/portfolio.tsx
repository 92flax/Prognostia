import { ScrollView, Text, View, RefreshControl, Pressable, StyleSheet, Alert } from "react-native";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PositionCard } from "@/components/position-card";
import { TradeHistoryItem } from "@/components/trade-history-item";
import { MetricCard } from "@/components/metric-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  MOCK_TRADE_HISTORY,
  MOCK_PAPER_WALLET,
  MockTrade,
} from "@/lib/mock-trading-data";

type TabType = "positions" | "history";

/**
 * Portfolio Screen - View positions and trade history
 * 
 * Features:
 * - Paper wallet balance overview
 * - Open positions list
 * - Trade history
 * - Performance metrics
 */
export default function PortfolioScreen() {
  const colors = useColors();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const [tradingMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [wallet, setWallet] = useState(MOCK_PAPER_WALLET);
  const [trades, setTrades] = useState<MockTrade[]>(MOCK_TRADE_HISTORY);

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
            // Simulate closing position
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
  const winRate = wallet.totalTrades > 0
    ? ((wallet.winningTrades / wallet.totalTrades) * 100)
    : 0;

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
              Positions & Trade History
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

        {/* Balance Overview */}
        <View style={styles.section}>
          <View
            style={[
              styles.balanceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.balanceHeader}>
              <Text style={[styles.balanceLabel, { color: colors.muted }]}>
                {tradingMode === "PAPER" ? "Paper Balance" : "Account Balance"}
              </Text>
              <Text style={[styles.balanceValue, { color: colors.foreground }]}>
                {formatCurrency(wallet.balance)}
              </Text>
            </View>

            {openPositions.length > 0 && (
              <View
                style={[
                  styles.unrealizedPnl,
                  { backgroundColor: totalUnrealizedPnl >= 0 ? colors.success + "10" : colors.error + "10" },
                ]}
              >
                <Text style={[styles.unrealizedLabel, { color: colors.muted }]}>
                  Unrealized P&L
                </Text>
                <Text
                  style={[
                    styles.unrealizedValue,
                    { color: totalUnrealizedPnl >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {totalUnrealizedPnl >= 0 ? "+" : ""}{formatCurrency(totalUnrealizedPnl)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Total P&L"
              value={formatCurrency(wallet.totalPnl)}
              trend={wallet.totalPnl >= 0 ? "up" : "down"}
              className="flex-1"
            />
            <MetricCard
              title="Win Rate"
              value={formatPercent(winRate)}
              subtitle={`${wallet.winningTrades}/${wallet.totalTrades} trades`}
              className="flex-1"
            />
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.section}>
          <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                Open Positions ({openPositions.length})
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
                History ({closedTrades.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Open Positions */}
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

        {/* Trade History */}
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
                    exitPrice={trade.exitPrice!}
                    pnl={trade.pnl!}
                    pnlPercent={trade.pnlPercent!}
                    leverage={trade.leverage}
                    mode={trade.mode}
                    closedAt={trade.closedAt!}
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
                <IconSymbol name="clock.arrow.circlepath" size={32} color={colors.muted} />
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
    alignItems: "center",
    justifyContent: "space-between",
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
    marginTop: 2,
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  balanceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  balanceHeader: {
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  unrealizedPnl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  unrealizedLabel: {
    fontSize: 13,
  },
  unrealizedValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
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
    opacity: 0.8,
  },
  positionsList: {
    gap: 12,
  },
  historyList: {
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 13,
  },
  bottomSpacer: {
    height: 40,
  },
});
