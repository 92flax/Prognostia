import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, formatTimeAgo, formatQuantity } from "@/lib/format";
import type { Trade } from "@/lib/types";

interface TradeItemProps {
  trade: Trade;
  className?: string;
}

export function TradeItem({ trade, className }: TradeItemProps) {
  const colors = useColors();
  const isBuy = trade.type === "buy";
  const typeColor = isBuy ? colors.success : colors.error;

  return (
    <View className={cn("flex-row items-center py-3 border-b border-border", className)}>
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: typeColor + "20" }}
      >
        <IconSymbol
          name={isBuy ? "arrow.up.circle.fill" : "arrow.down.circle.fill"}
          size={20}
          color={typeColor}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-base font-semibold text-foreground">
            {trade.symbol}
          </Text>
          <View
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: typeColor + "20" }}
          >
            <Text style={{ color: typeColor }} className="text-xs font-medium uppercase">
              {trade.type}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-muted">
          {formatQuantity(trade.quantity)} @ {formatCurrency(trade.price)}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-base font-semibold text-foreground">
          {formatCurrency(trade.total)}
        </Text>
        <Text className="text-xs text-muted">
          {formatTimeAgo(trade.timestamp)}
        </Text>
      </View>
    </View>
  );
}
