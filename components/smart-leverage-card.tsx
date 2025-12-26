import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPercentRaw } from "@/lib/format";
import type { VolatilityMetrics } from "@/lib/types";

interface SmartLeverageCardProps {
  volatility: VolatilityMetrics;
  currentLeverage: number;
  onLeverageChange: (leverage: number) => void;
  className?: string;
}

/**
 * Smart Leverage Selector
 * 
 * Formula: MaxLeverage = (1 / DailyVolatility) * SafetyFactor
 * 
 * Example: If BTC moves 5% a day:
 * - MaxLeverage = (1 / 0.05) * 0.5 = 10x
 * - This prevents noise liquidation from normal daily swings
 */
export function SmartLeverageCard({
  volatility,
  currentLeverage,
  onLeverageChange,
  className,
}: SmartLeverageCardProps) {
  const colors = useColors();
  const [selectedLeverage, setSelectedLeverage] = useState(currentLeverage);

  // Calculate recommended leverage based on volatility
  const safetyFactor = 0.5; // Conservative
  const maxExchangeLeverage = 125;
  const rawMaxLeverage = (1 / volatility.currentVolatility) * safetyFactor;
  const recommendedMax = Math.min(Math.floor(rawMaxLeverage), maxExchangeLeverage);
  
  // Leverage presets based on volatility
  const leveragePresets = [
    { label: "Safe", value: Math.max(1, Math.floor(recommendedMax * 0.3)), color: colors.success },
    { label: "Moderate", value: Math.max(1, Math.floor(recommendedMax * 0.6)), color: colors.warning },
    { label: "Aggressive", value: recommendedMax, color: colors.error },
  ];

  // Risk level based on current leverage vs recommended
  const riskRatio = selectedLeverage / recommendedMax;
  const riskLevel = riskRatio <= 0.3 ? "safe" : riskRatio <= 0.7 ? "moderate" : "high";
  const riskColor = riskLevel === "safe" ? colors.success : riskLevel === "moderate" ? colors.warning : colors.error;

  // Gauge visualization
  const gaugeSize = 160;
  const gaugeRadius = 60;
  const gaugeStroke = 12;
  const centerX = gaugeSize / 2;
  const centerY = gaugeSize / 2 + 10;

  // Arc calculations (180 degree arc)
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const leverageAngle = startAngle + (selectedLeverage / maxExchangeLeverage) * Math.PI;
  const recommendedAngle = startAngle + (recommendedMax / maxExchangeLeverage) * Math.PI;

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

  const handlePresetSelect = (value: number) => {
    setSelectedLeverage(value);
    onLeverageChange(value);
  };

  const incrementLeverage = () => {
    const newValue = Math.min(selectedLeverage + 1, maxExchangeLeverage);
    setSelectedLeverage(newValue);
    onLeverageChange(newValue);
  };

  const decrementLeverage = () => {
    const newValue = Math.max(selectedLeverage - 1, 1);
    setSelectedLeverage(newValue);
    onLeverageChange(newValue);
  };

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-foreground">Smart Leverage</Text>
            <Text className="text-xs text-muted">Volatility-Based Selection</Text>
          </View>
        </View>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: riskColor + "20" }}>
          <Text style={{ color: riskColor }} className="text-xs font-medium capitalize">
            {riskLevel} Risk
          </Text>
        </View>
      </View>

      {/* Volatility Info */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Daily Volatility</Text>
          <Text className="text-lg font-bold text-foreground">
            {formatPercentRaw(volatility.currentVolatility)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">Recommended Max</Text>
          <Text className="text-lg font-bold text-primary">{recommendedMax}x</Text>
        </View>
      </View>

      {/* Gauge Visualization */}
      <View className="items-center mb-4">
        <Svg width={gaugeSize} height={gaugeSize / 2 + 30}>
          {/* Background arc */}
          <Path
            d={createArc(startAngle, endAngle, gaugeRadius)}
            stroke={colors.border}
            strokeWidth={gaugeStroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Safe zone (green) */}
          <Path
            d={createArc(startAngle, startAngle + Math.PI * 0.3, gaugeRadius)}
            stroke={colors.success + "60"}
            strokeWidth={gaugeStroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Moderate zone (yellow) */}
          <Path
            d={createArc(startAngle + Math.PI * 0.3, startAngle + Math.PI * 0.7, gaugeRadius)}
            stroke={colors.warning + "60"}
            strokeWidth={gaugeStroke}
            fill="none"
          />

          {/* Danger zone (red) */}
          <Path
            d={createArc(startAngle + Math.PI * 0.7, endAngle, gaugeRadius)}
            stroke={colors.error + "60"}
            strokeWidth={gaugeStroke}
            fill="none"
            strokeLinecap="round"
          />

          {/* Recommended max marker */}
          <Circle
            cx={polarToCartesian(recommendedAngle, gaugeRadius).x}
            cy={polarToCartesian(recommendedAngle, gaugeRadius).y}
            r={4}
            fill={colors.primary}
          />

          {/* Current leverage indicator */}
          <Circle
            cx={polarToCartesian(leverageAngle, gaugeRadius).x}
            cy={polarToCartesian(leverageAngle, gaugeRadius).y}
            r={8}
            fill={riskColor}
            stroke={colors.background}
            strokeWidth={2}
          />

          {/* Center text */}
          <SvgText
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize={28}
            fontWeight="bold"
            fill={colors.foreground}
          >
            {selectedLeverage}x
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize={12}
            fill={colors.muted}
          >
            Leverage
          </SvgText>
        </Svg>
      </View>

      {/* Manual Adjustment */}
      <View className="flex-row items-center justify-center gap-4 mb-4">
        <Pressable
          onPress={decrementLeverage}
          style={({ pressed }) => [
            styles.adjustButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "600" }}>−</Text>
        </Pressable>

        <View className="w-20 items-center">
          <Text className="text-2xl font-bold text-foreground">{selectedLeverage}x</Text>
        </View>

        <Pressable
          onPress={incrementLeverage}
          style={({ pressed }) => [
            styles.adjustButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "600" }}>+</Text>
        </Pressable>
      </View>

      {/* Preset Buttons */}
      <View className="flex-row gap-2">
        {leveragePresets.map((preset) => (
          <Pressable
            key={preset.label}
            onPress={() => handlePresetSelect(preset.value)}
            style={({ pressed }) => [
              styles.presetButton,
              {
                backgroundColor: selectedLeverage === preset.value ? preset.color + "20" : colors.background,
                borderColor: selectedLeverage === preset.value ? preset.color : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={{ color: selectedLeverage === preset.value ? preset.color : colors.muted }}
              className="text-xs font-medium"
            >
              {preset.label}
            </Text>
            <Text
              style={{ color: selectedLeverage === preset.value ? preset.color : colors.foreground }}
              className="text-sm font-bold"
            >
              {preset.value}x
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Warning for high leverage */}
      {selectedLeverage > recommendedMax && (
        <View className="mt-4 p-3 bg-error/10 rounded-xl border border-error/30">
          <View className="flex-row items-center gap-2">
            <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.error} />
            <Text className="text-sm text-error font-medium flex-1">
              Leverage exceeds recommended maximum ({recommendedMax}x) based on current volatility.
            </Text>
          </View>
        </View>
      )}

      {/* Formula Reference */}
      <View className="mt-4 p-3 bg-background rounded-xl">
        <Text className="text-xs text-muted text-center">
          MaxLeverage = (1 / DailyVolatility) × SafetyFactor
        </Text>
        <Text className="text-xs text-muted text-center mt-1">
          = (1 / {(volatility.currentVolatility * 100).toFixed(1)}%) × 0.5 = {recommendedMax}x
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
