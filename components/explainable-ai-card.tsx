import { View, Text, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { AIReasoning, ReasoningFactor, SignalDirection } from "@/lib/types";

interface ExplainableAICardProps {
  reasoning: AIReasoning;
  direction: SignalDirection;
  confidence: number;
  className?: string;
}

/**
 * Explainable AI Card
 * 
 * Shows the reasoning behind AI predictions:
 * - FinBERT sentiment analysis
 * - Technical indicators (EMA, RSI)
 * - Volume analysis
 * - Volatility assessment
 */
export function ExplainableAICard({
  reasoning,
  direction,
  confidence,
  className,
}: ExplainableAICardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const directionColors = {
    bullish: colors.success,
    bearish: colors.error,
    neutral: colors.muted,
  };
  const directionColor = directionColors[direction];

  const impactColors = {
    positive: colors.success,
    negative: colors.error,
    neutral: colors.muted,
  };

  const impactIcons: Record<string, string> = {
    positive: "arrow.up.circle.fill",
    negative: "arrow.down.circle.fill",
    neutral: "minus.circle.fill",
  };

  return (
    <View className={cn("bg-surface rounded-2xl p-4 border border-border", className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="lightbulb.fill" size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-foreground">AI Reasoning</Text>
            <Text className="text-xs text-muted">Explainable Predictions</Text>
          </View>
        </View>
        <View 
          className="px-3 py-1.5 rounded-full"
          style={{ backgroundColor: directionColor + "20" }}
        >
          <Text style={{ color: directionColor }} className="text-sm font-semibold capitalize">
            {direction}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <View className="p-4 bg-background rounded-xl mb-4">
        <View className="flex-row items-start gap-2">
          <IconSymbol name="sparkles" size={18} color={colors.primary} />
          <Text className="text-sm text-foreground flex-1 leading-5">
            {reasoning.summary}
          </Text>
        </View>
      </View>

      {/* Confidence Bar */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-muted">Signal Confidence</Text>
          <Text className="text-sm font-semibold text-foreground">
            {(confidence * 100).toFixed(0)}%
          </Text>
        </View>
        <View className="h-2 bg-border rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${confidence * 100}%`,
              backgroundColor: directionColor,
            }}
          />
        </View>
      </View>

      {/* Factors List */}
      <View className="mb-2">
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={({ pressed }) => [
            styles.expandButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text className="text-sm font-medium text-foreground">
            Contributing Factors ({reasoning.factors.length})
          </Text>
          <IconSymbol
            name={expanded ? "chevron.up" : "chevron.down"}
            size={16}
            color={colors.muted}
          />
        </Pressable>
      </View>

      {/* Factors (always show top 2, expand for all) */}
      <View className="gap-2">
        {reasoning.factors
          .slice(0, expanded ? undefined : 2)
          .map((factor, index) => (
            <FactorItem key={index} factor={factor} colors={colors} impactColors={impactColors} />
          ))}
      </View>

      {/* Expand/Collapse */}
      {reasoning.factors.length > 2 && !expanded && (
        <Pressable
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [
            styles.showMoreButton,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text className="text-sm text-primary">
            Show {reasoning.factors.length - 2} more factors
          </Text>
        </Pressable>
      )}

      {/* Model Attribution */}
      <View className="mt-4 pt-3 border-t border-border flex-row items-center justify-between">
        <Text className="text-xs text-muted">
          Powered by TimesFM + FinBERT
        </Text>
        <View className="flex-row items-center gap-1">
          <IconSymbol name="wand.and.stars" size={12} color={colors.muted} />
          <Text className="text-xs text-muted">XAI v2.0</Text>
        </View>
      </View>
    </View>
  );
}

interface FactorItemProps {
  factor: ReasoningFactor;
  colors: ReturnType<typeof useColors>;
  impactColors: Record<string, string>;
}

function FactorItem({ factor, colors, impactColors }: FactorItemProps) {
  const impactColor = impactColors[factor.impact];
  const impactIcon = factor.impact === "positive" 
    ? "arrow.up.circle.fill" 
    : factor.impact === "negative" 
    ? "arrow.down.circle.fill" 
    : "minus.circle.fill";

  return (
    <View className="p-3 bg-background rounded-xl">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <IconSymbol name={impactIcon as any} size={16} color={impactColor} />
          <Text className="text-sm font-medium text-foreground">{factor.name}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold" style={{ color: impactColor }}>
            {typeof factor.value === "number" 
              ? factor.value.toFixed(2) 
              : factor.value}
          </Text>
          <View 
            className="px-1.5 py-0.5 rounded"
            style={{ backgroundColor: impactColor + "20" }}
          >
            <Text style={{ color: impactColor }} className="text-[10px] font-medium">
              {(factor.weight * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
      <Text className="text-xs text-muted leading-4">
        {factor.explanation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  showMoreButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
});
