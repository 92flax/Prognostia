import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: React.ReactNode;
  showChevron?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
  className?: string;
}

export function SettingsRow({
  title,
  subtitle,
  value,
  icon,
  showChevron = false,
  toggle = false,
  toggleValue = false,
  onToggle,
  onPress,
  danger = false,
  className,
}: SettingsRowProps) {
  const colors = useColors();

  const content = (
    <View className={cn("flex-row items-center py-4 border-b border-border", className)}>
      {icon && <View className="mr-3">{icon}</View>}

      <View className="flex-1">
        <Text
          className="text-base font-medium"
          style={{ color: danger ? colors.error : colors.foreground }}
        >
          {title}
        </Text>
        {subtitle && <Text className="text-sm text-muted mt-0.5">{subtitle}</Text>}
      </View>

      {value && !toggle && (
        <Text className="text-sm text-muted mr-2">{value}</Text>
      )}

      {toggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary + "80" }}
          thumbColor={toggleValue ? colors.primary : colors.muted}
        />
      )}

      {showChevron && !toggle && (
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
      )}
    </View>
  );

  if (onPress && !toggle) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
