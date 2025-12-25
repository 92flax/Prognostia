import { View, Text } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPercentRaw } from "@/lib/format";
import type { VolatilityMetrics } from "@/lib/types";

interface VolatilityCardProps {
  metrics: VolatilityMetrics;
  className?: string;
}

export function VolatilityCard({ metrics, className }: VolatilityCardProps) {
  const colors = useColors();
  const isAboveTarget = metrics.currentVolatility > metrics.targetVolatility;
  const adjustmentPercent = Math.round((1 - metrics.positionAdjustment) * 100);

  // Mini chart dimensions
  const chartWidth = 280;
  const chartHeight = 80;
  const padding = 10;

  // Calculate chart points
  const data = metrics.rollingVolatility;
  const minVal = Math.min(...data, metrics.targetVolatility) * 0.9;
  const maxVal = Math.max(...data) * 1.1;
  const range = maxVal - minVal;

  const getY = (val: number) =>
    padding + chartHeight - padding * 2 - ((val - minVal) / range) * (chartHeight - padding * 2);
  const getX = (i: number) =>
    padding + (i / (data.length - 1)) * (chartWidth - padding * 2);

  const linePath = data.reduce((path, val, i) => {
    const x = getX(i);
    const y = getY(val);
    return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, "");

  const targetY = getY(metrics.targetVolatility);

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-10 h-10 rounded-full bg-warning/20 items-center justify-center">
          <IconSymbol name="chart.bar.fill" size={20} color={colors.warning} />
        </View>
        <View>
          <Text className="text-lg font-semibold text-foreground">Volatility Targeting</Text>
          <Text className="text-xs text-muted">Position Size Adjustment</Text>
        </View>
      </View>

      {/* Current vs Target */}
      <View className="flex-row gap-4 mb-4">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Current</Text>
          <Text
            className="text-2xl font-bold"
            style={{ color: isAboveTarget ? colors.warning : colors.success }}
          >
            {formatPercentRaw(metrics.currentVolatility)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Target</Text>
          <Text className="text-2xl font-bold text-foreground">
            {formatPercentRaw(metrics.targetVolatility)}
          </Text>
        </View>
      </View>

      {/* Rolling Volatility Chart */}
      <View className="mb-4">
        <Text className="text-sm text-muted mb-2">Rolling Volatility (22-day)</Text>
        <View className="bg-background rounded-xl p-2">
          <Svg width={chartWidth} height={chartHeight}>
            {/* Target line */}
            <Line
              x1={padding}
              y1={targetY}
              x2={chartWidth - padding}
              y2={targetY}
              stroke={colors.primary}
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />

            {/* Volatility line */}
            <Path
              d={linePath}
              stroke={isAboveTarget ? colors.warning : colors.success}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current point */}
            <Circle
              cx={getX(data.length - 1)}
              cy={getY(data[data.length - 1])}
              r={4}
              fill={isAboveTarget ? colors.warning : colors.success}
            />
          </Svg>
        </View>
      </View>

      {/* Position Adjustment */}
      <View className="p-3 bg-background rounded-xl">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted">Position Adjustment</Text>
          <View className="flex-row items-center gap-1">
            <IconSymbol
              name={isAboveTarget ? "arrow.down.circle.fill" : "checkmark.circle.fill"}
              size={16}
              color={isAboveTarget ? colors.warning : colors.success}
            />
            <Text
              className="text-base font-semibold"
              style={{ color: isAboveTarget ? colors.warning : colors.success }}
            >
              {isAboveTarget ? `Reduce ${adjustmentPercent}%` : "On Target"}
            </Text>
          </View>
        </View>
        {isAboveTarget && (
          <Text className="text-xs text-muted mt-2">
            Current volatility exceeds target. Reduce position size to maintain risk budget.
          </Text>
        )}
      </View>
    </View>
  );
}
