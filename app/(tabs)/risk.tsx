import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useState, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { KellyCard } from "@/components/kelly-card";
import { VolatilityCard } from "@/components/volatility-card";
import { ChandelierCard } from "@/components/chandelier-card";
import { MetricCard } from "@/components/metric-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercentRaw } from "@/lib/format";
import {
  mockKellyMetrics,
  mockVolatilityMetrics,
  mockChandelierExit,
  mockRiskSettings,
} from "@/lib/mock-data";

export default function RiskScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [useHalfKelly, setUseHalfKelly] = useState(mockRiskSettings.useHalfKelly);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const kelly = mockKellyMetrics;
  const volatility = mockVolatilityMetrics;
  const chandelier = mockChandelierExit;

  // Calculate overall risk score
  const riskScore = Math.round(
    ((kelly.winRate * 0.4) +
      (1 - volatility.currentVolatility) * 0.3 +
      (volatility.positionAdjustment) * 0.3) *
      100
  );

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
          <Text className="text-3xl font-bold text-foreground">Risk Management</Text>
          <Text className="text-sm text-muted mt-1">
            Quantitative Risk Controls
          </Text>
        </View>

        {/* Risk Overview */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm text-muted">Overall Risk Score</Text>
              <View className="flex-row items-center gap-1">
                <IconSymbol name="shield.checkered" size={16} color={colors.success} />
                <Text className="text-sm text-success">Healthy</Text>
              </View>
            </View>

            {/* Risk Score Bar */}
            <View className="mb-4">
              <View className="flex-row items-end justify-between mb-2">
                <Text className="text-4xl font-bold text-foreground">{riskScore}</Text>
                <Text className="text-sm text-muted mb-1">/ 100</Text>
              </View>
              <View className="h-3 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${riskScore}%`,
                    backgroundColor:
                      riskScore > 70
                        ? colors.success
                        : riskScore > 40
                        ? colors.warning
                        : colors.error,
                  }}
                />
              </View>
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-3">
              <View className="flex-1 p-3 bg-background rounded-xl">
                <Text className="text-xs text-muted mb-1">Max Leverage</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {mockRiskSettings.maxLeverage}x
                </Text>
              </View>
              <View className="flex-1 p-3 bg-background rounded-xl">
                <Text className="text-xs text-muted mb-1">Vol Target</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {formatPercentRaw(mockRiskSettings.targetVolatility)}
                </Text>
              </View>
              <View className="flex-1 p-3 bg-background rounded-xl">
                <Text className="text-xs text-muted mb-1">ATR Mult</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {mockRiskSettings.atrMultiplier}x
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Kelly Criterion */}
        <View className="px-4 py-3">
          <KellyCard
            metrics={kelly}
            useHalfKelly={useHalfKelly}
            onToggleHalfKelly={setUseHalfKelly}
          />
        </View>

        {/* Volatility Targeting */}
        <View className="px-4 py-3">
          <VolatilityCard metrics={volatility} />
        </View>

        {/* Chandelier Exit */}
        <View className="px-4 py-3">
          <ChandelierCard data={chandelier} />
        </View>

        {/* Risk Metrics Summary */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Performance Metrics
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <MetricCard
              title="Sharpe Ratio"
              value="1.85"
              trend="up"
              className="flex-1 min-w-[45%]"
            />
            <MetricCard
              title="Sortino Ratio"
              value="2.34"
              trend="up"
              className="flex-1 min-w-[45%]"
            />
            <MetricCard
              title="Max Drawdown"
              value="-12.5%"
              trend="down"
              className="flex-1 min-w-[45%]"
            />
            <MetricCard
              title="Calmar Ratio"
              value="2.03"
              trend="up"
              className="flex-1 min-w-[45%]"
            />
          </View>
        </View>

        {/* Risk Warning */}
        <View className="px-4 py-3">
          <View className="bg-warning/10 rounded-2xl p-4 border border-warning/30">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
              <Text className="text-base font-semibold text-foreground">Risk Disclaimer</Text>
            </View>
            <Text className="text-sm text-muted leading-5">
              Past performance does not guarantee future results. The Kelly Criterion and other
              risk metrics are mathematical models that may not account for all market conditions.
              Always use proper risk management and never invest more than you can afford to lose.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
