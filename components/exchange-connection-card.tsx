import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatTimeAgo } from "@/lib/format";
import type { ExchangeConnection } from "@/lib/types";

interface ExchangeConnectionCardProps {
  connection: ExchangeConnection;
  onPress?: () => void;
  className?: string;
}

export function ExchangeConnectionCard({
  connection,
  onPress,
  className,
}: ExchangeConnectionCardProps) {
  const colors = useColors();

  const statusConfig = {
    connected: {
      color: colors.success,
      icon: "checkmark.circle.fill" as const,
      label: "Connected",
    },
    disconnected: {
      color: colors.muted,
      icon: "xmark.circle.fill" as const,
      label: "Disconnected",
    },
    error: {
      color: colors.error,
      icon: "exclamationmark.triangle.fill" as const,
      label: "Error",
    },
  };

  const config = statusConfig[connection.status];

  // Exchange logos/icons
  const getExchangeIcon = () => {
    if (connection.name === "binance") {
      return (
        <View className="w-12 h-12 rounded-xl bg-[#F3BA2F]/20 items-center justify-center">
          <Text className="text-2xl font-bold text-[#F3BA2F]">B</Text>
        </View>
      );
    }
    return (
      <View className="w-12 h-12 rounded-xl bg-[#FFEB3B]/20 items-center justify-center">
        <Text className="text-2xl font-bold text-[#FFC107]">A</Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
        <View className="flex-row items-center">
          {getExchangeIcon()}

          <View className="flex-1 ml-3">
            <Text className="text-lg font-semibold text-foreground">
              {connection.displayName}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <IconSymbol name={config.icon} size={14} color={config.color} />
              <Text style={{ color: config.color }} className="text-sm font-medium">
                {config.label}
              </Text>
            </View>
          </View>

          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </View>

        {connection.status === "connected" && connection.lastSync && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">Last synced</Text>
              <Text className="text-xs text-muted">
                {formatTimeAgo(connection.lastSync)}
              </Text>
            </View>
          </View>
        )}

        {connection.status === "error" && connection.error && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center gap-2">
              <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.error} />
              <Text className="text-xs text-error flex-1">{connection.error}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
