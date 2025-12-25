import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatPercent, formatQuantity } from "@/lib/format";
import type { Holding } from "@/lib/types";

interface HoldingItemProps {
  holding: Holding;
  onPress?: () => void;
  className?: string;
}

export function HoldingItem({ holding, onPress, className }: HoldingItemProps) {
  const colors = useColors();
  const isPositive = holding.pnl >= 0;
  const pnlColor = isPositive ? colors.success : colors.error;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View className={cn("flex-row items-center py-4 border-b border-border", className)}>
        {/* Symbol and Name */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base font-bold text-foreground">{holding.symbol}</Text>
            <View className="px-2 py-0.5 bg-primary/10 rounded">
              <Text className="text-xs text-primary">{holding.allocation.toFixed(1)}%</Text>
            </View>
          </View>
          <Text className="text-sm text-muted">{holding.name}</Text>
          <Text className="text-xs text-muted mt-1">
            {formatQuantity(holding.quantity)} @ {formatCurrency(holding.avgPrice)}
          </Text>
        </View>

        {/* Value and P&L */}
        <View className="items-end">
          <Text className="text-base font-bold text-foreground mb-1">
            {formatCurrency(holding.value)}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text style={{ color: pnlColor }} className="text-sm font-medium">
              {isPositive ? "+" : ""}
              {formatCurrency(holding.pnl)}
            </Text>
          </View>
          <Text style={{ color: pnlColor }} className="text-xs">
            {formatPercent(holding.pnlPercent)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
