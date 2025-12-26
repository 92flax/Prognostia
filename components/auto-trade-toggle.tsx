import { View, Text, Switch, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface AutoTradeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  mode: "PAPER" | "LIVE";
  isConnected: boolean;
}

export function AutoTradeToggle({
  enabled,
  onToggle,
  mode,
  isConnected,
}: AutoTradeToggleProps) {
  const colors = useColors();

  const handleToggle = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle(value);
  };

  const canEnableLive = mode === "LIVE" && isConnected;
  const isPaper = mode === "PAPER";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: enabled
            ? isPaper
              ? colors.success
              : colors.error
            : colors.border,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: enabled
                ? isPaper
                  ? colors.success + "20"
                  : colors.error + "20"
                : colors.muted + "20",
            },
          ]}
        >
          <IconSymbol
            name="bolt.fill"
            size={20}
            color={enabled ? (isPaper ? colors.success : colors.error) : colors.muted}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Auto-Trading Bot
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.modeBadge,
                {
                  backgroundColor: isPaper
                    ? colors.success + "20"
                    : colors.error + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: isPaper ? colors.success : colors.error },
                ]}
              >
                {mode}
              </Text>
            </View>
            <Text style={[styles.statusText, { color: colors.muted }]}>
              {enabled ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{
            false: colors.border,
            true: isPaper ? colors.success : colors.error,
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 13,
  },
  rightSection: {
    alignItems: "center",
  },
});
