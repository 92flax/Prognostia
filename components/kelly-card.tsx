import { View, Text, Switch } from "react-native";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, formatPercentRaw } from "@/lib/format";
import type { KellyMetrics } from "@/lib/types";

interface KellyCardProps {
  metrics: KellyMetrics;
  useHalfKelly: boolean;
  onToggleHalfKelly: (value: boolean) => void;
  className?: string;
}

export function KellyCard({
  metrics,
  useHalfKelly,
  onToggleHalfKelly,
  className,
}: KellyCardProps) {
  const colors = useColors();
  const activeFraction = useHalfKelly ? metrics.halfKellyFraction : metrics.optimalFraction;
  const recommendedSize = metrics.recommendedSize * (useHalfKelly ? 0.5 : 1);

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
          <IconSymbol name="percent" size={20} color={colors.primary} />
        </View>
        <View>
          <Text className="text-lg font-semibold text-foreground">Kelly Criterion</Text>
          <Text className="text-xs text-muted">Optimal Position Sizing</Text>
        </View>
      </View>

      {/* Main Metric */}
      <View className="items-center py-4 border-y border-border">
        <Text className="text-sm text-muted mb-1">Recommended Position Size</Text>
        <Text className="text-4xl font-bold text-foreground">
          {formatCurrency(recommendedSize)}
        </Text>
        <Text className="text-sm text-muted mt-1">
          {formatPercentRaw(activeFraction)} of portfolio
        </Text>
      </View>

      {/* Half-Kelly Toggle */}
      <View className="flex-row items-center justify-between py-4 border-b border-border">
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground">Use Half-Kelly</Text>
          <Text className="text-xs text-muted">Conservative sizing for risk reduction</Text>
        </View>
        <Switch
          value={useHalfKelly}
          onValueChange={onToggleHalfKelly}
          trackColor={{ false: colors.border, true: colors.primary + "80" }}
          thumbColor={useHalfKelly ? colors.primary : colors.muted}
        />
      </View>

      {/* Metrics Grid */}
      <View className="pt-4">
        <View className="flex-row flex-wrap gap-y-4">
          <View className="w-1/2">
            <Text className="text-xs text-muted mb-1">Win Rate</Text>
            <Text className="text-lg font-semibold text-foreground">
              {formatPercentRaw(metrics.winRate)}
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="text-xs text-muted mb-1">P/L Ratio</Text>
            <Text className="text-lg font-semibold text-foreground">
              {metrics.profitLossRatio.toFixed(2)}
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="text-xs text-muted mb-1">Avg Win</Text>
            <Text className="text-lg font-semibold text-success">
              {formatCurrency(metrics.avgWin)}
            </Text>
          </View>
          <View className="w-1/2">
            <Text className="text-xs text-muted mb-1">Avg Loss</Text>
            <Text className="text-lg font-semibold text-error">
              {formatCurrency(metrics.avgLoss)}
            </Text>
          </View>
        </View>
      </View>

      {/* Formula Reference */}
      <View className="mt-4 p-3 bg-background rounded-xl">
        <Text className="text-xs text-muted text-center">
          f* = (p × (b + 1) - 1) / b
        </Text>
        <Text className="text-xs text-muted text-center mt-1">
          where p = win rate, b = profit/loss ratio
        </Text>
      </View>
    </View>
  );
}
