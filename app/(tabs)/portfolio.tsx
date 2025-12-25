import { ScrollView, Text, View, RefreshControl, Pressable, StyleSheet } from "react-native";
import { useState, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { HoldingItem } from "@/components/holding-item";
import { AllocationChart } from "@/components/allocation-chart";
import { TradeItem } from "@/components/trade-item";
import { MetricCard } from "@/components/metric-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  mockPortfolioSummary,
  mockHoldings,
  mockTrades,
} from "@/lib/mock-data";

type TabType = "holdings" | "history";

export default function PortfolioScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("holdings");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const portfolio = mockPortfolioSummary;
  const holdings = mockHoldings;
  const trades = mockTrades;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Portfolio</Text>
          <Text className="text-sm text-muted mt-1">Your Holdings & History</Text>
        </View>

        {/* Portfolio Value */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-sm text-muted mb-2">Total Value</Text>
            <Text className="text-4xl font-bold text-foreground mb-2">
              {formatCurrency(portfolio.totalValue)}
            </Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center">
                <IconSymbol
                  name={portfolio.totalReturn >= 0 ? "chevron.up" : "chevron.down"}
                  size={16}
                  color={portfolio.totalReturn >= 0 ? colors.success : colors.error}
                />
                <Text
                  style={{ color: portfolio.totalReturn >= 0 ? colors.success : colors.error }}
                  className="text-base font-semibold"
                >
                  {formatCurrency(Math.abs(portfolio.totalReturn))}
                </Text>
              </View>
              <Text
                style={{ color: portfolio.totalReturnPercent >= 0 ? colors.success : colors.error }}
                className="text-sm"
              >
                {formatPercent(portfolio.totalReturnPercent)} all time
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View className="px-4 py-2">
          <View className="flex-row gap-3">
            <MetricCard
              title="Daily P&L"
              value={formatCurrency(portfolio.dailyPnL)}
              trendValue={formatPercent(portfolio.dailyPnLPercent)}
              trend={portfolio.dailyPnL >= 0 ? "up" : "down"}
              className="flex-1"
            />
            <MetricCard
              title="Positions"
              value={holdings.length.toString()}
              subtitle="assets"
              className="flex-1"
            />
          </View>
        </View>

        {/* Allocation Chart */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Asset Allocation
          </Text>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <AllocationChart holdings={holdings} size={180} />
          </View>
        </View>

        {/* Tab Selector */}
        <View className="px-4 py-3">
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            <Pressable
              onPress={() => setActiveTab("holdings")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "holdings" && styles.activeTab,
                activeTab === "holdings" && { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "holdings" ? "#FFFFFF" : colors.muted },
                ]}
              >
                Holdings
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("history")}
              style={({ pressed }) => [
                styles.tab,
                activeTab === "history" && styles.activeTab,
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
                Trade History
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Holdings List */}
        {activeTab === "holdings" && (
          <View className="px-4 py-2">
            <View className="bg-surface rounded-2xl px-4 border border-border">
              {holdings.map((holding, index) => (
                <HoldingItem
                  key={holding.id}
                  holding={holding}
                  className={index === holdings.length - 1 ? "border-b-0" : ""}
                />
              ))}
            </View>
          </View>
        )}

        {/* Trade History */}
        {activeTab === "history" && (
          <View className="px-4 py-2">
            <View className="bg-surface rounded-2xl px-4 border border-border">
              {trades.map((trade, index) => (
                <TradeItem
                  key={trade.id}
                  trade={trade}
                  className={index === trades.length - 1 ? "border-b-0" : ""}
                />
              ))}
            </View>
          </View>
        )}

        {/* Performance Summary */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Performance Summary
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <MetricCard
              title="Win Rate"
              value="62%"
              trend="up"
              className="flex-1 min-w-[45%]"
            />
            <MetricCard
              title="Avg Trade"
              value={formatCurrency(1250)}
              className="flex-1 min-w-[45%]"
            />
            <MetricCard
              title="Best Trade"
              value={formatCurrency(8500)}
              trend="up"
              className="flex-1 min-w-[45%]"
            />
            <MetricCard
              title="Worst Trade"
              value={formatCurrency(-2100)}
              trend="down"
              className="flex-1 min-w-[45%]"
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
});
