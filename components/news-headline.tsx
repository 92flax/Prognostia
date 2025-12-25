import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatTimeAgo } from "@/lib/format";

interface NewsHeadlineProps {
  text: string;
  score: number;
  source: string;
  timestamp: Date;
  className?: string;
}

export function NewsHeadline({
  text,
  score,
  source,
  timestamp,
  className,
}: NewsHeadlineProps) {
  const colors = useColors();

  const getSentimentColor = (s: number) => {
    if (s > 0.2) return colors.success;
    if (s < -0.2) return colors.error;
    return colors.warning;
  };

  const sentimentColor = getSentimentColor(score);
  const scorePercent = Math.round(score * 100);

  return (
    <View className={cn("py-3 border-b border-border", className)}>
      <View className="flex-row items-start gap-3">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
          style={{ backgroundColor: sentimentColor + "20" }}
        >
          <IconSymbol
            name={
              score > 0.2
                ? "arrow.up.circle.fill"
                : score < -0.2
                ? "arrow.down.circle.fill"
                : "minus.circle.fill"
            }
            size={16}
            color={sentimentColor}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm text-foreground leading-5 mb-2" numberOfLines={2}>
            {text}
          </Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted">{source}</Text>
              <Text className="text-xs text-muted">•</Text>
              <Text className="text-xs text-muted">{formatTimeAgo(timestamp)}</Text>
            </View>
            <View
              className="px-2 py-0.5 rounded"
              style={{ backgroundColor: sentimentColor + "20" }}
            >
              <Text style={{ color: sentimentColor }} className="text-xs font-medium">
                {scorePercent > 0 ? "+" : ""}
                {scorePercent}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
