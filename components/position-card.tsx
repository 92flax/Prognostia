import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface PositionCardProps {
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  unrealizedPnl: number;
  pnlPercent: number;
  mode: "PAPER" | "LIVE";
  onClose?: () => void;
}

export function PositionCard({
  asset,
  direction,
  entryPrice,
  currentPrice,
  size,
  leverage,
  unrealizedPnl,
  pnlPercent,
  mode,
  onClose,
}: PositionCardProps) {
  const colors = useColors();

  const isLong = direction === "LONG";
  const isProfitable = unrealizedPnl >= 0;
  const directionColor = isLong ? colors.success : colors.error;
  const pnlColor = isProfitable ? colors.success : colors.error;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose?.();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.directionBadge, { backgroundColor: directionColor + "20" }]}
          >
            <IconSymbol
              name={isLong ? "arrow.up" : "arrow.down"}
              size={14}
              color={directionColor}
            />
            <Text style={[styles.directionText, { color: directionColor }]}>
              {direction}
            </Text>
          </View>
          <Text style={[styles.assetText, { color: colors.foreground }]}>
            {asset}
          </Text>
          <View
            style={[
              styles.modeBadge,
              { backgroundColor: mode === "PAPER" ? colors.success + "20" : colors.error + "20" },
            ]}
          >
            <Text
              style={[
                styles.modeText,
                { color: mode === "PAPER" ? colors.success : colors.error },
              ]}
            >
              {mode}
            </Text>
          </View>
        </View>
        <View style={[styles.leverageBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.leverageText, { color: colors.primary }]}>
            {leverage}x
          </Text>
        </View>
      </View>

      {/* Position Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.muted }]}>Entry</Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {formatPrice(entryPrice)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.muted }]}>Current</Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {formatPrice(currentPrice)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.muted }]}>Size</Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {size.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* P&L Section */}
      <View style={[styles.pnlSection, { backgroundColor: pnlColor + "10" }]}>
        <View style={styles.pnlInfo}>
          <Text style={[styles.pnlLabel, { color: colors.muted }]}>
            Unrealized P&L
          </Text>
          <View style={styles.pnlValues}>
            <Text style={[styles.pnlAmount, { color: pnlColor }]}>
              {isProfitable ? "+" : ""}{formatPrice(unrealizedPnl)}
            </Text>
            <Text style={[styles.pnlPercent, { color: pnlColor }]}>
              ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: colors.error },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  assetText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  leverageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leverageText: {
    fontSize: 14,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 20,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  pnlSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  pnlInfo: {
    flex: 1,
  },
  pnlLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  pnlValues: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  pnlAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  pnlPercent: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
