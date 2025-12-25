import { View, Text, Pressable, StyleSheet, PanResponder } from "react-native";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

interface SliderSettingProps {
  title: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  onValueChange: (value: number) => void;
  className?: string;
}

export function SliderSetting({
  title,
  value,
  min,
  max,
  step = 0.1,
  unit = "",
  formatValue,
  onValueChange,
  className,
}: SliderSettingProps) {
  const colors = useColors();
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;
  const trackWidth = 280;
  const percentage = ((value - min) / (max - min)) * 100;

  // Simple increment/decrement buttons instead of slider
  const increment = () => {
    const newValue = Math.min(max, value + step);
    onValueChange(Math.round(newValue * 10) / 10);
  };

  const decrement = () => {
    const newValue = Math.max(min, value - step);
    onValueChange(Math.round(newValue * 10) / 10);
  };

  return (
    <View className={cn("py-4 border-b border-border", className)}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-medium text-foreground">{title}</Text>
        <Text className="text-base font-semibold text-primary">{displayValue}</Text>
      </View>

      {/* Custom slider track */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={decrement}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>−</Text>
        </Pressable>

        <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: colors.primary,
            }}
          />
        </View>

        <Pressable
          onPress={increment}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "600" }}>+</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-between mt-2">
        <Text className="text-xs text-muted">
          {formatValue ? formatValue(min) : `${min}${unit}`}
        </Text>
        <Text className="text-xs text-muted">
          {formatValue ? formatValue(max) : `${max}${unit}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
