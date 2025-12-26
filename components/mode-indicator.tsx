import { View, Text, StyleSheet } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ModeIndicatorProps {
  mode: "PAPER" | "LIVE";
  isConnected: boolean;
  balance?: number;
}

export function ModeIndicator({ mode, isConnected, balance }: ModeIndicatorProps) {
  const colors = useColors();

  const isPaper = mode === "PAPER";
  const modeColor = isPaper ? colors.success : colors.error;

  const formatBalance = (value?: number) => {
    if (value === undefined) return "---";
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.leftSection}>
        <View
          style={[
            styles.modeBadge,
            { backgroundColor: modeColor + "20" },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: modeColor }]} />
          <Text style={[styles.modeText, { color: modeColor }]}>
            {mode} MODE
          </Text>
        </View>
        
        {!isPaper && (
          <View style={styles.connectionStatus}>
            <IconSymbol
              name={isConnected ? "checkmark.circle.fill" : "xmark.circle.fill"}
              size={14}
              color={isConnected ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.connectionText,
                { color: isConnected ? colors.success : colors.error },
              ]}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.balanceLabel, { color: colors.muted }]}>
          {isPaper ? "Paper Balance" : "Available"}
        </Text>
        <Text style={[styles.balanceValue, { color: colors.foreground }]}>
          {formatBalance(balance)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
