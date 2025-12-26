import { View, Text } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency } from "@/lib/format";

interface WalletBalanceCardProps {
  /** Total wallet balance in USDT */
  totalBalance: number;
  /** Available balance for new positions */
  availableBalance: number;
  /** Balance locked in open positions */
  lockedBalance: number;
  /** Whether connected to Bitget (false = paper mode) */
  isLive: boolean;
  /** Loading state */
  isLoading?: boolean;
}

export function WalletBalanceCard({
  totalBalance,
  availableBalance,
  lockedBalance,
  isLive,
  isLoading = false,
}: WalletBalanceCardProps) {
  const colors = useColors();

  if (isLoading) {
    return (
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <IconSymbol name="creditcard.fill" size={18} color={colors.muted} />
            <Text className="text-sm text-muted">Wallet Balance</Text>
          </View>
          <View className="bg-muted/20 rounded-full px-2 py-0.5">
            <Text className="text-xs text-muted">Loading...</Text>
          </View>
        </View>
        <View className="h-8 bg-muted/20 rounded animate-pulse" />
      </View>
    );
  }

  const utilizationPercent = totalBalance > 0 
    ? Math.round((lockedBalance / totalBalance) * 100) 
    : 0;

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <IconSymbol name="creditcard.fill" size={18} color={colors.primary} />
          <Text className="text-sm text-muted">
            {isLive ? "Bitget Wallet" : "Paper Wallet"}
          </Text>
        </View>
        <View 
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: isLive ? colors.primary + '20' : colors.success + '20' }}
        >
          <Text 
            className="text-xs font-medium"
            style={{ color: isLive ? colors.primary : colors.success }}
          >
            {isLive ? "LIVE" : "PAPER"}
          </Text>
        </View>
      </View>

      {/* Total Balance */}
      <Text className="text-2xl font-bold text-foreground mb-3">
        {formatCurrency(totalBalance)}
      </Text>

      {/* Balance Breakdown */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">Available</Text>
          <Text className="text-sm font-semibold text-success">
            {formatCurrency(availableBalance)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">In Positions</Text>
          <Text className="text-sm font-semibold text-warning">
            {formatCurrency(lockedBalance)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">Utilization</Text>
          <Text className="text-sm font-semibold text-foreground">
            {utilizationPercent}%
          </Text>
        </View>
      </View>

      {/* Utilization Bar */}
      <View className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${utilizationPercent}%`,
            backgroundColor: utilizationPercent > 80 ? colors.error : colors.warning 
          }}
        />
      </View>
    </View>
  );
}
