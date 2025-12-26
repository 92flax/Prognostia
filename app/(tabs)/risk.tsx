import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useState, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { KellyCard } from "@/components/kelly-card";
import { VolatilityCard } from "@/components/volatility-card";
import { ChandelierCard } from "@/components/chandelier-card";
import { LiquidationCard } from "@/components/liquidation-card";
import { SmartLeverageCard } from "@/components/smart-leverage-card";
import { MetricCard } from "@/components/metric-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatPercentRaw } from "@/lib/format";
import {
  mockKellyMetrics,
  mockVolatilityMetrics,
  mockChandelierExit,
  mockRiskSettings,
  mockLiquidationInfo,
} from "@/lib/mock-data";
import type { KellyFraction } from "@/lib/types";

export default function RiskScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [kellyFraction, setKellyFraction] = useState<KellyFraction>(
    mockRiskSettings.kellyFraction || "half"
  );
  const [leverage, setLeverage] = useState(mockRiskSettings.maxLeverage);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const kelly = mockKellyMetrics;
  const volatility = mockVolatilityMetrics;
  const chandelier = mockChandelierExit;
  const liquidation = mockLiquidationInfo;

  // Calculate overall risk score
  const riskScore = Math.round(
    ((kelly.winRate * 0.4) +
      (1 - volatility.currentVolatility) * 0.3 +
      (volatility.positionAdjustment) * 0.3) *
      100
  );

  // Determine risk level based on leverage and liquidation distance
  const getRiskLevel = () => {
    if (leverage > 50 || liquidation.distancePercent < 2) return "high";
    if (leverage > 20 || liquidation.distancePercent < 5) return "moderate";
    return "low";
  };
  const riskLevel = getRiskLevel();

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
            High-Leverage Safety Engine
          </Text>
        </View>

        {/* Risk Overview */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm text-muted">Overall Risk Score</Text>
              <View className="flex-row items-center gap-1">
                <IconSymbol 
                  name="shield.checkered" 
                  size={16} 
                  color={riskLevel === "low" ? colors.success : riskLevel === "moderate" ? colors.warning : colors.error} 
                />
                <Text 
                  style={{ color: riskLevel === "low" ? colors.success : riskLevel === "moderate" ? colors.warning : colors.error }}
                  className="text-sm capitalize"
                >
                  {riskLevel} Risk
                </Text>
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
                <Text className="text-xs text-muted mb-1">Current Leverage</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {leverage}x
                </Text>
              </View>
              <View className="flex-1 p-3 bg-background rounded-xl">
                <Text className="text-xs text-muted mb-1">Liq. Distance</Text>
                <Text 
                  className="text-lg font-semibold"
                  style={{ color: liquidation.distancePercent < 5 ? colors.error : colors.foreground }}
                >
                  {liquidation.distancePercent.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-1 p-3 bg-background rounded-xl">
                <Text className="text-xs text-muted mb-1">Kelly</Text>
                <Text className="text-lg font-semibold text-foreground capitalize">
                  {kellyFraction === "quarter" ? "¼" : kellyFraction === "half" ? "½" : "Full"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Liquidation Distance */}
        <View className="px-4 py-3">
          <LiquidationCard
            info={liquidation}
            currentPrice={98432.50}
            leverage={leverage}
            side="long"
          />
        </View>

        {/* Smart Leverage Selector */}
        <View className="px-4 py-3">
          <SmartLeverageCard
            volatility={volatility}
            currentLeverage={leverage}
            onLeverageChange={setLeverage}
          />
        </View>

        {/* Kelly Criterion */}
        <View className="px-4 py-3">
          <KellyCard
            metrics={kelly}
            currentFraction={kellyFraction}
            onFractionChange={setKellyFraction}
            leverage={leverage}
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

        {/* High Leverage Warning */}
        {leverage > 20 && (
          <View className="px-4 py-3">
            <View className="bg-error/10 rounded-2xl p-4 border border-error/30">
              <View className="flex-row items-center gap-2 mb-2">
                <IconSymbol name="flame.fill" size={20} color={colors.error} />
                <Text className="text-base font-semibold text-error">High Leverage Warning</Text>
              </View>
              <Text className="text-sm text-muted leading-5">
                You are using {leverage}x leverage. At this level, a {(100 / leverage).toFixed(1)}% 
                adverse price move will liquidate your position. Consider using Quarter Kelly 
                position sizing and setting tight stop losses.
              </Text>
            </View>
          </View>
        )}

        {/* Risk Warning */}
        <View className="px-4 py-3">
          <View className="bg-warning/10 rounded-2xl p-4 border border-warning/30">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
              <Text className="text-base font-semibold text-foreground">Risk Disclaimer</Text>
            </View>
            <Text className="text-sm text-muted leading-5">
              Leveraged trading carries significant risk of loss. The Kelly Criterion and volatility 
              targeting are mathematical models that may not account for all market conditions. 
              Never trade with funds you cannot afford to lose.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
