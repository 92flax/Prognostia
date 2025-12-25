import { View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";

interface SentimentGaugeProps {
  score: number; // -1 to 1
  size?: number;
}

export function SentimentGauge({ score, size = 160 }: SentimentGaugeProps) {
  const colors = useColors();
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc calculations (180 degree arc)
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const angleRange = endAngle - startAngle;

  // Normalize score from -1..1 to 0..1
  const normalizedScore = (score + 1) / 2;
  const currentAngle = startAngle + normalizedScore * angleRange;

  // Create arc path
  const createArc = (startA: number, endA: number) => {
    const startX = center + radius * Math.cos(startA);
    const startY = center + radius * Math.sin(startA);
    const endX = center + radius * Math.cos(endA);
    const endY = center + radius * Math.sin(endA);
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
  };

  // Indicator position
  const indicatorX = center + radius * Math.cos(currentAngle);
  const indicatorY = center + radius * Math.sin(currentAngle);

  // Determine sentiment color and label
  const getSentimentInfo = (s: number) => {
    if (s > 0.2) return { color: colors.success, label: "Positive" };
    if (s < -0.2) return { color: colors.error, label: "Negative" };
    return { color: colors.warning, label: "Neutral" };
  };

  const sentimentInfo = getSentimentInfo(score);
  const scorePercent = Math.round(score * 100);

  return (
    <View className="items-center">
      <Svg width={size} height={size / 2 + 20}>
        {/* Background arc */}
        <Path
          d={createArc(startAngle, endAngle)}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Colored arc */}
        <Path
          d={createArc(startAngle, currentAngle)}
          stroke={sentimentInfo.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Indicator dot */}
        <Circle
          cx={indicatorX}
          cy={indicatorY}
          r={8}
          fill={sentimentInfo.color}
          stroke={colors.background}
          strokeWidth={3}
        />
      </Svg>

      {/* Score display */}
      <View className="items-center -mt-4">
        <Text className="text-3xl font-bold text-foreground">
          {scorePercent > 0 ? "+" : ""}
          {scorePercent}
        </Text>
        <Text style={{ color: sentimentInfo.color }} className="text-base font-semibold">
          {sentimentInfo.label}
        </Text>
      </View>

      {/* Scale labels */}
      <View className="flex-row justify-between w-full px-2 mt-2">
        <Text className="text-xs text-error">Bearish</Text>
        <Text className="text-xs text-muted">Neutral</Text>
        <Text className="text-xs text-success">Bullish</Text>
      </View>
    </View>
  );
}
