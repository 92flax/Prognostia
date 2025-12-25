import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { MetricCard } from "@/components/metric-card";
import { MarketCard } from "@/components/market-card";
import { AISignalCard } from "@/components/ai-signal-card";
import { TradeItem } from "@/components/trade-item";
import { QuickActionButton } from "@/components/quick-action-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  mockPortfolioSummary,
  mockMarketData,
  mockAISignal,
  mockTrades,
} from "@/lib/mock-data";

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const portfolio = mockPortfolioSummary;
  const markets = mockMarketData.slice(0, 3);
  const signal = mockAISignal;
  const recentTrades = mockTrades.slice(0, 3);

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
          <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-sm text-muted mt-1">AQTE Trading Engine</Text>
        </View>

        {/* Portfolio Summary */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-sm text-muted mb-2">Total Portfolio Value</Text>
            <Text className="text-4xl font-bold text-foreground mb-2">
              {formatCurrency(portfolio.totalValue)}
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <IconSymbol
                  name={portfolio.dailyPnL >= 0 ? "chevron.up" : "chevron.down"}
                  size={16}
                  color={portfolio.dailyPnL >= 0 ? colors.success : colors.error}
                />
                <Text
                  style={{ color: portfolio.dailyPnL >= 0 ? colors.success : colors.error }}
                  className="text-base font-semibold"
                >
                  {formatCurrency(Math.abs(portfolio.dailyPnL))}
                </Text>
              </View>
              <Text
                style={{ color: portfolio.dailyPnLPercent >= 0 ? colors.success : colors.error }}
                className="text-sm"
              >
                {formatPercent(portfolio.dailyPnLPercent)} today
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-4 py-2">
          <View className="flex-row gap-3">
            <MetricCard
              title="Total Return"
              value={formatPercent(portfolio.totalReturnPercent)}
              trend={portfolio.totalReturn >= 0 ? "up" : "down"}
              className="flex-1"
            />
            <MetricCard
              title="Win Rate"
              value="62%"
              subtitle="Last 30 days"
              className="flex-1"
            />
          </View>
        </View>

        {/* AI Signal */}
        <View className="px-4 py-3">
          <AISignalCard
            signal={signal}
            onPress={() => router.push("/(tabs)/ai")}
          />
        </View>

        {/* Quick Actions */}
        <View className="px-4 py-2">
          <View className="flex-row gap-3">
            <QuickActionButton type="buy" onPress={() => {}} />
            <QuickActionButton type="sell" onPress={() => {}} />
          </View>
        </View>

        {/* Market Overview */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">Markets</Text>
            <Text className="text-sm text-primary">See All</Text>
          </View>
          {markets.map((market) => (
            <MarketCard key={market.symbol} data={market} />
          ))}
        </View>

        {/* Recent Activity */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">Recent Activity</Text>
            <Text
              className="text-sm text-primary"
              onPress={() => router.push("/(tabs)/portfolio")}
            >
              View All
            </Text>
          </View>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            {recentTrades.map((trade, index) => (
              <TradeItem
                key={trade.id}
                trade={trade}
                className={index === recentTrades.length - 1 ? "border-b-0" : ""}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
