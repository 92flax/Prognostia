/**
 * Live Position Card
 * 
 * Displays an open position with real-time P&L updates
 * and a pulsating "LIVE" badge for active positions.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { usePrices } from "@/lib/price-context";

export interface LivePosition {
  id: number;
  asset: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  leverage: number;
  margin: number;
  size: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  mode: "PAPER" | "LIVE";
  timestampOpen: Date;
}

export interface LivePositionCardProps {
  position: LivePosition;
  onClose?: (position: LivePosition) => void;
}

export function LivePositionCard({ position, onClose }: LivePositionCardProps) {
  const { getPrice, formatPrice } = usePrices();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Get current price
  const currentPriceData = getPrice(position.asset);
  const currentPrice = currentPriceData?.price || position.entryPrice;

  // Calculate unrealized P&L
  const priceDiff = position.direction === "LONG"
    ? currentPrice - position.entryPrice
    : position.entryPrice - currentPrice;
  const pnlPercent = (priceDiff / position.entryPrice) * position.leverage * 100;
  const pnlAbsolute = position.margin * (pnlPercent / 100);
  const isProfit = pnlAbsolute >= 0;

  // Calculate liquidation distance
  const liquidationPrice = position.direction === "LONG"
    ? position.entryPrice * (1 - 1 / position.leverage)
    : position.entryPrice * (1 + 1 / position.leverage);
  const liquidationDistance = position.direction === "LONG"
    ? ((currentPrice - liquidationPrice) / currentPrice) * 100
    : ((liquidationPrice - currentPrice) / currentPrice) * 100;

  // Pulsating "LIVE" badge animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Glow animation for the card border
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose?.(position);
  };

  const isLong = position.direction === "LONG";
  const directionColor = isLong ? "text-success" : "text-error";
  const pnlColor = isProfit ? "text-success" : "text-error";
  const borderColor = isLong ? "#22C55E" : "#EF4444";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor,
          shadowColor: borderColor,
          shadowOpacity: glowAnim,
        },
      ]}
      className="bg-surface rounded-xl p-4 mb-3"
    >
      {/* Header with Live Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-foreground font-bold text-lg">
            {position.asset.replace("USDT", "")}
          </Text>
          <Text className={`${directionColor} font-semibold`}>
            {position.direction}
          </Text>
          <View className="bg-muted/20 px-2 py-0.5 rounded">
            <Text className="text-muted text-xs">{position.leverage}x</Text>
          </View>
        </View>
        
        {/* Pulsating LIVE badge */}
        <Animated.View
          style={{ transform: [{ scale: pulseAnim }] }}
          className="flex-row items-center gap-1 bg-success/20 px-2 py-1 rounded-full"
        >
          <View className="w-2 h-2 rounded-full bg-success" />
          <Text className="text-success text-xs font-bold">LIVE</Text>
        </Animated.View>
      </View>

      {/* Price and P&L Grid */}
      <View className="flex-row mb-3">
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Entry</Text>
          <Text className="text-foreground font-mono">
            ${formatPrice(position.entryPrice)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">Current</Text>
          <Text className="text-foreground font-mono">
            ${formatPrice(currentPrice)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-muted text-xs mb-1">P&L</Text>
          <Text className={`${pnlColor} font-bold font-mono`}>
            {isProfit ? "+" : ""}{pnlPercent.toFixed(2)}%
          </Text>
          <Text className={`${pnlColor} text-xs font-mono`}>
            {isProfit ? "+" : ""}${pnlAbsolute.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* TP/SL and Liquidation */}
      <View className="flex-row mb-3 bg-background/50 rounded-lg p-2">
        <View className="flex-1">
          <Text className="text-muted text-xs">TP</Text>
          <Text className="text-success font-mono text-sm">
            ${formatPrice(position.takeProfitPrice)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs">SL</Text>
          <Text className="text-error font-mono text-sm">
            ${formatPrice(position.stopLossPrice)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-muted text-xs">Liq. Distance</Text>
          <Text className={`font-mono text-sm ${liquidationDistance < 5 ? "text-error" : "text-warning"}`}>
            {liquidationDistance.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Margin and Mode */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-muted text-xs">Margin:</Text>
          <Text className="text-foreground font-mono text-sm">
            ${position.margin.toFixed(2)}
          </Text>
          <View className={`px-2 py-0.5 rounded ${position.mode === "LIVE" ? "bg-success/20" : "bg-primary/20"}`}>
            <Text className={`text-xs font-medium ${position.mode === "LIVE" ? "text-success" : "text-primary"}`}>
              {position.mode}
            </Text>
          </View>
        </View>
        
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
          ]}
        >
          <Text className="text-error font-semibold text-sm">Close</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  closeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
