import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { SignalSetup } from "./signal-engine";
import { MockTrade, MOCK_PAPER_WALLET } from "./mock-trading-data";

// ============================================
// TYPES
// ============================================

export type TradingMode = "PAPER" | "LIVE";

export interface AutoTradeSettings {
  enabled: boolean;
  confidenceThreshold: number; // 0-100
  maxLeverage: number;
  riskRewardRatio: number;
  safetyFactor: number;
}

export interface BitgetCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

export interface PaperWallet {
  balance: number;
  initialBalance: number;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  usedMargin: number;
}

export interface AutoTradeContextType {
  // Mode
  mode: TradingMode;
  setMode: (mode: TradingMode) => void;
  
  // Connection
  isConnected: boolean;
  credentials: BitgetCredentials;
  setCredentials: (creds: BitgetCredentials) => void;
  testConnection: () => Promise<boolean>;
  
  // Auto-trade settings
  settings: AutoTradeSettings;
  updateSettings: (settings: Partial<AutoTradeSettings>) => void;
  
  // Paper wallet
  paperWallet: PaperWallet;
  resetPaperWallet: () => void;
  
  // Trades
  trades: MockTrade[];
  executeSignal: (signal: SignalSetup) => Promise<boolean>;
  closePosition: (tradeId: string) => Promise<boolean>;
  
  // Auto-execution
  shouldAutoExecute: (signal: SignalSetup) => boolean;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_SETTINGS: AutoTradeSettings = {
  enabled: false,
  confidenceThreshold: 75,
  maxLeverage: 20,
  riskRewardRatio: 2.0,
  safetyFactor: 2.0,
};

const DEFAULT_CREDENTIALS: BitgetCredentials = {
  apiKey: "",
  secret: "",
  passphrase: "",
};

// ============================================
// CONTEXT
// ============================================

const AutoTradeContext = createContext<AutoTradeContextType | undefined>(undefined);

export function AutoTradeProvider({ children }: { children: ReactNode }) {
  // State
  const [mode, setMode] = useState<TradingMode>("PAPER");
  const [isConnected, setIsConnected] = useState(false);
  const [credentials, setCredentialsState] = useState<BitgetCredentials>(DEFAULT_CREDENTIALS);
  const [settings, setSettings] = useState<AutoTradeSettings>(DEFAULT_SETTINGS);
  const [paperWallet, setPaperWallet] = useState<PaperWallet>(MOCK_PAPER_WALLET);
  const [trades, setTrades] = useState<MockTrade[]>([]);

  // Set credentials
  const setCredentials = useCallback((creds: BitgetCredentials) => {
    setCredentialsState(creds);
    // If credentials are cleared, disconnect
    if (!creds.apiKey || !creds.secret || !creds.passphrase) {
      setIsConnected(false);
      setMode("PAPER");
    }
  }, []);

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    // Simulate API connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hasCredentials = 
      credentials.apiKey.length >= 10 &&
      credentials.secret.length >= 10 &&
      credentials.passphrase.length >= 4;
    
    setIsConnected(hasCredentials);
    
    if (hasCredentials) {
      setMode("LIVE");
    }
    
    return hasCredentials;
  }, [credentials]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AutoTradeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Reset paper wallet
  const resetPaperWallet = useCallback(() => {
    setPaperWallet({
      balance: 10000,
      initialBalance: 10000,
      totalPnl: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      usedMargin: 0,
    });
    setTrades([]);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // Execute signal
  const executeSignal = useCallback(async (signal: SignalSetup): Promise<boolean> => {
    // Calculate position size (1% risk)
    const riskPercent = 0.01;
    const balance = mode === "PAPER" ? paperWallet.balance : 10000; // Mock live balance
    const stopLossPercent = Math.abs(signal.entryPrice - signal.stopLossPrice) / signal.entryPrice;
    const riskAmount = balance * riskPercent;
    const positionSize = riskAmount / stopLossPercent / signal.entryPrice;
    const margin = (positionSize * signal.entryPrice) / signal.leverageRecommendation;

    // Check if we have enough balance
    if (margin > balance * 0.5) {
      Alert.alert("Insufficient Balance", "Not enough balance to open this position.");
      return false;
    }

    // Create trade
    const newTrade: MockTrade = {
      id: `trade_${Date.now()}`,
      asset: signal.asset,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      size: positionSize,
      leverage: signal.leverageRecommendation,
      status: "OPEN",
      mode: mode,
      openedAt: new Date(),
    };

    // Add trade
    setTrades(prev => [newTrade, ...prev]);

    // Update paper wallet
    if (mode === "PAPER") {
      setPaperWallet(prev => ({
        ...prev,
        usedMargin: prev.usedMargin + margin,
      }));
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return true;
  }, [mode, paperWallet.balance]);

  // Close position
  const closePosition = useCallback(async (tradeId: string): Promise<boolean> => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade || trade.status !== "OPEN") return false;

    // Simulate exit price (random ±3%)
    const priceChange = (Math.random() - 0.5) * 0.06;
    const exitPrice = trade.entryPrice * (1 + priceChange);
    
    // Calculate P&L
    const priceDiff = trade.direction === "LONG"
      ? exitPrice - trade.entryPrice
      : trade.entryPrice - exitPrice;
    const pnl = priceDiff * trade.size * trade.leverage;
    const pnlPercent = (priceDiff / trade.entryPrice) * 100 * trade.leverage;
    const isWin = pnl > 0;

    // Update trade
    setTrades(prev =>
      prev.map(t =>
        t.id === tradeId
          ? {
              ...t,
              status: "CLOSED" as const,
              exitPrice,
              pnl,
              pnlPercent,
              closedAt: new Date(),
            }
          : t
      )
    );

    // Update paper wallet
    if (mode === "PAPER") {
      const margin = (trade.size * trade.entryPrice) / trade.leverage;
      setPaperWallet(prev => ({
        ...prev,
        balance: prev.balance + pnl,
        totalPnl: prev.totalPnl + pnl,
        totalTrades: prev.totalTrades + 1,
        winningTrades: prev.winningTrades + (isWin ? 1 : 0),
        losingTrades: prev.losingTrades + (isWin ? 0 : 1),
        usedMargin: Math.max(0, prev.usedMargin - margin),
      }));
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        isWin
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    }

    return true;
  }, [trades, mode]);

  // Check if signal should auto-execute
  const shouldAutoExecute = useCallback((signal: SignalSetup): boolean => {
    if (!settings.enabled) return false;
    if (signal.confidenceScore < settings.confidenceThreshold) return false;
    if (signal.leverageRecommendation > settings.maxLeverage) return false;
    
    // Check if we already have an open position for this asset
    const hasOpenPosition = trades.some(
      t => t.asset === signal.asset && t.status === "OPEN"
    );
    if (hasOpenPosition) return false;
    
    return true;
  }, [settings, trades]);

  const value: AutoTradeContextType = {
    mode,
    setMode,
    isConnected,
    credentials,
    setCredentials,
    testConnection,
    settings,
    updateSettings,
    paperWallet,
    resetPaperWallet,
    trades,
    executeSignal,
    closePosition,
    shouldAutoExecute,
  };

  return (
    <AutoTradeContext.Provider value={value}>
      {children}
    </AutoTradeContext.Provider>
  );
}

export function useAutoTrade() {
  const context = useContext(AutoTradeContext);
  if (context === undefined) {
    throw new Error("useAutoTrade must be used within an AutoTradeProvider");
  }
  return context;
}
