import { ScrollView, Text, View, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ActiveSignalCard } from "@/components/active-signal-card";
import { MarketTickerCard } from "@/components/market-ticker-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  mockActiveSignal, 
  mockMarketSummary,
  mockMarketConditions,
} from "@/lib/mock-signal";
import { generateSignal } from "@/lib/signal-engine";

export default function DashboardScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [signal, setSignal] = useState(mockActiveSignal);
  const [selectedMarket, setSelectedMarket] = useState('BTCUSDT');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Refresh signal
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Simulate fetching new market data and regenerating signal
    setTimeout(() => {
      const newSignal = generateSignal({
        ...mockMarketConditions,
        currentPrice: mockMarketConditions.currentPrice * (1 + (Math.random() - 0.5) * 0.01),
        sentimentScore: Math.random() * 2 - 1,
        rsi: 30 + Math.random() * 40,
      });
      setSignal(newSignal);
      setLastUpdate(new Date());
      setRefreshing(false);
    }, 1000);
  }, []);

  // Handle market selection
  const handleMarketSelect = (symbol: string) => {
    setSelectedMarket(symbol);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">Signals</Text>
              <Text className="text-sm text-muted mt-1">
                Signal Intelligence Dashboard
              </Text>
            </View>
            
            {/* Refresh Button */}
            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.refreshButtonPressed,
              ]}
            >
              <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
            </Pressable>
          </View>
          
          {/* Last Update */}
          <View className="flex-row items-center gap-1 mt-2">
            <IconSymbol name="clock.fill" size={12} color={colors.muted} />
            <Text className="text-xs text-muted">
              Last update: {lastUpdate.toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Active Signal Card - THE MAIN FEATURE */}
        <View className="px-4 py-3">
          <ActiveSignalCard signal={signal} />
        </View>

        {/* Market Overview */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">
              Markets
            </Text>
            <Text className="text-xs text-muted">
              Tap to switch asset
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {mockMarketSummary.map((market) => (
              <MarketTickerCard
                key={market.symbol}
                market={market}
                isSelected={market.symbol === selectedMarket}
                onPress={() => handleMarketSelect(market.symbol)}
                className="w-44"
              />
            ))}
          </ScrollView>
        </View>

        {/* Quick Stats */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Signal Stats
          </Text>
          
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-xs uppercase tracking-wide mb-1">
                Today's Signals
              </Text>
              <Text className="text-foreground text-2xl font-bold">12</Text>
              <Text className="text-success text-xs mt-1">+3 vs yesterday</Text>
            </View>
            
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-muted text-xs uppercase tracking-wide mb-1">
                Win Rate (7d)
              </Text>
              <Text className="text-success text-2xl font-bold">68%</Text>
              <Text className="text-muted text-xs mt-1">Based on 47 signals</Text>
            </View>
          </View>
        </View>

        {/* How to Use */}
        <View className="px-4 py-3">
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
              <Text className="text-primary font-semibold">How to Use</Text>
            </View>
            <Text className="text-foreground text-sm leading-relaxed">
              1. Review the signal setup above{'\n'}
              2. Tap "Copy Signal" to copy all parameters{'\n'}
              3. Open Bitget and create a new position{'\n'}
              4. Paste the setup values (LEV, TP, SL){'\n'}
              5. Execute the trade manually
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View className="px-4 py-3">
          <Text className="text-muted text-xs text-center leading-relaxed">
            Signals are for informational purposes only. Past performance does not guarantee future results. 
            Always do your own research and trade responsibly.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonPressed: {
    opacity: 0.7,
  },
});
