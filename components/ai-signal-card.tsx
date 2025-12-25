import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatTimeAgo } from "@/lib/format";
import type { AISignal } from "@/lib/types";

interface AISignalCardProps {
  signal: AISignal;
  onPress?: () => void;
  className?: string;
}

export function AISignalCard({ signal, onPress, className }: AISignalCardProps) {
  const colors = useColors();

  const signalConfig = {
    bullish: {
      color: colors.success,
      icon: "arrow.up.circle.fill" as const,
      label: "Bullish",
      bgClass: "bg-success/10",
    },
    bearish: {
      color: colors.error,
      icon: "arrow.down.circle.fill" as const,
      label: "Bearish",
      bgClass: "bg-error/10",
    },
    neutral: {
      color: colors.warning,
      icon: "minus.circle.fill" as const,
      label: "Neutral",
      bgClass: "bg-warning/10",
    },
  };

  const config = signalConfig[signal.direction];
  const confidencePercent = Math.round(signal.confidence * 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-muted">AI Trading Signal</Text>
          <Text className="text-xs text-muted">{formatTimeAgo(signal.timestamp)}</Text>
        </View>

        <View className="flex-row items-center gap-3">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: config.color + "20" }}
          >
            <IconSymbol name={config.icon} size={32} color={config.color} />
          </View>

          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground mb-1">
              {config.label}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted">Confidence:</Text>
              <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${confidencePercent}%`,
                    backgroundColor: config.color,
                  }}
                />
              </View>
              <Text className="text-sm font-medium text-foreground">
                {confidencePercent}%
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
          <Text className="text-xs text-muted">
            Source: {signal.source === "combined" ? "TimesFM + FinBERT" : signal.source.toUpperCase()}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-primary">View Details</Text>
            <IconSymbol name="chevron.right" size={12} color={colors.primary} />
          </View>
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
