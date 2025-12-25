import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { SparklineChart } from "./sparkline-chart";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { MarketData } from "@/lib/types";

interface MarketCardProps {
  data: MarketData;
  onPress?: () => void;
  className?: string;
}

export function MarketCard({ data, onPress, className }: MarketCardProps) {
  const colors = useColors();
  const isPositive = data.changePercent24h >= 0;
  const changeColor = isPositive ? colors.success : colors.error;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View className={cn("bg-surface rounded-xl p-4 border border-border", className)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-lg font-bold text-foreground">{data.symbol}</Text>
              <Text className="text-sm text-muted">{data.name}</Text>
            </View>
            <Text className="text-xl font-bold text-foreground mb-1">
              {formatCurrency(data.price)}
            </Text>
            <Text style={{ color: changeColor }} className="text-sm font-medium">
              {formatPercent(data.changePercent24h)}
            </Text>
          </View>
          <SparklineChart
            data={data.sparkline}
            width={80}
            height={40}
            color={changeColor}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
