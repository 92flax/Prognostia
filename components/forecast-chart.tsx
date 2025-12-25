import { View, Text } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency } from "@/lib/format";

interface ForecastChartProps {
  currentPrice: number;
  predictions: {
    horizon: string;
    predicted: number;
    lower: number;
    upper: number;
  }[];
  width?: number;
  height?: number;
}

export function ForecastChart({
  currentPrice,
  predictions,
  width = 320,
  height = 200,
}: ForecastChartProps) {
  const colors = useColors();
  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate price range
  const allPrices = [
    currentPrice,
    ...predictions.flatMap((p) => [p.predicted, p.lower, p.upper]),
  ];
  const minPrice = Math.min(...allPrices) * 0.95;
  const maxPrice = Math.max(...allPrices) * 1.05;
  const priceRange = maxPrice - minPrice;

  // Calculate positions
  const getY = (price: number) =>
    padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const getX = (index: number) =>
    padding.left + (index / predictions.length) * chartWidth;

  // Create paths
  const points = [
    { x: padding.left, y: getY(currentPrice), price: currentPrice },
    ...predictions.map((p, i) => ({
      x: getX(i + 1),
      y: getY(p.predicted),
      price: p.predicted,
    })),
  ];

  const upperPoints = [
    { x: padding.left, y: getY(currentPrice) },
    ...predictions.map((p, i) => ({ x: getX(i + 1), y: getY(p.upper) })),
  ];

  const lowerPoints = [
    { x: padding.left, y: getY(currentPrice) },
    ...predictions.map((p, i) => ({ x: getX(i + 1), y: getY(p.lower) })),
  ];

  const linePath = points.reduce((path, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
  }, "");

  const confidencePath =
    upperPoints.reduce((path, point, i) => {
      return i === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
    }, "") +
    lowerPoints
      .reverse()
      .reduce((path, point) => `${path} L ${point.x} ${point.y}`, "") +
    " Z";

  const labels = ["Now", "24h", "7d", "30d"];

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <Text className="text-lg font-semibold text-foreground mb-4">
        Price Forecast
      </Text>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={width - padding.right}
            y2={padding.top + chartHeight * ratio}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Confidence interval */}
        <Path d={confidencePath} fill="url(#confidenceGradient)" />

        {/* Prediction line */}
        <Path
          d={linePath}
          stroke={colors.primary}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === 0 ? 6 : 5}
            fill={i === 0 ? colors.foreground : colors.primary}
            stroke={colors.background}
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: i === 0 ? padding.left - 15 : getX(i) - 15,
              top: height - padding.bottom + 10,
              width: 30,
              alignItems: "center",
            }}
          >
            <Text className="text-xs text-muted">{label}</Text>
          </View>
        ))}
      </Svg>

      {/* Price labels */}
      <View className="flex-row justify-between mt-2">
        <View>
          <Text className="text-xs text-muted">Current</Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatCurrency(currentPrice)}
          </Text>
        </View>
        {predictions.map((p, i) => (
          <View key={i} className="items-center">
            <Text className="text-xs text-muted">{p.horizon}</Text>
            <Text className="text-sm font-semibold text-primary">
              {formatCurrency(p.predicted)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
