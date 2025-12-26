/**
 * Performance Stats Card
 * 
 * Displays key trading performance metrics:
 * - Win Rate
 * - Profit Factor
 * - Average Win/Loss
 * - Max Drawdown
 * - Total Trades
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface PerformanceStats {
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  totalTrades: number;
}

export interface PerformanceStatsCardProps {
  stats: PerformanceStats;
}

export function PerformanceStatsCard({ stats }: PerformanceStatsCardProps) {
  const colors = useColors();

  // Calculate expectancy
  const expectancy = (stats.winRate / 100 * stats.avgWin) - ((100 - stats.winRate) / 100 * stats.avgLoss);

  const statItems = [
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      color: stats.winRate >= 50 ? colors.success : colors.error,
    },
    {
      label: "Profit Factor",
      value: stats.profitFactor.toFixed(2),
      color: stats.profitFactor >= 1 ? colors.success : colors.error,
    },
    {
      label: "Avg Win",
      value: `+${stats.avgWin.toFixed(2)}%`,
      color: colors.success,
    },
    {
      label: "Avg Loss",
      value: `-${stats.avgLoss.toFixed(2)}%`,
      color: colors.error,
    },
    {
      label: "Max Drawdown",
      value: `-${stats.maxDrawdown.toFixed(2)}%`,
      color: stats.maxDrawdown > 20 ? colors.error : colors.warning,
    },
    {
      label: "Total Trades",
      value: stats.totalTrades.toString(),
      color: colors.foreground,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Performance Stats
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Based on last {stats.totalTrades} trades
      </Text>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.statItem,
              { backgroundColor: colors.background },
              index % 2 === 0 && styles.statItemLeft,
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              {item.label}
            </Text>
            <Text style={[styles.statValue, { color: item.color }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Expectancy */}
      <View style={[styles.expectancyContainer, { backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.expectancyLabel, { color: colors.muted }]}>
            Expected Value per Trade
          </Text>
          <Text style={[styles.expectancySubtext, { color: colors.muted }]}>
            (Win% × AvgWin) - (Loss% × AvgLoss)
          </Text>
        </View>
        <Text
          style={[
            styles.expectancyValue,
            { color: expectancy >= 0 ? colors.success : colors.error },
          ]}
        >
          {expectancy >= 0 ? "+" : ""}{expectancy.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 12,
  },
  statItemLeft: {
    marginRight: 4,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  expectancyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
  },
  expectancyLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  expectancySubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  expectancyValue: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "monospace",
  },
});
