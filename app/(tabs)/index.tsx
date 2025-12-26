import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { MetricCard } from "@/components/metric-card";
import { MarketCard } from "@/components/market-card";
import { AISignalCard } from "@/components/ai-signal-card";
import { TradeItem } from "@/components/trade-item";
import { QuickActionButton } from "@/components/quick-action-button";
import { TradingModeToggle, TradingModeBadge } from "@/components/trading-mode-toggle";
import { PaperWalletCard } from "@/components/paper-wallet-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  mockPortfolioSummary,
  mockMarketData,
  mockAISignal,
  mockTrades,
  mockPaperWallet,
  mockTradingMode,
} from "@/lib/mock-data";
import type { TradingMode } from "@/lib/types";

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [tradingMode, setTradingMode] = useState<TradingMode>(mockTradingMode);
  const [paperWallet, setPaperWallet] = useState(mockPaperWallet);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleModeChange = (mode: TradingMode) => {
    setTradingMode(mode);
    // In production, this would persist to AsyncStorage and update backend
  };

  const handleResetPaperWallet = () => {
    setPaperWallet({
      ...paperWallet,
      usdtBalance: 10000,
      btcBalance: 0,
      ethBalance: 0,
      totalPnl: 0,
      totalTrades: 0,
      winningTrades: 0,
      maxDrawdown: 0,
      peakBalance: 10000,
    });
  };

  const portfolio = mockPortfolioSummary;
  const markets = mockMarketData.slice(0, 3);
  const signal = mockAISignal;
  const recentTrades = mockTrades.slice(0, 3);
  const isSimulation = tradingMode === "simulation";

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Trading Mode */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
              <Text className="text-sm text-muted mt-1">AQTE Trading Engine</Text>
            </View>
            <TradingModeBadge mode={tradingMode} />
          </View>
        </View>

        {/* Trading Mode Toggle */}
        <View className="px-4 py-3 items-center">
          <TradingModeToggle
            mode={tradingMode}
            onModeChange={handleModeChange}
          />
        </View>

        {/* Simulation Mode Warning */}
        {isSimulation && (
          <View className="px-4 py-2">
            <View className="bg-primary/10 rounded-xl p-3 border border-primary/30 flex-row items-center">
              <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
              <Text className="text-sm text-primary ml-2 flex-1">
                Paper trading mode active. No real funds at risk.
              </Text>
            </View>
          </View>
        )}

        {/* Live Mode Warning */}
        {!isSimulation && (
          <View className="px-4 py-2">
            <View className="bg-error/10 rounded-xl p-3 border border-error/30 flex-row items-center">
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />
              <Text className="text-sm text-error ml-2 flex-1">
                Live trading mode. Real funds at risk!
              </Text>
            </View>
          </View>
        )}

        {/* Paper Wallet (Simulation Mode) */}
        {isSimulation && (
          <View className="px-4 py-3">
            <PaperWalletCard
              wallet={paperWallet}
              onReset={handleResetPaperWallet}
            />
          </View>
        )}

        {/* Portfolio Summary (Live Mode) */}
        {!isSimulation && (
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
        )}

        {/* Quick Stats */}
        <View className="px-4 py-2">
          <View className="flex-row gap-3">
            <MetricCard
              title="Total Return"
              value={formatPercent(isSimulation ? (paperWallet.totalPnl / paperWallet.initialBalance) * 100 : portfolio.totalReturnPercent)}
              trend={(isSimulation ? paperWallet.totalPnl : portfolio.totalReturn) >= 0 ? "up" : "down"}
              className="flex-1"
            />
            <MetricCard
              title="Win Rate"
              value={isSimulation 
                ? `${((paperWallet.winningTrades / Math.max(paperWallet.totalTrades, 1)) * 100).toFixed(0)}%`
                : "62%"
              }
              subtitle={isSimulation ? `${paperWallet.totalTrades} trades` : "Last 30 days"}
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
            <QuickActionButton 
              type="buy" 
              onPress={() => {}}
              label={isSimulation ? "Paper Buy" : "Buy"}
            />
            <QuickActionButton 
              type="sell" 
              onPress={() => {}}
              label={isSimulation ? "Paper Sell" : "Sell"}
            />
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
            <Text className="text-lg font-semibold text-foreground">
              {isSimulation ? "Paper Trades" : "Recent Activity"}
            </Text>
            <Text
              className="text-sm text-primary"
              onPress={() => router.push("/(tabs)/portfolio")}
            >
              View All
            </Text>
          </View>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            {recentTrades
              .filter(t => isSimulation ? t.isSimulated : !t.isSimulated)
              .slice(0, 3)
              .map((trade, index, arr) => (
                <TradeItem
                  key={trade.id}
                  trade={trade}
                  className={index === arr.length - 1 ? "border-b-0" : ""}
                />
              ))}
            {recentTrades.filter(t => isSimulation ? t.isSimulated : !t.isSimulated).length === 0 && (
              <View className="py-8 items-center">
                <Text className="text-muted">No trades yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
