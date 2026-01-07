import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { SignalSetup } from "./signal-engine";
import { MOCK_PAPER_WALLET } from "./mock-trading-data";

// ============================================
// TYPES - Single Source of Truth
// ============================================

/** Bot Status FSM States */
export type BotStatus =
  | "IDLE"
  | "ANALYZING"
  | "SIGNAL_LOCKED"
  | "COUNTDOWN"
  | "EXECUTING"
  | "COOLDOWN";

/** Trading timeframes for signal analysis */
export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d";

/** Trading mode */
export type TradingMode = "PAPER" | "LIVE";

/** Position direction */
export type PositionDirection = "LONG" | "SHORT";

/** Position status */
export type PositionStatus = "OPEN" | "CLOSED" | "LIQUIDATED";

/** Wallet state - all financial data */
export interface WalletState {
  balance: number;
  available: number;
  locked: number;
  equity: number;
  totalPnl: number;
  unrealizedPnl: number;
  initialBalance: number;
}

/** Live position with real-time P&L */
export interface LivePosition {
  id: string;
  asset: string;
  direction: PositionDirection;
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  liquidationPrice: number;
  openedAt: Date;
  status: PositionStatus;
  mode: TradingMode;
}

/** Closed trade history */
export interface TradeHistory {
  id: string;
  asset: string;
  direction: PositionDirection;
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  margin: number;
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
  closedAt: Date;
  status: PositionStatus;
  mode: TradingMode;
  durationSeconds: number;
}

/** Auto-trade settings */
export interface AutoTradeSettings {
  enabled: boolean;
  confidenceThreshold: number;
  maxLeverage: number;
  riskRewardRatio: number;
  safetyFactor: number;
}

/** Bitget API credentials */
export interface BitgetCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

/** Locked signal waiting for execution */
export interface LockedSignal {
  signal: SignalSetup;
  lockedAt: Date;
  countdownSeconds: number;
}

// ============================================
// TRADE STATE - Complete State Interface
// ============================================

export interface TradeState {
  // Mode & Connection
  mode: TradingMode;
  isConnected: boolean;
  credentials: BitgetCredentials;

  // Wallet (Single Source of Truth for all balances)
  wallet: WalletState;

  // Positions & History
  positions: LivePosition[];
  history: TradeHistory[];

  // Bot FSM State
  botStatus: BotStatus;
  lockedSignal: LockedSignal | null;
  cooldownEndsAt: Date | null;

  // Settings
  settings: AutoTradeSettings;
  activeTimeframe: Timeframe;

  // Mark prices for real-time P&L
  markPrices: Record<string, number>;
}

// ============================================
// ACTIONS - All possible state transitions
// ============================================

type TradeAction =
  | { type: "SET_MODE"; payload: TradingMode }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_CREDENTIALS"; payload: BitgetCredentials }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AutoTradeSettings> }
  | { type: "SET_TIMEFRAME"; payload: Timeframe }
  | { type: "RESET_WALLET" }
  // FSM Actions
  | { type: "SET_BOT_STATUS"; payload: BotStatus }
  | { type: "LOCK_SIGNAL"; payload: SignalSetup }
  | { type: "START_COUNTDOWN"; payload: number }
  | { type: "START_COOLDOWN"; payload: number }
  | { type: "CLEAR_COOLDOWN" }
  // Trade Actions (Atomic)
  | { type: "EXECUTE_TRADE"; payload: { signal: SignalSetup; margin: number; size: number; liquidationPrice: number } }
  | { type: "CLOSE_POSITION"; payload: { positionId: string; exitPrice: number } }
  // High-frequency price updates
  | { type: "UPDATE_MARK_PRICES"; payload: Record<string, number> };

// ============================================
// INITIAL STATE
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

const INITIAL_WALLET: WalletState = {
  balance: MOCK_PAPER_WALLET.balance,
  available: MOCK_PAPER_WALLET.balance,
  locked: 0,
  equity: MOCK_PAPER_WALLET.balance,
  totalPnl: 0,
  unrealizedPnl: 0,
  initialBalance: MOCK_PAPER_WALLET.initialBalance,
};

const INITIAL_STATE: TradeState = {
  mode: "PAPER",
  isConnected: false,
  credentials: DEFAULT_CREDENTIALS,
  wallet: INITIAL_WALLET,
  positions: [],
  history: [],
  botStatus: "IDLE",
  lockedSignal: null,
  cooldownEndsAt: null,
  settings: DEFAULT_SETTINGS,
  activeTimeframe: "15m",
  markPrices: {},
};

// ============================================
// REDUCER - Pure function, deterministic
// ============================================

function tradeReducer(state: TradeState, action: TradeAction): TradeState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.payload };

    case "SET_CONNECTED":
      return {
        ...state,
        isConnected: action.payload,
        mode: action.payload ? "LIVE" : "PAPER",
      };

    case "SET_CREDENTIALS":
      return {
        ...state,
        credentials: action.payload,
        isConnected: false,
        mode: "PAPER",
      };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "SET_TIMEFRAME":
      return { ...state, activeTimeframe: action.payload };

    case "RESET_WALLET":
      return {
        ...state,
        wallet: INITIAL_WALLET,
        positions: [],
        history: [],
        botStatus: "IDLE",
        lockedSignal: null,
        cooldownEndsAt: null,
      };

    // FSM State Transitions
    case "SET_BOT_STATUS":
      return { ...state, botStatus: action.payload };

    case "LOCK_SIGNAL":
      return {
        ...state,
        botStatus: "SIGNAL_LOCKED",
        lockedSignal: {
          signal: action.payload,
          lockedAt: new Date(),
          countdownSeconds: 3,
        },
      };

    case "START_COUNTDOWN":
      return {
        ...state,
        botStatus: "COUNTDOWN",
        lockedSignal: state.lockedSignal
          ? { ...state.lockedSignal, countdownSeconds: action.payload }
          : null,
      };

    case "START_COOLDOWN":
      return {
        ...state,
        botStatus: "COOLDOWN",
        lockedSignal: null,
        cooldownEndsAt: new Date(Date.now() + action.payload * 1000),
      };

    case "CLEAR_COOLDOWN":
      return {
        ...state,
        botStatus: "IDLE",
        cooldownEndsAt: null,
      };

    // ATOMIC: Execute Trade - creates position AND deducts margin in one update
    case "EXECUTE_TRADE": {
      const { signal, margin, size, liquidationPrice } = action.payload;
      const now = new Date();

      // Create new position
      const newPosition: LivePosition = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        asset: signal.asset,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        currentPrice: signal.entryPrice,
        size,
        leverage: signal.leverageRecommendation,
        margin,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        liquidationPrice,
        openedAt: now,
        status: "OPEN",
        mode: state.mode,
      };

      // ATOMIC: Update wallet and add position in single state update
      return {
        ...state,
        wallet: {
          ...state.wallet,
          available: state.wallet.available - margin,
          locked: state.wallet.locked + margin,
        },
        positions: [newPosition, ...state.positions],
        botStatus: "EXECUTING",
        lockedSignal: null,
      };
    }

    // ATOMIC: Close Position - calculates P&L, updates wallet, moves to history
    case "CLOSE_POSITION": {
      const { positionId, exitPrice } = action.payload;
      const position = state.positions.find((p) => p.id === positionId);

      if (!position || position.status !== "OPEN") {
        return state;
      }

      // Calculate P&L
      const priceDiff =
        position.direction === "LONG"
          ? exitPrice - position.entryPrice
          : position.entryPrice - exitPrice;
      const pnl = priceDiff * position.size;
      const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;
      const now = new Date();
      const durationSeconds = Math.floor(
        (now.getTime() - position.openedAt.getTime()) / 1000
      );

      // Create history entry
      const historyEntry: TradeHistory = {
        id: position.id,
        asset: position.asset,
        direction: position.direction,
        entryPrice: position.entryPrice,
        exitPrice,
        size: position.size,
        leverage: position.leverage,
        margin: position.margin,
        pnl,
        pnlPercent,
        openedAt: position.openedAt,
        closedAt: now,
        status: "CLOSED",
        mode: position.mode,
        durationSeconds,
      };

      // ATOMIC: Update wallet, remove position, add to history
      return {
        ...state,
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance + pnl,
          available: state.wallet.available + position.margin + pnl,
          locked: state.wallet.locked - position.margin,
          equity: state.wallet.equity + pnl,
          totalPnl: state.wallet.totalPnl + pnl,
        },
        positions: state.positions.filter((p) => p.id !== positionId),
        history: [historyEntry, ...state.history],
      };
    }

    // HIGH-FREQUENCY: Update mark prices and recalculate unrealized P&L
    case "UPDATE_MARK_PRICES": {
      const newMarkPrices = { ...state.markPrices, ...action.payload };

      // Recalculate unrealized P&L for all positions
      let totalUnrealizedPnl = 0;
      const updatedPositions = state.positions.map((pos) => {
        const currentPrice = newMarkPrices[pos.asset] ?? pos.currentPrice;
        const priceDiff =
          pos.direction === "LONG"
            ? currentPrice - pos.entryPrice
            : pos.entryPrice - currentPrice;
        const unrealizedPnl = priceDiff * pos.size;
        const unrealizedPnlPercent =
          (priceDiff / pos.entryPrice) * 100 * pos.leverage;

        totalUnrealizedPnl += unrealizedPnl;

        return {
          ...pos,
          currentPrice,
          unrealizedPnl,
          unrealizedPnlPercent,
        };
      });

      return {
        ...state,
        markPrices: newMarkPrices,
        positions: updatedPositions,
        wallet: {
          ...state.wallet,
          unrealizedPnl: totalUnrealizedPnl,
          equity: state.wallet.balance + totalUnrealizedPnl,
        },
      };
    }

    default:
      return state;
  }
}

// ============================================
// CONTEXT TYPE
// ============================================

export interface AutoTradeContextType {
  // State (read-only)
  state: TradeState;

  // Mode & Connection
  setMode: (mode: TradingMode) => void;
  setCredentials: (creds: BitgetCredentials) => void;
  testConnection: () => Promise<boolean>;

  // Settings
  updateSettings: (settings: Partial<AutoTradeSettings>) => void;
  setTimeframe: (tf: Timeframe) => void;

  // Wallet
  resetWallet: () => void;

  // FSM Control
  lockSignal: (signal: SignalSetup) => void;
  startCountdown: (seconds: number) => void;
  startCooldown: (seconds: number) => void;
  clearCooldown: () => void;
  setBotStatus: (status: BotStatus) => void;

  // Trade Execution
  executeSignal: (signal: SignalSetup, marginAmount: number) => Promise<boolean>;
  closePosition: (positionId: string) => Promise<boolean>;

  // Mark Prices
  updateMarkPrices: (prices: Record<string, number>) => void;

  // Computed
  shouldAutoExecute: (signal: SignalSetup) => boolean;
  canTransitionTo: (status: BotStatus) => boolean;

  // Selectors (memoized)
  openPositions: LivePosition[];
  totalUnrealizedPnl: number;
  winRate: number;
}

// ============================================
// CONTEXT & PROVIDER
// ============================================

const AutoTradeContext = createContext<AutoTradeContextType | undefined>(undefined);

/** Cooldown duration in seconds */
const COOLDOWN_DURATION = 10;

export function AutoTradeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tradeReducer, INITIAL_STATE);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  // Auto-clear cooldown when time expires
  useEffect(() => {
    if (state.botStatus === "COOLDOWN" && state.cooldownEndsAt) {
      const remaining = state.cooldownEndsAt.getTime() - Date.now();
      if (remaining > 0) {
        cooldownTimerRef.current = setTimeout(() => {
          dispatch({ type: "CLEAR_COOLDOWN" });
        }, remaining);
      } else {
        dispatch({ type: "CLEAR_COOLDOWN" });
      }
    }
  }, [state.botStatus, state.cooldownEndsAt]);

  // ============================================
  // ACTIONS
  // ============================================

  const setMode = useCallback((mode: TradingMode) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const setCredentials = useCallback((creds: BitgetCredentials) => {
    dispatch({ type: "SET_CREDENTIALS", payload: creds });
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const hasCredentials =
      state.credentials.apiKey.length >= 10 &&
      state.credentials.secret.length >= 10 &&
      state.credentials.passphrase.length >= 4;
    dispatch({ type: "SET_CONNECTED", payload: hasCredentials });
    return hasCredentials;
  }, [state.credentials]);

  const updateSettings = useCallback((settings: Partial<AutoTradeSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  }, []);

  const setTimeframe = useCallback((tf: Timeframe) => {
    dispatch({ type: "SET_TIMEFRAME", payload: tf });
  }, []);

  const resetWallet = useCallback(() => {
    dispatch({ type: "RESET_WALLET" });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // FSM Control
  const setBotStatus = useCallback((status: BotStatus) => {
    dispatch({ type: "SET_BOT_STATUS", payload: status });
  }, []);

  const lockSignal = useCallback((signal: SignalSetup) => {
    dispatch({ type: "LOCK_SIGNAL", payload: signal });
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    dispatch({ type: "START_COUNTDOWN", payload: seconds });
  }, []);

  const startCooldown = useCallback((seconds: number = COOLDOWN_DURATION) => {
    dispatch({ type: "START_COOLDOWN", payload: seconds });
  }, []);

  const clearCooldown = useCallback(() => {
    dispatch({ type: "CLEAR_COOLDOWN" });
  }, []);

  // Trade Execution
  const executeSignal = useCallback(
    async (signal: SignalSetup, marginAmount: number): Promise<boolean> => {
      // Calculate position parameters
      const size = (marginAmount * signal.leverageRecommendation) / signal.entryPrice;
      const liquidationPrice =
        signal.direction === "LONG"
          ? signal.entryPrice * (1 - 1 / signal.leverageRecommendation)
          : signal.entryPrice * (1 + 1 / signal.leverageRecommendation);

      // Check available balance
      if (marginAmount > state.wallet.available) {
        Alert.alert("Insufficient Balance", "Not enough available margin.");
        return false;
      }

      // ATOMIC dispatch
      dispatch({
        type: "EXECUTE_TRADE",
        payload: { signal, margin: marginAmount, size, liquidationPrice },
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Start cooldown after execution
      startCooldown(COOLDOWN_DURATION);

      return true;
    },
    [state.wallet.available, startCooldown]
  );

  const closePosition = useCallback(
    async (positionId: string): Promise<boolean> => {
      const position = state.positions.find((p) => p.id === positionId);
      if (!position || position.status !== "OPEN") return false;

      // Use current mark price or simulate
      const exitPrice =
        state.markPrices[position.asset] ??
        position.entryPrice * (1 + (Math.random() - 0.5) * 0.06);

      dispatch({
        type: "CLOSE_POSITION",
        payload: { positionId, exitPrice },
      });

      const priceDiff =
        position.direction === "LONG"
          ? exitPrice - position.entryPrice
          : position.entryPrice - exitPrice;
      const isWin = priceDiff > 0;

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          isWin
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }

      return true;
    },
    [state.positions, state.markPrices]
  );

  const updateMarkPrices = useCallback((prices: Record<string, number>) => {
    dispatch({ type: "UPDATE_MARK_PRICES", payload: prices });
  }, []);

  // ============================================
  // COMPUTED / SELECTORS
  // ============================================

  /** Check if signal should auto-execute */
  const shouldAutoExecute = useCallback(
    (signal: SignalSetup): boolean => {
      if (!state.settings.enabled) return false;
      if (state.botStatus !== "IDLE") return false; // FSM guard
      if (signal.confidenceScore < state.settings.confidenceThreshold) return false;
      if (signal.leverageRecommendation > state.settings.maxLeverage) return false;

      // Check for existing position
      const hasOpenPosition = state.positions.some(
        (p) => p.asset === signal.asset && p.status === "OPEN"
      );
      if (hasOpenPosition) return false;

      return true;
    },
    [state.settings, state.botStatus, state.positions]
  );

  /** FSM transition guard */
  const canTransitionTo = useCallback(
    (targetStatus: BotStatus): boolean => {
      const validTransitions: Record<BotStatus, BotStatus[]> = {
        IDLE: ["ANALYZING", "SIGNAL_LOCKED"],
        ANALYZING: ["IDLE", "SIGNAL_LOCKED"],
        SIGNAL_LOCKED: ["COUNTDOWN", "IDLE"],
        COUNTDOWN: ["EXECUTING", "IDLE"],
        EXECUTING: ["COOLDOWN"],
        COOLDOWN: ["IDLE"],
      };
      return validTransitions[state.botStatus]?.includes(targetStatus) ?? false;
    },
    [state.botStatus]
  );

  // Memoized selectors
  const openPositions = useMemo(
    () => state.positions.filter((p) => p.status === "OPEN"),
    [state.positions]
  );

  const totalUnrealizedPnl = useMemo(
    () => state.wallet.unrealizedPnl,
    [state.wallet.unrealizedPnl]
  );

  const winRate = useMemo(() => {
    const closedTrades = state.history.filter((t) => t.status === "CLOSED");
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter((t) => t.pnl > 0).length;
    return (wins / closedTrades.length) * 100;
  }, [state.history]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AutoTradeContextType = {
    state,
    setMode,
    setCredentials,
    testConnection,
    updateSettings,
    setTimeframe,
    resetWallet,
    setBotStatus,
    lockSignal,
    startCountdown,
    startCooldown,
    clearCooldown,
    executeSignal,
    closePosition,
    updateMarkPrices,
    shouldAutoExecute,
    canTransitionTo,
    openPositions,
    totalUnrealizedPnl,
    winRate,
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

// ============================================
// SELECTORS - For optimized re-renders
// ============================================

/** Hook to get live P&L with price context subscription */
export function useLivePnL() {
  const { state, totalUnrealizedPnl } = useAutoTrade();

  return useMemo(
    () => ({
      unrealizedPnl: totalUnrealizedPnl,
      realizedPnl: state.wallet.totalPnl,
      totalPnl: state.wallet.totalPnl + totalUnrealizedPnl,
      equity: state.wallet.equity,
    }),
    [totalUnrealizedPnl, state.wallet.totalPnl, state.wallet.equity]
  );
}

/** Hook to get bot FSM status */
export function useBotStatus() {
  const { state, canTransitionTo } = useAutoTrade();

  return useMemo(
    () => ({
      status: state.botStatus,
      lockedSignal: state.lockedSignal,
      cooldownEndsAt: state.cooldownEndsAt,
      isIdle: state.botStatus === "IDLE",
      isExecuting: state.botStatus === "EXECUTING",
      isCooldown: state.botStatus === "COOLDOWN",
      canTransitionTo,
    }),
    [state.botStatus, state.lockedSignal, state.cooldownEndsAt, canTransitionTo]
  );
}
