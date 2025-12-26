/**
 * Real-Time Price Context
 * 
 * Provides real-time price updates with 1-2 second polling intervals.
 * All prices are formatted with exactly 2 decimal places.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

export interface AssetPrice {
  symbol: string;
  price: number;
  priceFormatted: string; // Always 2 decimal places
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: Date;
}

export interface PriceContextType {
  prices: Record<string, AssetPrice>;
  isLoading: boolean;
  lastUpdate: Date | null;
  error: string | null;
  getPrice: (symbol: string) => AssetPrice | null;
  formatPrice: (price: number) => string;
  refreshPrices: () => Promise<void>;
  isConnected: boolean;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

// Default assets to track
const DEFAULT_ASSETS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

// Polling interval in milliseconds (1.5 seconds)
const POLL_INTERVAL = 1500;

/**
 * Format price with exactly 2 decimal places
 */
function formatPriceValue(price: number): string {
  return price.toFixed(2);
}

/**
 * Generate realistic mock price data
 * In production, this would be replaced with actual API calls
 */
function generateMockPrices(previousPrices: Record<string, AssetPrice>): Record<string, AssetPrice> {
  const basePrices: Record<string, number> = {
    BTCUSDT: 98500,
    ETHUSDT: 3450,
    SOLUSDT: 188,
    BNBUSDT: 695,
    XRPUSDT: 2.35,
  };

  const prices: Record<string, AssetPrice> = {};
  const now = new Date();

  for (const symbol of DEFAULT_ASSETS) {
    const basePrice = basePrices[symbol] || 100;
    const previousPrice = previousPrices[symbol]?.price || basePrice;
    
    // Small random price movement (-0.3% to +0.3%)
    const changePercent = (Math.random() - 0.5) * 0.6;
    const newPrice = previousPrice * (1 + changePercent / 100);
    
    // Calculate 24h change (mock)
    const change24hPercent = (Math.random() - 0.5) * 8; // -4% to +4%
    const change24h = basePrice * (change24hPercent / 100);
    
    prices[symbol] = {
      symbol,
      price: newPrice,
      priceFormatted: formatPriceValue(newPrice),
      change24h,
      change24hPercent,
      high24h: basePrice * 1.03,
      low24h: basePrice * 0.97,
      volume24h: Math.random() * 1000000000,
      lastUpdated: now,
    };
  }

  return prices;
}

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pricesRef = useRef<Record<string, AssetPrice>>({});

  // Keep ref in sync with state
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  const fetchPrices = useCallback(async () => {
    try {
      // In production, this would be an actual API call to Bitget or another exchange
      // For now, we generate realistic mock data
      const newPrices = generateMockPrices(pricesRef.current);
      
      setPrices(newPrices);
      setLastUpdate(new Date());
      setIsConnected(true);
      setError(null);
      
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      setIsConnected(false);
    }
  }, [isLoading]);

  // Start polling on mount
  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up polling interval
    intervalRef.current = setInterval(fetchPrices, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrices]);

  const getPrice = useCallback((symbol: string): AssetPrice | null => {
    return prices[symbol] || null;
  }, [prices]);

  const formatPrice = useCallback((price: number): string => {
    return formatPriceValue(price);
  }, []);

  const refreshPrices = useCallback(async () => {
    await fetchPrices();
  }, [fetchPrices]);

  const value: PriceContextType = {
    prices,
    isLoading,
    lastUpdate,
    error,
    getPrice,
    formatPrice,
    refreshPrices,
    isConnected,
  };

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrices(): PriceContextType {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error("usePrices must be used within a PriceProvider");
  }
  return context;
}

/**
 * Hook to get a single asset's price with auto-updates
 */
export function useAssetPrice(symbol: string): AssetPrice | null {
  const { getPrice } = usePrices();
  return getPrice(symbol);
}

/**
 * Hook to format any price value consistently
 */
export function useFormatPrice(): (price: number) => string {
  const { formatPrice } = usePrices();
  return formatPrice;
}
