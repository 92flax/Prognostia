import { ScrollView, Text, View, RefreshControl } from "react-native";
import { useState, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { ForecastChart } from "@/components/forecast-chart";
import { SentimentGauge } from "@/components/sentiment-gauge";
import { NewsHeadline } from "@/components/news-headline";
import { ExplainableAICard } from "@/components/explainable-ai-card";
import { MetricCard } from "@/components/metric-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatTimeAgo, formatPercentRaw } from "@/lib/format";
import { mockPriceForecast, mockSentimentData, mockAISignal, mockAIReasoning } from "@/lib/mock-data";

export default function AIScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("BTC");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const forecast = mockPriceForecast;
  const sentiment = mockSentimentData;
  const signal = mockAISignal;
  const reasoning = mockAIReasoning;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">AI Predictions</Text>
          <Text className="text-sm text-muted mt-1">
            TimesFM + FinBERT Analysis
          </Text>
        </View>

        {/* Combined Signal */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-muted">Combined AI Signal</Text>
              <Text className="text-xs text-muted">
                Updated {formatTimeAgo(signal.timestamp)}
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    signal.direction === "bullish"
                      ? colors.success + "20"
                      : signal.direction === "bearish"
                      ? colors.error + "20"
                      : colors.warning + "20",
                }}
              >
                <IconSymbol
                  name={
                    signal.direction === "bullish"
                      ? "arrow.up.circle.fill"
                      : signal.direction === "bearish"
                      ? "arrow.down.circle.fill"
                      : "minus.circle.fill"
                  }
                  size={36}
                  color={
                    signal.direction === "bullish"
                      ? colors.success
                      : signal.direction === "bearish"
                      ? colors.error
                      : colors.warning
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground capitalize">
                  {signal.direction}
                </Text>
                <Text className="text-sm text-muted">
                  {Math.round(signal.confidence * 100)}% confidence
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Explainable AI - Why This Signal? */}
        <View className="px-4 py-3">
          <ExplainableAICard
            reasoning={reasoning}
            direction={signal.direction}
            confidence={signal.confidence}
          />
        </View>

        {/* TimesFM Price Forecast */}
        <View className="px-4 py-3">
          <View className="flex-row items-center gap-2 mb-3">
            <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground">
              TimesFM Forecast
            </Text>
          </View>
          <ForecastChart
            currentPrice={forecast.currentPrice}
            predictions={forecast.predictions}
            width={340}
            height={200}
          />
        </View>

        {/* Forecast Confidence */}
        <View className="px-4 py-2">
          <View className="flex-row gap-3">
            {forecast.predictions.map((pred) => (
              <MetricCard
                key={pred.horizon}
                title={pred.horizon}
                value={formatPercentRaw(pred.confidence)}
                subtitle="confidence"
                className="flex-1"
              />
            ))}
          </View>
        </View>

        {/* FinBERT Sentiment */}
        <View className="px-4 py-3">
          <View className="flex-row items-center gap-2 mb-3">
            <IconSymbol name="brain.head.profile" size={20} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground">
              FinBERT Sentiment
            </Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <SentimentGauge score={sentiment.score} size={180} />
          </View>
        </View>

        {/* News Headlines */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">
              Recent Headlines
            </Text>
            <Text className="text-sm text-primary">See All</Text>
          </View>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            {sentiment.headlines.map((headline, index) => (
              <NewsHeadline
                key={index}
                text={headline.text}
                score={headline.score}
                source={headline.source}
                timestamp={headline.timestamp}
                className={index === sentiment.headlines.length - 1 ? "border-b-0" : ""}
              />
            ))}
          </View>
        </View>

        {/* Model Info */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Model Information
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">TimesFM Version</Text>
                <Text className="text-sm text-foreground">google/timesfm-2.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">FinBERT Model</Text>
                <Text className="text-sm text-foreground">ProsusAI/finbert</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">XAI Engine</Text>
                <Text className="text-sm text-foreground">v2.0 (Explainable)</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Last Training</Text>
                <Text className="text-sm text-foreground">Dec 2024</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
