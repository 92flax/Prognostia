import { Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface QuickActionButtonProps {
  type: "buy" | "sell";
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function QuickActionButton({
  type,
  onPress,
  disabled,
  className,
  label,
}: QuickActionButtonProps) {
  const colors = useColors();
  const isBuy = type === "buy";
  const buttonColor = isBuy ? colors.success : colors.error;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: buttonColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <IconSymbol
        name={isBuy ? "plus.circle.fill" : "minus.circle.fill"}
        size={20}
        color="#FFFFFF"
      />
      <Text style={styles.text}>{label || (isBuy ? "Buy" : "Sell")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
