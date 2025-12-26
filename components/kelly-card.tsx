import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, formatPercentRaw } from "@/lib/format";
import type { KellyMetrics, KellyFraction } from "@/lib/types";

interface KellyCardProps {
  metrics: KellyMetrics;
  currentFraction: KellyFraction;
  onFractionChange: (fraction: KellyFraction) => void;
  leverage?: number;
  className?: string;
}

/**
 * Kelly Criterion Card
 * 
 * Optimal position sizing with fraction options:
 * - Full Kelly: Maximum growth, high volatility
 * - Half Kelly: Balanced growth and risk
 * - Quarter Kelly: Conservative, recommended for >20x leverage
 */
export function KellyCard({
  metrics,
  currentFraction,
  onFractionChange,
  leverage = 1,
  className,
}: KellyCardProps) {
  const colors = useColors();

  // Calculate active fraction
  const fractionMultipliers: Record<KellyFraction, number> = {
    full: 1,
    half: 0.5,
    quarter: 0.25,
  };
  const activeFraction = metrics.optimalFraction * fractionMultipliers[currentFraction];
  const recommendedSize = metrics.recommendedSize * fractionMultipliers[currentFraction];

  // Recommend quarter Kelly for high leverage
  const isHighLeverage = leverage > 20;
  const recommendedFraction: KellyFraction = isHighLeverage ? "quarter" : "half";

  // Fraction options
  const fractionOptions: { key: KellyFraction; label: string; description: string }[] = [
    { key: "quarter", label: "¼ Kelly", description: "Conservative" },
    { key: "half", label: "½ Kelly", description: "Balanced" },
    { key: "full", label: "Full Kelly", description: "Aggressive" },
  ];

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="percent" size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-foreground">Kelly Criterion</Text>
            <Text className="text-xs text-muted">Optimal Position Sizing</Text>
          </View>
        </View>
        {isHighLeverage && (
          <View className="px-2 py-1 rounded-full bg-warning/20">
            <Text className="text-xs font-medium text-warning">{leverage}x Leverage</Text>
          </View>
        )}
      </View>

      {/* High Leverage Warning */}
      {isHighLeverage && currentFraction !== "quarter" && (
        <View className="mb-4 p-3 bg-warning/10 rounded-xl border border-warning/30 flex-row items-center">
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
          <Text className="text-sm text-warning ml-2 flex-1">
            Quarter Kelly recommended for {leverage}x leverage to reduce liquidation risk.
          </Text>
        </View>
      )}

      {/* Main Metric */}
      <View className="items-center py-4 bg-background rounded-xl mb-4">
        <Text className="text-sm text-muted mb-1">Recommended Position Size</Text>
        <Text className="text-4xl font-bold text-foreground">
          {formatCurrency(recommendedSize)}
        </Text>
        <Text className="text-sm text-muted mt-1">
          {formatPercentRaw(activeFraction)} of portfolio
        </Text>
      </View>

      {/* Kelly Fraction Selector */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Kelly Fraction</Text>
        <View className="flex-row gap-2">
          {fractionOptions.map((option) => {
            const isSelected = currentFraction === option.key;
            const isRecommended = option.key === recommendedFraction;
            
            return (
              <Pressable
                key={option.key}
                onPress={() => onFractionChange(option.key)}
                style={({ pressed }) => [
                  styles.fractionButton,
                  {
                    backgroundColor: isSelected ? colors.primary + "20" : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={{ color: isSelected ? colors.primary : colors.foreground }}
                  className="text-base font-semibold"
                >
                  {option.label}
                </Text>
                <Text
                  style={{ color: isSelected ? colors.primary : colors.muted }}
                  className="text-xs"
                >
                  {option.description}
                </Text>
                {isRecommended && (
                  <View 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: colors.success }}
                  >
                    <Text className="text-[8px] font-bold text-white">REC</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Metrics Grid */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Win Rate</Text>
          <Text className="text-lg font-semibold text-foreground">
            {formatPercentRaw(metrics.winRate)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">P/L Ratio</Text>
          <Text className="text-lg font-semibold text-foreground">
            {metrics.profitLossRatio.toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Trades</Text>
          <Text className="text-lg font-semibold text-foreground">
            {metrics.historicalTrades || 0}
          </Text>
        </View>
      </View>

      {/* Win/Loss Stats */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Avg Win</Text>
          <Text className="text-lg font-semibold text-success">
            +{formatCurrency(metrics.avgWin)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Avg Loss</Text>
          <Text className="text-lg font-semibold text-error">
            -{formatCurrency(metrics.avgLoss)}
          </Text>
        </View>
      </View>

      {/* Formula Reference */}
      <View className="p-3 bg-background rounded-xl">
        <Text className="text-xs text-muted text-center">
          f* = (p × (b + 1) - 1) / b
        </Text>
        <Text className="text-xs text-muted text-center mt-1">
          Optimal: {formatPercentRaw(metrics.optimalFraction)} | 
          Half: {formatPercentRaw(metrics.halfKellyFraction)} | 
          Quarter: {formatPercentRaw(metrics.quarterKellyFraction || metrics.optimalFraction * 0.25)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fractionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
  },
});
