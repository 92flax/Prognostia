import { ScrollView, Text, View, RefreshControl, StyleSheet } from "react-native";
import { useState, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AssetSelector } from "@/components/asset-selector";
import { AutoTradeToggle } from "@/components/auto-trade-toggle";
import { TradingSignalCard } from "@/components/trading-signal-card";
import { ModeIndicator } from "@/components/mode-indicator";
import { WalletBalanceCard } from "@/components/wallet-balance-card";
import { TradeExecutionModal } from "@/components/trade-execution-modal";
import { BotActivationBanner } from "@/components/bot-activation-banner";
import { LivePositionCard, LivePosition } from "@/components/live-position-card";
import { useColors } from "@/hooks/use-colors";
import { usePrices } from "@/lib/price-context";
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
 * - Bot Activation Banner with countdown
 * - Live Positions with pulsating badges
 * - Wallet balance display (available/locked)
 * - Real-time price updates
 * - Asset selector (horizontal scroll)
 * - Mode indicator (PAPER/LIVE)
 * - Auto-trade toggle
 * - Active signal card with full trade setup
 * - Trade execution modal with position size selector
 */
export default function DashboardScreen() {
  const colors = useColors();
  const { getPrice, formatPrice, isConnected: priceConnected } = usePrices();
  
  // State
  const [selectedAsset, setSelectedAsset] = useState("BTCUSDT");
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [tradingMode, setTradingMode] = useState<"PAPER" | "LIVE">("PAPER");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<SignalSetup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Bot activation state
  const [isBotActivated, setIsBotActivated] = useState(false);
  const [botAction, setBotAction] = useState<"BUY" | "SELL">("BUY");
  
  // Open positions
  const [openPositions, setOpenPositions] = useState<LivePosition[]>([]);
  
  // Wallet state
  const [totalBalance, setTotalBalance] = useState(MOCK_PAPER_WALLET.balance);
  const [availableBalance, setAvailableBalance] = useState(MOCK_PAPER_WALLET.balance);
  const [lockedBalance, setLockedBalance] = useState(0);
  
  // Trade execution modal state
  const [showTradeModal, setShowTradeModal] = useState(false);

  // Generate initial signal
  useEffect(() => {
    const signal = generateMockSignal(selectedAsset);
    setCurrentSignal(signal);
  }, [selectedAsset]);

  // Auto-trade trigger when signal confidence is high
  useEffect(() => {
    if (autoTradeEnabled && currentSignal && currentSignal.confidenceScore >= 75) {
      // Trigger bot activation with countdown
      setIsBotActivated(true);
      setBotAction(currentSignal.direction === "LONG" ? "BUY" : "SELL");
    }
  }, [autoTradeEnabled, currentSignal]);

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

  // Handle bot countdown complete - execute trade
  const handleBotCountdownComplete = async () => {
    if (!currentSignal) return;
    
    // Default position size for auto-trade (10% of available balance)
    const positionSize = availableBalance * 0.1;
    
    // Create new position
    const newPosition: LivePosition = {
      id: Date.now(),
      asset: currentSignal.asset,
      direction: currentSignal.direction,
      entryPrice: currentSignal.entryPrice,
      leverage: currentSignal.leverageRecommendation,
      margin: positionSize,
      size: (positionSize * currentSignal.leverageRecommendation) / currentSignal.entryPrice,
      takeProfitPrice: currentSignal.takeProfitPrice,
      stopLossPrice: currentSignal.stopLossPrice,
      mode: tradingMode,
      timestampOpen: new Date(),
    };
    
    setOpenPositions(prev => [newPosition, ...prev]);
    setAvailableBalance(prev => prev - positionSize);
    setLockedBalance(prev => prev + positionSize);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setIsBotActivated(false);
    
    // Generate new signal
    const newSignal = generateMockSignal(selectedAsset);
    setCurrentSignal(newSignal);
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsLoadingBalance(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate new signal
    const signal = generateMockSignal(selectedAsset);
    setCurrentSignal(signal);
    
    setIsRefreshing(false);
    setIsLoadingBalance(false);
  }, [selectedAsset]);

  // Handle opening trade modal
  const handleOpenTradeModal = () => {
    if (!currentSignal) return;
    setShowTradeModal(true);
  };

  // Handle trade execution with position size
  const handleExecuteTrade = async (sizeUsdt: number) => {
    if (!currentSignal) return;
    
    setIsExecuting(true);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create new position
    const newPosition: LivePosition = {
      id: Date.now(),
      asset: currentSignal.asset,
      direction: currentSignal.direction,
      entryPrice: currentSignal.entryPrice,
      leverage: currentSignal.leverageRecommendation,
      margin: sizeUsdt,
      size: (sizeUsdt * currentSignal.leverageRecommendation) / currentSignal.entryPrice,
      takeProfitPrice: currentSignal.takeProfitPrice,
      stopLossPrice: currentSignal.stopLossPrice,
      mode: tradingMode,
      timestampOpen: new Date(),
    };
    
    setOpenPositions(prev => [newPosition, ...prev]);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Update balances
    setAvailableBalance(prev => prev - sizeUsdt);
    setLockedBalance(prev => prev + sizeUsdt);
    
    setIsExecuting(false);
    setShowTradeModal(false);
    
    // Generate new signal after execution
    const newSignal = generateMockSignal(selectedAsset);
    setCurrentSignal(newSignal);
  };

  // Handle closing a position
  const handleClosePosition = (position: LivePosition) => {
    // Get current price for P&L calculation
    const priceData = getPrice(position.asset);
    const currentPrice = priceData?.price || position.entryPrice;
    
    // Calculate P&L
    const priceDiff = position.direction === "LONG"
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
    const pnlPercent = (priceDiff / position.entryPrice) * position.leverage * 100;
    const pnlAbsolute = position.margin * (pnlPercent / 100);
    
    // Update balances
    const returnedAmount = position.margin + pnlAbsolute;
    setAvailableBalance(prev => prev + returnedAmount);
    setLockedBalance(prev => prev - position.margin);
    setTotalBalance(prev => prev + pnlAbsolute);
    
    // Remove position
    setOpenPositions(prev => prev.filter(p => p.id !== position.id));
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        pnlAbsolute >= 0 
          ? Haptics.NotificationFeedbackType.Success 
          : Haptics.NotificationFeedbackType.Warning
      );
    }
  };

  // Get current price for selected asset
  const currentPriceData = getPrice(selectedAsset);

  return (
    <ScreenContainer>
      {/* Bot Activation Banner */}
      <BotActivationBanner
        isActive={isBotActivated}
        action={botAction}
        asset={selectedAsset}
        direction={currentSignal?.direction || "LONG"}
        countdownSeconds={3}
        onCountdownComplete={handleBotCountdownComplete}
      />

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
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                AQTE Trading
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Automated Quantitative Trading Engine
              </Text>
            </View>
            {/* Price Connection Status */}
            <View style={[styles.connectionBadge, { backgroundColor: priceConnected ? colors.success + "20" : colors.error + "20" }]}>
              <View style={[styles.connectionDot, { backgroundColor: priceConnected ? colors.success : colors.error }]} />
              <Text style={[styles.connectionText, { color: priceConnected ? colors.success : colors.error }]}>
                {priceConnected ? "LIVE" : "OFFLINE"}
              </Text>
            </View>
          </View>
          
          {/* Current Price Display */}
          {currentPriceData && (
            <View style={styles.priceDisplay}>
              <Text style={[styles.priceLabel, { color: colors.muted }]}>
                {selectedAsset.replace("USDT", "")} Price
              </Text>
              <Text style={[styles.priceValue, { color: colors.foreground }]}>
                ${currentPriceData.priceFormatted}
              </Text>
              <Text style={[
                styles.priceChange, 
                { color: currentPriceData.change24hPercent >= 0 ? colors.success : colors.error }
              ]}>
                {currentPriceData.change24hPercent >= 0 ? "+" : ""}
                {currentPriceData.change24hPercent.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>

        {/* Mode Indicator */}
        <View style={styles.section}>
          <ModeIndicator
            mode={tradingMode}
            isConnected={isConnected}
            balance={totalBalance}
          />
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.section}>
          <WalletBalanceCard
            totalBalance={totalBalance}
            availableBalance={availableBalance}
            lockedBalance={lockedBalance}
            isLive={tradingMode === "LIVE"}
            isLoading={isLoadingBalance}
          />
        </View>

        {/* Open Positions */}
        {openPositions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>
              OPEN POSITIONS ({openPositions.length})
            </Text>
            {openPositions.map(position => (
              <LivePositionCard
                key={position.id}
                position={position}
                onClose={handleClosePosition}
              />
            ))}
          </View>
        )}

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
              onExecute={handleOpenTradeModal}
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

      {/* Trade Execution Modal */}
      {currentSignal && (
        <TradeExecutionModal
          visible={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          onConfirm={handleExecuteTrade}
          signal={currentSignal}
          availableBalance={availableBalance}
          isLive={tradingMode === "LIVE"}
          isExecuting={isExecuting}
        />
      )}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: "700",
  },
  priceDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
    gap: 8,
  },
  priceLabel: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  priceChange: {
    fontSize: 14,
    fontWeight: "600",
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
