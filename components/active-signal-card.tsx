import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { SignalSetup } from "@/lib/signal-engine";
import { formatSignalForClipboard } from "@/lib/signal-engine";

interface ActiveSignalCardProps {
  signal: SignalSetup;
  className?: string;
}

export function ActiveSignalCard({ signal, className }: ActiveSignalCardProps) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  const isLong = signal.direction === "LONG";
  const directionColor = isLong ? colors.success : colors.error;
  const directionBgColor = isLong ? "bg-success" : "bg-error";

  // Risk level colors
  const riskColors = {
    LOW: colors.success,
    MEDIUM: colors.warning,
    HIGH: "#FF8C00", // Orange
    EXTREME: colors.error,
  };
  const riskColor = riskColors[signal.riskLevel];

  // Format prices for display
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = formatSignalForClipboard(signal);
    await Clipboard.setStringAsync(text);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className={cn("bg-surface rounded-3xl border border-border overflow-hidden", className)}>
      {/* Direction Header - BIG and prominent */}
      <View className={cn("py-4 px-5", directionBgColor)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
              <IconSymbol 
                name={isLong ? "arrow.up.circle.fill" : "arrow.down.circle.fill"} 
                size={32} 
                color="white" 
              />
            </View>
            <View>
              <Text className="text-white text-3xl font-bold tracking-tight">
                {isLong ? "BUY / LONG" : "SELL / SHORT"}
              </Text>
              <Text className="text-white/80 text-base font-medium">
                {signal.asset}
              </Text>
            </View>
          </View>
          
          {/* Confidence Badge */}
          <View className="bg-white/20 px-3 py-1.5 rounded-full">
            <Text className="text-white font-bold text-sm">
              {signal.confidenceScore}%
            </Text>
          </View>
        </View>
      </View>

      {/* Main Trade Setup - The 4 Critical Numbers */}
      <View className="p-5">
        <View className="flex-row flex-wrap gap-3">
          {/* Leverage */}
          <View className="flex-1 min-w-[45%] bg-background rounded-2xl p-4 border border-border">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="gauge.with.needle.fill" size={16} color={riskColor} />
              <Text className="text-muted text-xs font-medium uppercase tracking-wide">
                Leverage
              </Text>
            </View>
            <Text className="text-foreground text-3xl font-bold">
              {signal.leverageRecommendation}x
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <View 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: riskColor }} 
              />
              <Text style={{ color: riskColor }} className="text-xs font-medium">
                {signal.riskLevel} RISK
              </Text>
            </View>
          </View>

          {/* Entry */}
          <View className="flex-1 min-w-[45%] bg-background rounded-2xl p-4 border border-border">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="target" size={16} color={colors.primary} />
              <Text className="text-muted text-xs font-medium uppercase tracking-wide">
                Entry
              </Text>
            </View>
            <Text className="text-foreground text-3xl font-bold">
              Market
            </Text>
            <Text className="text-muted text-xs mt-1">
              {formatPrice(signal.entryPrice)}
            </Text>
          </View>

          {/* Take Profit */}
          <View className="flex-1 min-w-[45%] bg-background rounded-2xl p-4 border border-success/20">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
              <Text className="text-success text-xs font-medium uppercase tracking-wide">
                Take Profit
              </Text>
            </View>
            <Text className="text-success text-3xl font-bold">
              {formatPrice(signal.takeProfitPrice)}
            </Text>
            <Text className="text-muted text-xs mt-1">
              +{((Math.abs(signal.takeProfitPrice - signal.entryPrice) / signal.entryPrice) * 100).toFixed(1)}%
            </Text>
          </View>

          {/* Stop Loss */}
          <View className="flex-1 min-w-[45%] bg-background rounded-2xl p-4 border border-error/20">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} />
              <Text className="text-error text-xs font-medium uppercase tracking-wide">
                Stop Loss
              </Text>
            </View>
            <Text className="text-error text-3xl font-bold">
              {formatPrice(signal.stopLossPrice)}
            </Text>
            <Text className="text-muted text-xs mt-1">
              -{((Math.abs(signal.entryPrice - signal.stopLossPrice) / signal.entryPrice) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Risk-Reward Ratio */}
        <View className="mt-4 flex-row items-center justify-center gap-2 py-2 bg-background rounded-xl">
          <Text className="text-muted text-sm">Risk : Reward</Text>
          <Text className="text-foreground font-bold text-lg">
            1 : {signal.riskRewardRatio}
          </Text>
        </View>

        {/* Rationale */}
        <View className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <View className="flex-row items-center gap-2 mb-2">
            <IconSymbol name="lightbulb.fill" size={16} color={colors.primary} />
            <Text className="text-primary text-xs font-semibold uppercase tracking-wide">
              Signal Rationale
            </Text>
          </View>
          <Text className="text-foreground text-base leading-relaxed">
            {signal.rationale}
          </Text>
        </View>

        {/* Copy Signal Button */}
        <Pressable
          onPress={handleCopy}
          style={({ pressed }) => [
            styles.copyButton,
            { backgroundColor: copied ? colors.success : colors.primary },
            pressed && styles.copyButtonPressed,
          ]}
        >
          <View className="flex-row items-center justify-center gap-2">
            <IconSymbol 
              name={copied ? "checkmark.circle.fill" : "doc.on.doc.fill"} 
              size={20} 
              color="white" 
            />
            <Text className="text-white font-bold text-lg">
              {copied ? "Copied!" : "Copy Signal"}
            </Text>
          </View>
        </Pressable>

        {/* Timestamp */}
        <Text className="text-center text-muted text-xs mt-3">
          Generated {signal.timestamp.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copyButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
