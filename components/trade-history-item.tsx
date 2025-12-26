import { View, Text, StyleSheet } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface TradeHistoryItemProps {
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  mode: "PAPER" | "LIVE";
  closedAt: Date;
}

export function TradeHistoryItem({
  asset,
  direction,
  entryPrice,
  exitPrice,
  pnl,
  pnlPercent,
  leverage,
  mode,
  closedAt,
}: TradeHistoryItemProps) {
  const colors = useColors();

  const isLong = direction === "LONG";
  const isProfitable = pnl >= 0;
  const directionColor = isLong ? colors.success : colors.error;
  const pnlColor = isProfitable ? colors.success : colors.error;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.leftSection}>
        <View style={styles.header}>
          <View
            style={[styles.directionBadge, { backgroundColor: directionColor + "20" }]}
          >
            <IconSymbol
              name={isLong ? "arrow.up" : "arrow.down"}
              size={12}
              color={directionColor}
            />
            <Text style={[styles.directionText, { color: directionColor }]}>
              {direction}
            </Text>
          </View>
          <Text style={[styles.assetText, { color: colors.foreground }]}>
            {asset}
          </Text>
          <Text style={[styles.leverageText, { color: colors.muted }]}>
            {leverage}x
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.muted }]}>
            {formatPrice(entryPrice)} → {formatPrice(exitPrice)}
          </Text>
          <Text style={[styles.dateText, { color: colors.muted }]}>
            {formatDate(closedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.pnlAmount, { color: pnlColor }]}>
          {isProfitable ? "+" : ""}{formatPrice(pnl)}
        </Text>
        <View
          style={[
            styles.pnlBadge,
            { backgroundColor: pnlColor + "15" },
          ]}
        >
          <Text style={[styles.pnlPercent, { color: pnlColor }]}>
            {isProfitable ? "+" : ""}{pnlPercent.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  leftSection: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  directionText: {
    fontSize: 10,
    fontWeight: "700",
  },
  assetText: {
    fontSize: 14,
    fontWeight: "600",
  },
  leverageText: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 11,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  pnlAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  pnlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  pnlPercent: {
    fontSize: 12,
    fontWeight: "600",
  },
});
