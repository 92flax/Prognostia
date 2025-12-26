import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useState } from "react";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SignalSetup, formatSignalForClipboard } from "@/lib/signal-engine";

interface TradingSignalCardProps {
  signal: SignalSetup;
  mode: "PAPER" | "LIVE";
  autoTradeEnabled: boolean;
  onExecute?: () => void;
  isExecuting?: boolean;
}

export function TradingSignalCard({
  signal,
  mode,
  autoTradeEnabled,
  onExecute,
  isExecuting = false,
}: TradingSignalCardProps) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  const isLong = signal.direction === "LONG";
  const directionColor = isLong ? colors.success : colors.error;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const handleCopy = async () => {
    const text = formatSignalForClipboard(signal);
    await Clipboard.setStringAsync(text);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (mode === "LIVE") {
      Alert.alert(
        "Execute Live Trade",
        `Are you sure you want to open a ${signal.direction} position for ${signal.asset}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Execute", onPress: onExecute, style: "destructive" },
        ]
      );
    } else {
      onExecute?.();
    }
  };

  // Risk level colors
  const riskColors: Record<string, string> = {
    LOW: colors.success,
    MEDIUM: colors.warning,
    HIGH: "#FF6B00",
    EXTREME: colors.error,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header with Direction Badge */}
      <View
        style={[styles.header, { backgroundColor: directionColor + "15" }]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[styles.directionIcon, { backgroundColor: directionColor }]}
          >
            <IconSymbol
              name={isLong ? "arrow.up" : "arrow.down"}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View>
            <Text style={[styles.directionText, { color: directionColor }]}>
              {isLong ? "BUY / LONG" : "SELL / SHORT"}
            </Text>
            <Text style={[styles.assetText, { color: colors.foreground }]}>
              {signal.asset}
            </Text>
          </View>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.confidenceText}>{signal.confidenceScore}%</Text>
        </View>
      </View>

      {/* Trade Setup Grid */}
      <View style={styles.setupGrid}>
        {/* Leverage */}
        <View style={[styles.setupCard, { backgroundColor: colors.background }]}>
          <View style={styles.setupHeader}>
            <IconSymbol name="gauge.with.needle.fill" size={14} color={colors.primary} />
            <Text style={[styles.setupLabel, { color: colors.muted }]}>LEVERAGE</Text>
          </View>
          <Text style={[styles.setupValue, { color: colors.foreground }]}>
            {signal.leverageRecommendation}x
          </Text>
          <View
            style={[
              styles.riskBadge,
              { backgroundColor: riskColors[signal.riskLevel] + "20" },
            ]}
          >
            <Text
              style={[styles.riskText, { color: riskColors[signal.riskLevel] }]}
            >
              {signal.riskLevel} RISK
            </Text>
          </View>
        </View>

        {/* Entry */}
        <View style={[styles.setupCard, { backgroundColor: colors.background }]}>
          <View style={styles.setupHeader}>
            <IconSymbol name="target" size={14} color={colors.foreground} />
            <Text style={[styles.setupLabel, { color: colors.muted }]}>ENTRY</Text>
          </View>
          <Text style={[styles.setupValue, { color: colors.foreground }]}>
            Market
          </Text>
          <Text style={[styles.setupSubvalue, { color: colors.muted }]}>
            {formatPrice(signal.entryPrice)}
          </Text>
        </View>

        {/* Take Profit */}
        <View
          style={[
            styles.setupCard,
            { backgroundColor: colors.success + "10", borderColor: colors.success + "30" },
          ]}
        >
          <View style={styles.setupHeader}>
            <IconSymbol name="checkmark.circle.fill" size={14} color={colors.success} />
            <Text style={[styles.setupLabel, { color: colors.success }]}>TAKE PROFIT</Text>
          </View>
          <Text style={[styles.setupValueLarge, { color: colors.success }]}>
            {formatPrice(signal.takeProfitPrice)}
          </Text>
          <Text style={[styles.setupSubvalue, { color: colors.success }]}>
            +{(((signal.takeProfitPrice - signal.entryPrice) / signal.entryPrice) * 100).toFixed(1)}%
          </Text>
        </View>

        {/* Stop Loss */}
        <View
          style={[
            styles.setupCard,
            { backgroundColor: colors.error + "10", borderColor: colors.error + "30" },
          ]}
        >
          <View style={styles.setupHeader}>
            <IconSymbol name="xmark.circle.fill" size={14} color={colors.error} />
            <Text style={[styles.setupLabel, { color: colors.error }]}>STOP LOSS</Text>
          </View>
          <Text style={[styles.setupValueLarge, { color: colors.error }]}>
            {formatPrice(signal.stopLossPrice)}
          </Text>
          <Text style={[styles.setupSubvalue, { color: colors.error }]}>
            {(((signal.stopLossPrice - signal.entryPrice) / signal.entryPrice) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Risk:Reward */}
      <View style={[styles.rrContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.rrLabel, { color: colors.muted }]}>Risk : Reward</Text>
        <Text style={[styles.rrValue, { color: colors.foreground }]}>
          1 : {signal.riskRewardRatio}
        </Text>
      </View>

      {/* Rationale */}
      <View style={[styles.rationaleContainer, { backgroundColor: colors.primary + "10" }]}>
        <View style={styles.rationaleHeader}>
          <IconSymbol name="brain.head.profile" size={16} color={colors.primary} />
          <Text style={[styles.rationaleLabel, { color: colors.primary }]}>
            SIGNAL RATIONALE
          </Text>
        </View>
        <Text style={[styles.rationaleText, { color: colors.foreground }]}>
          {signal.rationale}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={handleCopy}
          style={({ pressed }) => [
            styles.copyButton,
            { backgroundColor: colors.muted + "20" },
            pressed && styles.buttonPressed,
          ]}
        >
          <IconSymbol
            name={copied ? "checkmark" : "doc.on.doc.fill"}
            size={18}
            color={copied ? colors.success : colors.foreground}
          />
          <Text style={[styles.copyText, { color: colors.foreground }]}>
            {copied ? "Copied!" : "Copy Signal"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleExecute}
          disabled={isExecuting}
          style={({ pressed }) => [
            styles.executeButton,
            {
              backgroundColor: mode === "LIVE" ? colors.error : colors.success,
              opacity: isExecuting ? 0.6 : 1,
            },
            pressed && styles.buttonPressed,
          ]}
        >
          <IconSymbol name="bolt.fill" size={18} color="#FFFFFF" />
          <Text style={styles.executeText}>
            {isExecuting
              ? "Executing..."
              : mode === "LIVE"
              ? "Execute Live"
              : "Paper Trade"}
          </Text>
        </Pressable>
      </View>

      {/* Auto-trade indicator */}
      {autoTradeEnabled && (
        <View style={[styles.autoTradeIndicator, { backgroundColor: colors.warning + "20" }]}>
          <IconSymbol name="bolt.fill" size={12} color={colors.warning} />
          <Text style={[styles.autoTradeText, { color: colors.warning }]}>
            Auto-trade will execute when confidence ≥ threshold
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  directionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  directionText: {
    fontSize: 18,
    fontWeight: "800",
  },
  assetText: {
    fontSize: 14,
    fontWeight: "500",
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  setupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 10,
  },
  setupCard: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  setupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  setupLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  setupValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  setupValueLarge: {
    fontSize: 22,
    fontWeight: "700",
  },
  setupSubvalue: {
    fontSize: 13,
    marginTop: 2,
  },
  riskBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  riskText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rrContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 10,
  },
  rrLabel: {
    fontSize: 13,
  },
  rrValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  rationaleContainer: {
    margin: 12,
    padding: 14,
    borderRadius: 12,
  },
  rationaleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  rationaleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    paddingTop: 0,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyText: {
    fontSize: 15,
    fontWeight: "600",
  },
  executeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  executeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  autoTradeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  autoTradeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
