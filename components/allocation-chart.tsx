import { View, Text } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import type { Holding } from "@/lib/types";

interface AllocationChartProps {
  holdings: Holding[];
  size?: number;
}

const COLORS = [
  "#0066FF", // Primary blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export function AllocationChart({ holdings, size = 200 }: AllocationChartProps) {
  const colors = useColors();
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;
  const innerRadius = radius * 0.6;

  // Calculate pie slices
  let currentAngle = -Math.PI / 2; // Start from top
  const slices = holdings.map((holding, index) => {
    const angle = (holding.allocation / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate arc path
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;

    return {
      ...holding,
      path,
      color: COLORS[index % COLORS.length],
      midAngle: startAngle + angle / 2,
    };
  });

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        <G>
          {slices.map((slice, index) => (
            <Path
              key={slice.id}
              d={slice.path}
              fill={slice.color}
              stroke={colors.background}
              strokeWidth={2}
            />
          ))}
        </G>
      </Svg>

      {/* Legend */}
      <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {slices.map((slice) => (
          <View key={slice.id} className="flex-row items-center gap-1.5">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <Text className="text-xs text-muted">
              {slice.symbol} ({slice.allocation.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
