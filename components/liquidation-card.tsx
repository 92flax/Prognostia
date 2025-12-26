import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, formatPercentRaw } from "@/lib/format";
import type { LiquidationInfo } from "@/lib/types";

interface LiquidationCardProps {
  info: LiquidationInfo;
  currentPrice: number;
  leverage: number;
  side: "long" | "short";
  className?: string;
}

/**
 * Liquidation Distance Card
 * 
 * Shows how far the current price is from liquidation
 * Critical for high-leverage trading safety
 */
export function LiquidationCard({
  info,
  currentPrice,
  leverage,
  side,
  className,
}: LiquidationCardProps) {
  const colors = useColors();

  // Risk level colors
  const riskColors = {
    safe: colors.success,
    warning: colors.warning,
    danger: colors.error,
  };
  const riskColor = riskColors[info.riskLevel];

  // Gauge visualization
  const gaugeSize = 140;
  const gaugeRadius = 50;
  const gaugeStroke = 10;
  const centerX = gaugeSize / 2;
  const centerY = gaugeSize / 2 + 5;

  // Arc calculations - show percentage of distance to liquidation
  // 100% = safe, 0% = liquidated
  const safetyPercent = Math.min(info.distancePercent / 20, 1); // Normalize to 20% max
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const currentAngle = startAngle + safetyPercent * Math.PI;

  const polarToCartesian = (angle: number, radius: number) => ({
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  });

  const createArc = (start: number, end: number, radius: number) => {
    const startPoint = polarToCartesian(start, radius);
    const endPoint = polarToCartesian(end, radius);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };

  // Risk messages
  const riskMessages = {
    safe: "Position is safe",
    warning: "Monitor closely",
    danger: "High liquidation risk!",
  };

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: riskColor + "20" }}
          >
            <IconSymbol name="target" size={20} color={riskColor} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-foreground">Liquidation Distance</Text>
            <Text className="text-xs text-muted">{leverage}x {side.toUpperCase()}</Text>
          </View>
        </View>
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: riskColor + "20" }}
        >
          <Text style={{ color: riskColor }} className="text-xs font-medium capitalize">
            {info.riskLevel}
          </Text>
        </View>
      </View>

      {/* Gauge */}
      <View className="items-center mb-4">
        <Svg width={gaugeSize} height={gaugeSize / 2 + 20}>
          {/* Background arc */}
          <Path
            d={createArc(startAngle, endAngle, gaugeRadius)}
            stroke={colors.border}
            strokeWidth={gaugeStroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Danger zone (red) */}
          <Path
            d={createArc(startAngle, startAngle + Math.PI * 0.25, gaugeRadius)}
            stroke={colors.error + "80"}
            strokeWidth={gaugeStroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Warning zone (yellow) */}
          <Path
            d={createArc(startAngle + Math.PI * 0.25, startAngle + Math.PI * 0.5, gaugeRadius)}
            stroke={colors.warning + "80"}
            strokeWidth={gaugeStroke}
            fill="none"
          />

          {/* Safe zone (green) */}
          <Path
            d={createArc(startAngle + Math.PI * 0.5, endAngle, gaugeRadius)}
            stroke={colors.success + "80"}
            strokeWidth={gaugeStroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Current position indicator */}
          <Circle
            cx={polarToCartesian(currentAngle, gaugeRadius).x}
            cy={polarToCartesian(currentAngle, gaugeRadius).y}
            r={7}
            fill={riskColor}
            stroke={colors.background}
            strokeWidth={2}
          />

          {/* Center text */}
          <SvgText
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize={22}
            fontWeight="bold"
            fill={riskColor}
          >
            {info.distancePercent.toFixed(1)}%
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            fontSize={10}
            fill={colors.muted}
          >
            away
          </SvgText>
        </Svg>
      </View>

      {/* Price Info */}
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Current Price</Text>
          <Text className="text-base font-semibold text-foreground">
            {formatCurrency(currentPrice)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Liquidation Price</Text>
          <Text className="text-base font-semibold" style={{ color: colors.error }}>
            {formatCurrency(info.liquidationPrice)}
          </Text>
        </View>
      </View>

      {/* Distance Info */}
      <View className="p-3 bg-background rounded-xl mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted">Distance to Liquidation</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatCurrency(info.distanceAbsolute)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm text-muted">Margin Ratio</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatPercentRaw(info.marginRatio)}
          </Text>
        </View>
      </View>

      {/* Risk Message */}
      <View 
        className="p-3 rounded-xl flex-row items-center"
        style={{ backgroundColor: riskColor + "15" }}
      >
        <IconSymbol
          name={info.riskLevel === "danger" ? "exclamationmark.triangle.fill" : "info.circle.fill"}
          size={16}
          color={riskColor}
        />
        <Text style={{ color: riskColor }} className="text-sm font-medium ml-2 flex-1">
          {riskMessages[info.riskLevel]}
        </Text>
      </View>
    </View>
  );
}
