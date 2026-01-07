import { ScrollView, Text, View, RefreshControl, StyleSheet } from "react-native";
import { useState, useCallback, useEffect, useMemo } from "react";
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
import { LivePositionCard } from "@/components/live-position-card";
import { useColors } from "@/hooks/use-colors";
import { usePrices } from "@/lib/price-context";
import { useAutoTrade, useBotStatus, useLivePnL } from "@/lib/auto-trade-context";
import { generateSignal, type SignalSetup, type Timeframe } from "@/lib/signal-engine";
import { MOCK_ASSETS, getMarketConditions } from "@/lib/mock-trading-data";

/**
 * Dashboard Screen - Main trading interface with FSM-controlled bot
 * 
 * FSM States: IDLE → ANALYZING → SIGNAL_LOCKED → COUNTDOWN → EXECUTING → COOLDOWN → IDLE
 * 
 * Features:
 * - Deterministic state management via useAutoTrade context
 * - FSM-controlled bot execution with cooldown
 * - Live positions with real-time P&L
 * - Wallet balance display
 * - Real-time price updates
 * - Asset selector
 * - Auto-trade toggle
 */
export default function DashboardScreen() {
  const colors = useColors();
  const { getPrice, formatPrice, isConnected: priceConnected } = usePrices();
  
  // FSM-controlled state from context
  const {
    state,
    setMode,
    updateSettings,
    setTimeframe,
    lockSignal,
    startCountdown,
    startCooldown,
    setBotStatus,
    executeSignal,
    closePosition,
    updateMarkPrices,
    shouldAutoExecute,
    canTransitionTo,
    openPositions,
  } = useAutoTrade();
  
  const { status: botStatus, lockedSignal, cooldownEndsAt, isIdle, isCooldown } = useBotStatus();
  const { unrealizedPnl, realizedPnl, equity } = useLivePnL();
  
  // Local UI state (not trading state)
  const [selectedAsset, setSelectedAsset] = useState("BTCUSDT");
  const [currentSignal, setCurrentSignal] = useState<SignalSetup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Generate signal for selected asset
  const generateNewSignal = useCallback(() => {
    const marketConditions = getMarketConditions(selectedAsset);
    if (!marketConditions) {
      console.warn(`No market conditions for ${selectedAsset}`);
      return null;
    }
    const signal = generateSignal(marketConditions, {
      timeframe: state.activeTimeframe,
    });
    setCurrentSignal(signal);
    return signal;
  }, [selectedAsset, state.activeTimeframe]);

  // Generate initial signal
  useEffect(() => {
    generateNewSignal();
  }, [generateNewSignal]);

  // Update mark prices from price context
  useEffect(() => {
    const prices: Record<string, number> = {};
    MOCK_ASSETS.forEach((asset) => {
      const priceData = getPrice(asset.symbol);
      if (priceData) {
        prices[asset.symbol] = priceData.price;
      }
    });
    if (Object.keys(prices).length > 0) {
      updateMarkPrices(prices);
    }
  }, [getPrice, updateMarkPrices]);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEndsAt) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000));
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  // Auto-trade FSM logic
  useEffect(() => {
    if (!currentSignal) return;
    if (!state.settings.enabled) return;
    if (!isIdle) return; // Only trigger from IDLE state

    // Check if signal meets auto-execute criteria
    if (shouldAutoExecute(currentSignal)) {
      // Transition: IDLE → SIGNAL_LOCKED
      lockSignal(currentSignal);
      
      // After short delay, start countdown
      setTimeout(() => {
        if (canTransitionTo("COUNTDOWN")) {
          startCountdown(3);
        }
      }, 500);
    }
  }, [currentSignal, state.settings.enabled, isIdle, shouldAutoExecute, lockSignal, canTransitionTo, startCountdown]);

  // Handle asset selection
  const handleAssetSelect = useCallback((symbol: string) => {
    setSelectedAsset(symbol);
  }, []);

  // Handle auto-trade toggle
  const handleAutoTradeToggle = useCallback((enabled: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateSettings({ enabled });
  }, [updateSettings]);

  // Handle bot countdown complete - execute trade via FSM
  const handleBotCountdownComplete = useCallback(async () => {
    if (!lockedSignal?.signal) return;
    
    // Calculate position size (10% of available balance for auto-trade)
    const marginAmount = state.wallet.available * 0.1;
    
    // Execute via context (FSM transition: COUNTDOWN → EXECUTING → COOLDOWN)
    const success = await executeSignal(lockedSignal.signal, marginAmount);
    
    if (success) {
      // Generate new signal after execution
      generateNewSignal();
    }
  }, [lockedSignal, state.wallet.available, executeSignal, generateNewSignal]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    generateNewSignal();
    setIsRefreshing(false);
  }, [generateNewSignal]);

  // Handle opening trade modal
  const handleOpenTradeModal = useCallback(() => {
    if (!currentSignal) return;
    if (!isIdle && !isCooldown) return; // Can only open modal when IDLE or COOLDOWN
    setShowTradeModal(true);
  }, [currentSignal, isIdle, isCooldown]);

  // Handle manual trade execution with position size
  const handleExecuteTrade = useCallback(async (sizeUsdt: number) => {
    if (!currentSignal) return;
    
    const success = await executeSignal(currentSignal, sizeUsdt);
    
    if (success) {
      setShowTradeModal(false);
      generateNewSignal();
    }
  }, [currentSignal, executeSignal, generateNewSignal]);

  // Handle closing a position
  const handleClosePosition = useCallback(async (positionId: string) => {
    await closePosition(positionId);
  }, [closePosition]);

  // Get current price for selected asset
  const currentPriceData = getPrice(selectedAsset);

  // Bot activation state derived from FSM
  const isBotActivated = botStatus === "COUNTDOWN" || botStatus === "EXECUTING";
  const botAction = lockedSignal?.signal?.direction === "LONG" ? "BUY" : "SELL";

  // Format positions for LivePositionCard
  const formattedPositions = useMemo(() => {
    return openPositions.map((pos) => ({
      id: typeof pos.id === "string" ? parseInt(pos.id.split("_")[1] || "0", 10) : 0,
      asset: pos.asset,
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      leverage: pos.leverage,
      margin: pos.margin,
      size: pos.size,
      takeProfitPrice: pos.liquidationPrice * 1.1, // Approximate
      stopLossPrice: pos.liquidationPrice,
      mode: pos.mode,
      timestampOpen: pos.openedAt,
    }));
  }, [openPositions]);

  return (
    <ScreenContainer>
      {/* Bot Activation Banner - FSM controlled */}
      <BotActivationBanner
        isActive={isBotActivated}
        action={botAction}
        asset={selectedAsset}
        direction={lockedSignal?.signal?.direction || "LONG"}
        countdownSeconds={lockedSignal?.countdownSeconds || 3}
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
                Quantitative Signal Engine
              </Text>
            </View>
            {/* FSM Status Badge */}
            <View style={[
              styles.connectionBadge, 
              { backgroundColor: isIdle ? colors.success + "20" : colors.warning + "20" }
            ]}>
              <View style={[
                styles.connectionDot, 
                { backgroundColor: isIdle ? colors.success : colors.warning }
              ]} />
              <Text style={[
                styles.connectionText, 
                { color: isIdle ? colors.success : colors.warning }
              ]}>
                {botStatus}
              </Text>
            </View>
          </View>
          
          {/* Cooldown Indicator */}
          {isCooldown && cooldownRemaining > 0 && (
            <View style={[styles.cooldownBanner, { backgroundColor: colors.warning + "20" }]}>
              <Text style={[styles.cooldownText, { color: colors.warning }]}>
                ⏳ Cooldown: {cooldownRemaining}s remaining
              </Text>
            </View>
          )}
          
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
                { color: currentPriceData.change24h >= 0 ? colors.success : colors.error }
              ]}>
                {currentPriceData.change24h >= 0 ? "+" : ""}{currentPriceData.change24h.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>

        {/* Mode & Auto-Trade Controls */}
        <View style={styles.controlsRow}>
          <ModeIndicator
            mode={state.mode}
            isConnected={state.isConnected}
          />
          <AutoTradeToggle
            enabled={state.settings.enabled}
            onToggle={handleAutoTradeToggle}
            mode={state.mode}
            isConnected={state.isConnected}
          />
        </View>

        {/* Asset Selector */}
        <AssetSelector
          assets={MOCK_ASSETS}
          selectedAsset={selectedAsset}
          onSelect={handleAssetSelect}
        />

        {/* Wallet Balance Card */}
        <WalletBalanceCard
          totalBalance={equity}
          availableBalance={state.wallet.available}
          lockedBalance={state.wallet.locked}
          isLive={state.mode === "LIVE"}
          isLoading={false}
        />

        {/* Live Positions */}
        {formattedPositions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Live Positions ({formattedPositions.length})
            </Text>
            {formattedPositions.map((position) => (
              <LivePositionCard
                key={position.id}
                position={position}
                onClose={() => handleClosePosition(`pos_${position.id}_0`)}
              />
            ))}
          </View>
        )}

        {/* Trading Signal Card */}
        {currentSignal && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Signal
            </Text>
            <TradingSignalCard
              signal={currentSignal}
              mode={state.mode}
              autoTradeEnabled={state.settings.enabled}
              onExecute={handleOpenTradeModal}
              isExecuting={botStatus === "EXECUTING"}
            />
          </View>
        )}

        {/* Quantitative Info */}
        {currentSignal?.regime && (
          <View style={[styles.quantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.quantTitle, { color: colors.foreground }]}>
              Quantitative Analysis
            </Text>
            <View style={styles.quantRow}>
              <Text style={[styles.quantLabel, { color: colors.muted }]}>Regime:</Text>
              <Text style={[styles.quantValue, { color: colors.primary }]}>
                {currentSignal.regime}
              </Text>
            </View>
            {currentSignal.hurstExponent !== undefined && (
              <View style={styles.quantRow}>
                <Text style={[styles.quantLabel, { color: colors.muted }]}>Hurst Exponent:</Text>
                <Text style={[styles.quantValue, { color: colors.foreground }]}>
                  {currentSignal.hurstExponent.toFixed(3)}
                </Text>
              </View>
            )}
            {currentSignal.timeframe && (
              <View style={styles.quantRow}>
                <Text style={[styles.quantLabel, { color: colors.muted }]}>Timeframe:</Text>
                <Text style={[styles.quantValue, { color: colors.foreground }]}>
                  {currentSignal.timeframe}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Performance Summary */}
        <View style={[styles.performanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.performanceTitle, { color: colors.foreground }]}>
            Session Performance
          </Text>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceLabel, { color: colors.muted }]}>Realized P&L</Text>
              <Text style={[
                styles.performanceValue, 
                { color: realizedPnl >= 0 ? colors.success : colors.error }
              ]}>
                {realizedPnl >= 0 ? "+" : ""}${realizedPnl.toFixed(2)}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceLabel, { color: colors.muted }]}>Unrealized P&L</Text>
              <Text style={[
                styles.performanceValue, 
                { color: unrealizedPnl >= 0 ? colors.success : colors.error }
              ]}>
                {unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceLabel, { color: colors.muted }]}>Equity</Text>
              <Text style={[styles.performanceValue, { color: colors.foreground }]}>
                ${equity.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Trade Execution Modal */}
      {currentSignal && (
        <TradeExecutionModal
          visible={showTradeModal}
          signal={currentSignal}
          availableBalance={state.wallet.available}
          onClose={() => setShowTradeModal(false)}
          onConfirm={handleExecuteTrade}
          isLive={state.mode === "LIVE"}
          isExecuting={botStatus === "EXECUTING"}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cooldownBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  cooldownText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  priceDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceLabel: {
    fontSize: 13,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  priceChange: {
    fontSize: 14,
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  quantCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quantTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  quantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  quantLabel: {
    fontSize: 14,
  },
  quantValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  performanceCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  performanceItem: {
    alignItems: "center",
  },
  performanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
