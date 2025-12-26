import { ScrollView, Text, View, RefreshControl, StyleSheet } from "react-native";
import { useState, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AssetSelector } from "@/components/asset-selector";
import { AutoTradeToggle } from "@/components/auto-trade-toggle";
import { TradingSignalCard } from "@/components/trading-signal-card";
import { ModeIndicator } from "@/components/mode-indicator";
import { useColors } from "@/hooks/use-colors";
import { SignalSetup } from "@/lib/signal-engine";
import {
  MOCK_ASSETS,
  generateMockSignal,
  MOCK_PAPER_WALLET,
} from "@/lib/mock-trading-data";

/**
 * Dashboard Screen - Main trading interface
 * 
 * Features:
 * - Asset selector (horizontal scroll)
 * - Mode indicator (PAPER/LIVE)
 * - Auto-trade toggle
 * - Active signal card with full trade setup
 */
export default function DashboardScreen() {
  const colors = useColors();
  
  // State
  const [selectedAsset, setSelectedAsset] = useState("BTCUSDT");
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [tradingMode, setTradingMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<SignalSetup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [balance, setBalance] = useState(MOCK_PAPER_WALLET.balance);

  // Generate initial signal
  useEffect(() => {
    const signal = generateMockSignal(selectedAsset);
    setCurrentSignal(signal);
  }, [selectedAsset]);

  // Handle asset selection
  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    const signal = generateMockSignal(symbol);
    setCurrentSignal(signal);
  };

  // Handle auto-trade toggle
  const handleAutoTradeToggle = (enabled: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAutoTradeEnabled(enabled);
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate new signal
    const signal = generateMockSignal(selectedAsset);
    setCurrentSignal(signal);
    
    setIsRefreshing(false);
  }, [selectedAsset]);

  // Handle trade execution
  const handleExecute = async () => {
    if (!currentSignal) return;
    
    setIsExecuting(true);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Update balance (simulate margin deduction)
    const margin = (currentSignal.entryPrice * 0.01) / currentSignal.leverageRecommendation;
    setBalance(prev => prev - margin);
    
    setIsExecuting(false);
    
    // Generate new signal after execution
    const newSignal = generateMockSignal(selectedAsset);
    setCurrentSignal(newSignal);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            AQTE Trading
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Automated Quantitative Trading Engine
          </Text>
        </View>

        {/* Mode Indicator */}
        <View style={styles.section}>
          <ModeIndicator
            mode={tradingMode}
            isConnected={isConnected}
            balance={balance}
          />
        </View>

        {/* Asset Selector */}
        <View style={styles.assetSection}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            SELECT ASSET
          </Text>
          <AssetSelector
            assets={MOCK_ASSETS}
            selectedAsset={selectedAsset}
            onSelect={handleAssetSelect}
          />
        </View>

        {/* Auto-Trade Toggle */}
        <View style={styles.section}>
          <AutoTradeToggle
            enabled={autoTradeEnabled}
            onToggle={handleAutoTradeToggle}
            mode={tradingMode}
            isConnected={isConnected}
          />
        </View>

        {/* Active Signal Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>
            ACTIVE SIGNAL
          </Text>
          {currentSignal ? (
            <TradingSignalCard
              signal={currentSignal}
              mode={tradingMode}
              autoTradeEnabled={autoTradeEnabled}
              onExecute={handleExecute}
              isExecuting={isExecuting}
            />
          ) : (
            <View
              style={[
                styles.noSignalCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.noSignalText, { color: colors.muted }]}>
                Analyzing market conditions...
              </Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <Text style={[styles.infoText, { color: colors.primary }]}>
            {tradingMode === "PAPER"
              ? "🧪 Paper Trading Mode - No real funds at risk"
              : "⚠️ Live Trading Mode - Real funds will be used"}
          </Text>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  assetSection: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  noSignalCard: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noSignalText: {
    fontSize: 15,
  },
  infoBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 40,
  },
});
