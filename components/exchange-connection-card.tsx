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

  // Exchange logos/icons - Updated for Bitget as primary
  const getExchangeIcon = () => {
    if (connection.name === "bitget") {
      return (
        <View className="w-12 h-12 rounded-xl bg-[#00D4AA]/20 items-center justify-center">
          <Text className="text-2xl font-bold text-[#00D4AA]">B</Text>
        </View>
      );
    }
    if (connection.name === "alpaca") {
      return (
        <View className="w-12 h-12 rounded-xl bg-[#FFEB3B]/20 items-center justify-center">
          <Text className="text-2xl font-bold text-[#FFC107]">A</Text>
        </View>
      );
    }
    // Fallback for other exchanges
    return (
      <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
        <IconSymbol name="building.columns.fill" size={24} color={colors.primary} />
      </View>
    );
  };

  // Show additional info for Bitget (passphrase required)
  const showPassphraseHint = connection.name === "bitget" && connection.status === "disconnected";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
        <View className="flex-row items-center">
          {getExchangeIcon()}

          <View className="flex-1 ml-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">
                {connection.displayName}
              </Text>
              {connection.name === "bitget" && (
                <View className="px-1.5 py-0.5 rounded bg-primary/20">
                  <Text className="text-[10px] font-medium text-primary">PRIMARY</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-1.5 mt-1">
              <IconSymbol name={config.icon} size={14} color={config.color} />
              <Text style={{ color: config.color }} className="text-sm font-medium">
                {config.label}
              </Text>
            </View>
          </View>

          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </View>

        {/* Passphrase hint for Bitget */}
        {showPassphraseHint && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center gap-2">
              <IconSymbol name="key.fill" size={14} color={colors.warning} />
              <Text className="text-xs text-warning flex-1">
                Requires API Key, Secret, and Passphrase
              </Text>
            </View>
          </View>
        )}

        {connection.status === "connected" && connection.lastSync && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">Last synced</Text>
              <Text className="text-xs text-muted">
                {formatTimeAgo(connection.lastSync)}
              </Text>
            </View>
            {connection.balance !== undefined && (
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-xs text-muted">Available Balance</Text>
                <Text className="text-xs font-medium text-foreground">
                  ${connection.balance.toLocaleString()}
                </Text>
              </View>
            )}
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
