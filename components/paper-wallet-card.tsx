import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, formatPercentRaw } from "@/lib/format";
import type { PaperWallet } from "@/lib/types";

interface PaperWalletCardProps {
  wallet: PaperWallet;
  onReset?: () => void;
  className?: string;
}

/**
 * Paper Wallet Card
 * 
 * Displays virtual balance and performance stats for simulation mode
 */
export function PaperWalletCard({
  wallet,
  onReset,
  className,
}: PaperWalletCardProps) {
  const colors = useColors();

  const totalValue = wallet.usdtBalance + 
    (wallet.btcBalance * 98432.50) + // Mock BTC price
    (wallet.ethBalance * 3456.78);   // Mock ETH price

  const returnPercent = ((totalValue - wallet.initialBalance) / wallet.initialBalance) * 100;
  const isPositive = returnPercent >= 0;
  const winRate = wallet.totalTrades > 0 
    ? (wallet.winningTrades / wallet.totalTrades) * 100 
    : 0;

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="briefcase.fill" size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-foreground">Paper Wallet</Text>
            <Text className="text-xs text-muted">Simulation Balance</Text>
          </View>
        </View>
        
        {onReset && (
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [
              styles.resetButton,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={14} color={colors.muted} />
            <Text className="text-xs text-muted ml-1">Reset</Text>
          </Pressable>
        )}
      </View>

      {/* Main Balance */}
      <View className="items-center mb-4 py-4 bg-background rounded-xl">
        <Text className="text-xs text-muted mb-1">Total Value</Text>
        <Text className="text-3xl font-bold text-foreground">
          {formatCurrency(totalValue)}
        </Text>
        <View className="flex-row items-center mt-1">
          <IconSymbol
            name={isPositive ? "arrow.up.circle.fill" : "arrow.down.circle.fill"}
            size={14}
            color={isPositive ? colors.success : colors.error}
          />
          <Text
            style={{ color: isPositive ? colors.success : colors.error }}
            className="text-sm font-semibold ml-1"
          >
            {isPositive ? "+" : ""}{formatPercentRaw(returnPercent / 100)} ({formatCurrency(wallet.totalPnl)})
          </Text>
        </View>
      </View>

      {/* Balances Grid */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">USDT</Text>
          <Text className="text-base font-semibold text-foreground">
            {formatCurrency(wallet.usdtBalance)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">BTC</Text>
          <Text className="text-base font-semibold text-foreground">
            {wallet.btcBalance.toFixed(6)}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl">
          <Text className="text-xs text-muted mb-1">ETH</Text>
          <Text className="text-base font-semibold text-foreground">
            {wallet.ethBalance.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row gap-2">
        <View className="flex-1 p-3 bg-background rounded-xl items-center">
          <Text className="text-xs text-muted mb-1">Win Rate</Text>
          <Text
            style={{ color: winRate >= 50 ? colors.success : colors.error }}
            className="text-lg font-bold"
          >
            {winRate.toFixed(1)}%
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl items-center">
          <Text className="text-xs text-muted mb-1">Trades</Text>
          <Text className="text-lg font-bold text-foreground">
            {wallet.totalTrades}
          </Text>
        </View>
        <View className="flex-1 p-3 bg-background rounded-xl items-center">
          <Text className="text-xs text-muted mb-1">Max DD</Text>
          <Text
            style={{ color: colors.error }}
            className="text-lg font-bold"
          >
            {formatPercentRaw(wallet.maxDrawdown)}
          </Text>
        </View>
      </View>

      {/* Peak Balance */}
      <View className="mt-4 flex-row items-center justify-between px-2">
        <Text className="text-xs text-muted">Peak Balance</Text>
        <Text className="text-xs font-medium text-foreground">
          {formatCurrency(wallet.peakBalance)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
