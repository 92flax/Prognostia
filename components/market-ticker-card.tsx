import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { MarketSummary } from "@/lib/mock-signal";

interface MarketTickerCardProps {
  market: MarketSummary;
  isSelected?: boolean;
  onPress?: () => void;
  className?: string;
}

export function MarketTickerCard({
  market,
  isSelected = false,
  onPress,
  className,
}: MarketTickerCardProps) {
  const colors = useColors();
  const isPositive = market.changePercent >= 0;
  const changeColor = isPositive ? colors.success : colors.error;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    return `$${volume.toLocaleString()}`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View
        className={cn(
          "bg-surface rounded-2xl p-4 border",
          isSelected ? "border-primary" : "border-border",
          className
        )}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-warning/20 items-center justify-center">
              <Text className="text-warning font-bold text-sm">
                {market.symbol.replace('USDT', '').charAt(0)}
              </Text>
            </View>
            <Text className="text-foreground font-semibold text-base">
              {market.symbol.replace('USDT', '')}
            </Text>
          </View>
          
          <View className="flex-row items-center gap-1">
            <IconSymbol
              name={isPositive ? "arrow.up.circle.fill" : "arrow.down.circle.fill"}
              size={14}
              color={changeColor}
            />
            <Text style={{ color: changeColor }} className="font-semibold text-sm">
              {isPositive ? '+' : ''}{market.changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>

        <Text className="text-foreground text-2xl font-bold">
          {formatPrice(market.price)}
        </Text>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-muted text-xs">
            Vol: {formatVolume(market.volume24h)}
          </Text>
          <Text className="text-muted text-xs">
            H: {formatPrice(market.high24h)}
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
