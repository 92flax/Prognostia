import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { TradingMode } from "@/lib/types";

interface TradingModeToggleProps {
  mode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  className?: string;
}

/**
 * Trading Mode Toggle
 * 
 * Switches between:
 * - Simulation: Paper trading with virtual balance, no API calls
 * - Live: Real trading with Bitget API
 */
export function TradingModeToggle({
  mode,
  onModeChange,
  className,
}: TradingModeToggleProps) {
  const colors = useColors();
  const isLive = mode === "live";

  const handleToggle = () => {
    onModeChange(isLive ? "simulation" : "live");
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isLive ? colors.error + "20" : colors.primary + "20",
        { duration: 200 }
      ),
      borderColor: withTiming(
        isLive ? colors.error : colors.primary,
        { duration: 200 }
      ),
    };
  });

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(isLive ? 80 : 0, { duration: 200 }),
        },
      ],
      backgroundColor: withTiming(
        isLive ? colors.error : colors.primary,
        { duration: 200 }
      ),
    };
  });

  return (
    <View className={cn("", className)}>
      <Pressable onPress={handleToggle}>
        <Animated.View
          style={[styles.container, animatedContainerStyle]}
          className="flex-row items-center"
        >
          {/* Sliding indicator */}
          <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />

          {/* Simulation option */}
          <View style={styles.option}>
            <IconSymbol
              name="pause.circle.fill"
              size={16}
              color={!isLive ? colors.background : colors.muted}
            />
            <Text
              style={{ color: !isLive ? colors.background : colors.muted }}
              className="text-xs font-semibold ml-1"
            >
              Simulation
            </Text>
          </View>

          {/* Live option */}
          <View style={styles.option}>
            <IconSymbol
              name="bolt.fill"
              size={16}
              color={isLive ? colors.background : colors.muted}
            />
            <Text
              style={{ color: isLive ? colors.background : colors.muted }}
              className="text-xs font-semibold ml-1"
            >
              Live
            </Text>
          </View>
        </Animated.View>
      </Pressable>

      {/* Status indicator */}
      <View className="flex-row items-center justify-center mt-2 gap-1">
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isLive ? colors.error : colors.success },
          ]}
        />
        <Text className="text-xs text-muted">
          {isLive ? "Real money at risk" : "Paper trading active"}
        </Text>
      </View>
    </View>
  );
}

/**
 * Compact Trading Mode Badge
 * Shows current mode in a small badge format
 */
export function TradingModeBadge({
  mode,
  onPress,
}: {
  mode: TradingMode;
  onPress?: () => void;
}) {
  const colors = useColors();
  const isLive = mode === "live";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.badge,
        {
          backgroundColor: isLive ? colors.error + "20" : colors.primary + "20",
          borderColor: isLive ? colors.error : colors.primary,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View
        style={[
          styles.badgeDot,
          { backgroundColor: isLive ? colors.error : colors.primary },
        ]}
      />
      <Text
        style={{ color: isLive ? colors.error : colors.primary }}
        className="text-xs font-semibold"
      >
        {isLive ? "LIVE" : "SIM"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    width: 80,
    height: 34,
    borderRadius: 17,
    left: 0,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
