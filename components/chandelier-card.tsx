import { View, Text } from "react-native";
import Svg, { Line, Rect, Path } from "react-native-svg";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency } from "@/lib/format";
import type { ChandelierExit } from "@/lib/types";

interface ChandelierCardProps {
  data: ChandelierExit;
  className?: string;
}

export function ChandelierCard({ data, className }: ChandelierCardProps) {
  const colors = useColors();

  // Visual representation dimensions
  const chartWidth = 280;
  const chartHeight = 120;
  const padding = 20;

  // Calculate positions
  const priceRange = data.shortStop - data.longStop;
  const getY = (price: number) =>
    padding + ((data.shortStop - price) / priceRange) * (chartHeight - padding * 2);

  const currentY = getY(data.currentPrice);
  const longStopY = getY(data.longStop);
  const shortStopY = getY(data.shortStop);

  // Distance to stops
  const distanceToLongStop = data.currentPrice - data.longStop;
  const distanceToShortStop = data.shortStop - data.currentPrice;
  const percentToLongStop = (distanceToLongStop / data.currentPrice) * 100;
  const percentToShortStop = (distanceToShortStop / data.currentPrice) * 100;

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-10 h-10 rounded-full bg-error/20 items-center justify-center">
          <IconSymbol name="shield.checkered" size={20} color={colors.error} />
        </View>
        <View>
          <Text className="text-lg font-semibold text-foreground">Chandelier Exit</Text>
          <Text className="text-xs text-muted">ATR-Based Trailing Stop</Text>
        </View>
      </View>

      {/* ATR Info */}
      <View className="flex-row gap-4 mb-4">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">ATR ({data.atrPeriod})</Text>
          <Text className="text-xl font-bold text-foreground">
            {formatCurrency(data.atr)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Multiplier</Text>
          <Text className="text-xl font-bold text-foreground">{data.multiplier}x</Text>
        </View>
      </View>

      {/* Visual Representation */}
      <View className="mb-4">
        <Text className="text-sm text-muted mb-2">Stop Levels</Text>
        <View className="bg-background rounded-xl p-2">
          <Svg width={chartWidth} height={chartHeight}>
            {/* Short stop zone (red area above) */}
            <Rect
              x={padding}
              y={shortStopY}
              width={chartWidth - padding * 2}
              height={currentY - shortStopY}
              fill={colors.error + "10"}
            />

            {/* Long stop zone (green area below) */}
            <Rect
              x={padding}
              y={currentY}
              width={chartWidth - padding * 2}
              height={longStopY - currentY}
              fill={colors.success + "10"}
            />

            {/* Short stop line */}
            <Line
              x1={padding}
              y1={shortStopY}
              x2={chartWidth - padding}
              y2={shortStopY}
              stroke={colors.error}
              strokeWidth={2}
              strokeDasharray="6,4"
            />

            {/* Current price line */}
            <Line
              x1={padding}
              y1={currentY}
              x2={chartWidth - padding}
              y2={currentY}
              stroke={colors.foreground}
              strokeWidth={2}
            />

            {/* Long stop line */}
            <Line
              x1={padding}
              y1={longStopY}
              x2={chartWidth - padding}
              y2={longStopY}
              stroke={colors.success}
              strokeWidth={2}
              strokeDasharray="6,4"
            />

            {/* Price indicator */}
            <Path
              d={`M ${chartWidth - padding - 10} ${currentY - 6} L ${chartWidth - padding} ${currentY} L ${chartWidth - padding - 10} ${currentY + 6} Z`}
              fill={colors.foreground}
            />
          </Svg>
        </View>
      </View>

      {/* Stop Levels */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between p-3 bg-background rounded-xl">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-error" />
            <Text className="text-sm text-muted">Short Stop</Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-semibold text-foreground">
              {formatCurrency(data.shortStop)}
            </Text>
            <Text className="text-xs text-error">+{percentToShortStop.toFixed(2)}%</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/30">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-foreground" />
            <Text className="text-sm text-foreground font-medium">Current Price</Text>
          </View>
          <Text className="text-base font-bold text-foreground">
            {formatCurrency(data.currentPrice)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between p-3 bg-background rounded-xl">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-success" />
            <Text className="text-sm text-muted">Long Stop</Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-semibold text-foreground">
              {formatCurrency(data.longStop)}
            </Text>
            <Text className="text-xs text-success">-{percentToLongStop.toFixed(2)}%</Text>
          </View>
        </View>
      </View>

      {/* Formula Reference */}
      <View className="mt-4 p-3 bg-background rounded-xl">
        <Text className="text-xs text-muted text-center">
          Long Stop = High - (k × ATR)
        </Text>
        <Text className="text-xs text-muted text-center mt-1">
          Short Stop = Low + (k × ATR)
        </Text>
      </View>
    </View>
  );
}
