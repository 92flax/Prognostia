import { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { PositionSizeSelector } from "./position-size-selector";
import { formatCurrency } from "@/lib/format";
import { IconSymbol } from "./ui/icon-symbol";
import * as Haptics from "expo-haptics";
import type { SignalSetup } from "@/lib/signal-engine";

interface TradeExecutionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when trade is confirmed */
  onConfirm: (sizeUsdt: number) => void;
  /** The signal to execute */
  signal: SignalSetup;
  /** Available balance in USDT */
  availableBalance: number;
  /** Whether in live mode */
  isLive: boolean;
  /** Loading state during execution */
  isExecuting?: boolean;
}

export function TradeExecutionModal({
  visible,
  onClose,
  onConfirm,
  signal,
  availableBalance,
  isLive,
  isExecuting = false,
}: TradeExecutionModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [positionSize, setPositionSize] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration gating - prevent flash of unstyled content
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Reset position size when modal opens
  useEffect(() => {
    if (visible) {
      setPositionSize(0);
    }
  }, [visible]);

  const isLong = signal.direction === "LONG";
  const directionColor = isLong ? colors.success : colors.error;
  
  // Calculate potential P&L
  const positionValue = positionSize * signal.leverageRecommendation;
  const riskAmount = positionSize * (Math.abs(signal.entryPrice - signal.stopLossPrice) / signal.entryPrice);
  const rewardAmount = positionSize * (Math.abs(signal.takeProfitPrice - signal.entryPrice) / signal.entryPrice);

  const canExecute = positionSize > 0 && positionSize <= availableBalance && !isExecuting;

  // Android 15 edge-to-edge: Calculate dynamic bottom padding
  const bottomPadding = Platform.select({
    android: Math.max(insets.bottom, 24), // At least 24px on Android 15
    ios: Math.max(insets.bottom, 16),
    default: 16,
  });

  const handleConfirm = () => {
    if (!canExecute) return;
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onConfirm(positionSize);
  };

  const handleClose = () => {
    setPositionSize(0);
    onClose();
  };

  // Don't render until hydrated to prevent layout flash
  if (!isHydrated) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true} // Android 15 edge-to-edge
    >
      <View style={styles.overlay}>
        <View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.background,
              paddingBottom: bottomPadding, // Dynamic safe area padding
            }
          ]}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: directionColor + '20' }}
              >
                <IconSymbol 
                  name={isLong ? "arrow.up" : "arrow.down"} 
                  size={20} 
                  color={directionColor} 
                />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">
                  {isLong ? "BUY / LONG" : "SELL / SHORT"}
                </Text>
                <Text className="text-sm text-muted">{signal.asset}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <IconSymbol name="xmark" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView 
            className="flex-1 p-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Trade Mode Warning */}
            <View 
              className="flex-row items-center gap-2 p-3 rounded-xl mb-4"
              style={{ backgroundColor: isLive ? colors.error + '15' : colors.success + '15' }}
            >
              <IconSymbol 
                name={isLive ? "exclamationmark.triangle.fill" : "checkmark.shield.fill"} 
                size={18} 
                color={isLive ? colors.error : colors.success} 
              />
              <Text 
                className="text-sm font-medium flex-1"
                style={{ color: isLive ? colors.error : colors.success }}
              >
                {isLive 
                  ? "LIVE MODE - Real funds will be used!" 
                  : "Paper Mode - Simulated trade"}
              </Text>
            </View>

            {/* Signal Summary */}
            <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Trade Setup
              </Text>
              <View className="flex-row flex-wrap gap-y-3">
                <View className="w-1/2">
                  <Text className="text-xs text-muted">Leverage</Text>
                  <Text className="text-base font-bold text-foreground">
                    {signal.leverageRecommendation}x
                  </Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-xs text-muted">Entry</Text>
                  <Text className="text-base font-bold text-foreground">
                    {formatCurrency(signal.entryPrice)}
                  </Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-xs text-muted">Take Profit</Text>
                  <Text className="text-base font-bold text-success">
                    {formatCurrency(signal.takeProfitPrice)}
                  </Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-xs text-muted">Stop Loss</Text>
                  <Text className="text-base font-bold text-error">
                    {formatCurrency(signal.stopLossPrice)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Position Size Selector */}
            <PositionSizeSelector
              availableBalance={availableBalance}
              leverage={signal.leverageRecommendation}
              assetPrice={signal.entryPrice}
              assetSymbol={signal.asset.replace("USDT", "")}
              onSizeChange={setPositionSize}
            />

            {/* Risk/Reward Summary */}
            {positionSize > 0 && (
              <View className="bg-surface rounded-xl p-4 mt-4 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Risk / Reward
                </Text>
                <View className="flex-row gap-4">
                  <View className="flex-1 bg-error/10 rounded-xl p-3">
                    <Text className="text-xs text-error mb-1">Max Loss</Text>
                    <Text className="text-lg font-bold text-error">
                      -{formatCurrency(riskAmount)}
                    </Text>
                  </View>
                  <View className="flex-1 bg-success/10 rounded-xl p-3">
                    <Text className="text-xs text-success mb-1">Target Profit</Text>
                    <Text className="text-lg font-bold text-success">
                      +{formatCurrency(rewardAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions - with safe area padding */}
          <View 
            className="p-4 border-t border-border"
            style={{ paddingBottom: 16 }} // Additional padding above safe area
          >
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={!canExecute}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  { 
                    backgroundColor: canExecute ? directionColor : colors.muted,
                    opacity: pressed && canExecute ? 0.8 : 1 
                  }
                ]}
              >
                {isExecuting ? (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    Executing...
                  </Text>
                ) : (
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    {isLive ? "Execute Trade" : "Paper Trade"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    flex: 0.4,
  },
  confirmButton: {
    flex: 0.6,
  },
});
