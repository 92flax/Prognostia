/**
 * Bot Activation Banner
 * 
 * Shows countdown when bot is about to execute a trade:
 * "🤖 BOT ACTIVATED: Buying BTC Long in 3s..."
 */

import React, { useEffect, useState, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";
import * as Haptics from "expo-haptics";

export interface BotActivationBannerProps {
  isActive: boolean;
  action: "BUY" | "SELL";
  asset: string;
  direction: "LONG" | "SHORT";
  countdownSeconds?: number;
  onCountdownComplete?: () => void;
}

export function BotActivationBanner({
  isActive,
  action,
  asset,
  direction,
  countdownSeconds = 3,
  onCountdownComplete,
}: BotActivationBannerProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Slide in/out animation
  useEffect(() => {
    if (isActive) {
      setCountdown(countdownSeconds);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, countdownSeconds, slideAnim]);

  // Pulsing animation
  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, pulseAnim]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Haptic feedback on execution
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onCountdownComplete?.();
          return 0;
        }
        // Haptic tick on each second
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onCountdownComplete]);

  if (!isActive) return null;

  const isLong = direction === "LONG";
  const bgColor = isLong ? "bg-success" : "bg-error";
  const actionText = action === "BUY" ? "Buying" : "Selling";

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: slideAnim },
          { scale: pulseAnim },
        ],
      }}
      className={`${bgColor} mx-4 rounded-xl p-4 shadow-lg`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">🤖</Text>
          <View>
            <Text className="text-white font-bold text-lg">
              BOT ACTIVATED
            </Text>
            <Text className="text-white/90 text-sm">
              {actionText} {asset.replace("USDT", "")} {direction}
            </Text>
          </View>
        </View>
        
        <View className="bg-white/20 rounded-full w-14 h-14 items-center justify-center">
          <Text className="text-white font-bold text-2xl">
            {countdown}s
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
