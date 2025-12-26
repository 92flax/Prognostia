import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatCurrency, formatNumber } from "@/lib/format";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface PositionSizeSelectorProps {
  /** Available balance in USDT */
  availableBalance: number;
  /** Current leverage */
  leverage: number;
  /** Current asset price */
  assetPrice: number;
  /** Asset symbol (e.g., "BTC") */
  assetSymbol: string;
  /** Callback when size changes */
  onSizeChange: (sizeUsdt: number) => void;
  /** Initial size in USDT */
  initialSize?: number;
}

const PERCENTAGE_OPTIONS = [25, 50, 75, 100];

export function PositionSizeSelector({
  availableBalance,
  leverage,
  assetPrice,
  assetSymbol,
  onSizeChange,
  initialSize = 0,
}: PositionSizeSelectorProps) {
  const colors = useColors();
  const [sizeUsdt, setSizeUsdt] = useState(initialSize);
  const [inputValue, setInputValue] = useState(initialSize > 0 ? initialSize.toString() : "");
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);

  // Calculate position size in asset units
  const positionSizeAsset = assetPrice > 0 ? (sizeUsdt * leverage) / assetPrice : 0;
  
  // Calculate margin required
  const marginRequired = sizeUsdt;
  
  // Check if size exceeds available balance
  const exceedsBalance = sizeUsdt > availableBalance;

  const handlePercentSelect = (percent: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newSize = Math.floor((availableBalance * percent) / 100);
    setSizeUsdt(newSize);
    setInputValue(newSize.toString());
    setSelectedPercent(percent);
    onSizeChange(newSize);
  };

  const handleInputChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    setInputValue(cleaned);
    
    const numValue = parseFloat(cleaned) || 0;
    setSizeUsdt(numValue);
    setSelectedPercent(null);
    onSizeChange(numValue);
  };

  const handleInputBlur = () => {
    // Round to 2 decimal places on blur
    const rounded = Math.round(sizeUsdt * 100) / 100;
    setSizeUsdt(rounded);
    setInputValue(rounded > 0 ? rounded.toString() : "");
    onSizeChange(rounded);
  };

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      {/* Header */}
      <Text className="text-sm font-semibold text-foreground mb-3">
        Position Size
      </Text>

      {/* USDT Input */}
      <View className="mb-4">
        <Text className="text-xs text-muted mb-2">Amount (USDT)</Text>
        <View 
          className="flex-row items-center bg-background rounded-xl border px-4 py-3"
          style={{ borderColor: exceedsBalance ? colors.error : colors.border }}
        >
          <Text className="text-lg text-muted mr-2">$</Text>
          <TextInput
            className="flex-1 text-lg font-semibold text-foreground"
            value={inputValue}
            onChangeText={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <Text className="text-sm text-muted">USDT</Text>
        </View>
        {exceedsBalance && (
          <Text className="text-xs text-error mt-1">
            Exceeds available balance
          </Text>
        )}
      </View>

      {/* Percentage Buttons */}
      <View className="flex-row gap-2 mb-4">
        {PERCENTAGE_OPTIONS.map((percent) => {
          const isSelected = selectedPercent === percent;
          return (
            <Pressable
              key={percent}
              onPress={() => handlePercentSelect(percent)}
              style={({ pressed }) => [
                styles.percentButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected ? "#FFFFFF" : colors.foreground,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {percent}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Position Details */}
      <View className="bg-background rounded-xl p-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-muted">Margin Required</Text>
          <Text className="text-xs font-medium text-foreground">
            {formatCurrency(marginRequired)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-muted">Position Value ({leverage}x)</Text>
          <Text className="text-xs font-medium text-foreground">
            {formatCurrency(sizeUsdt * leverage)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted">Position Size</Text>
          <Text className="text-xs font-medium text-foreground">
            {formatNumber(positionSizeAsset, 6)} {assetSymbol}
          </Text>
        </View>
      </View>

      {/* Available Balance Info */}
      <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
        <Text className="text-xs text-muted">Available Balance</Text>
        <Text className="text-xs font-medium text-success">
          {formatCurrency(availableBalance)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  percentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
