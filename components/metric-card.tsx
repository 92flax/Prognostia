import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  className,
}: MetricCardProps) {
  const colors = useColors();

  const trendColor = trend === "up" ? colors.success : trend === "down" ? colors.error : colors.muted;

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-muted">{title}</Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold text-foreground mb-1">{value}</Text>
      {(subtitle || trendValue) && (
        <View className="flex-row items-center gap-1">
          {trend && (
            <IconSymbol
              name={trend === "up" ? "chevron.up" : trend === "down" ? "chevron.down" : "minus.circle.fill"}
              size={14}
              color={trendColor}
            />
          )}
          {trendValue && (
            <Text style={{ color: trendColor }} className="text-sm font-medium">
              {trendValue}
            </Text>
          )}
          {subtitle && (
            <Text className="text-sm text-muted ml-1">{subtitle}</Text>
          )}
        </View>
      )}
    </View>
  );
}
