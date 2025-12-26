/**
 * Equity Curve Chart
 * 
 * Displays historical equity curve (solid line) and 
 * projected future path (dotted line) with confidence bands.
 */

import React, { useMemo } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { EquityPoint, ProjectionPoint } from "@/lib/analytics-engine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 16, bottom: 30, left: 50 };

export interface EquityCurveChartProps {
  equityCurve: EquityPoint[];
  projection: ProjectionPoint[];
  currentBalance: number;
  startingBalance: number;
}

export function EquityCurveChart({
  equityCurve,
  projection,
  currentBalance,
  startingBalance,
}: EquityCurveChartProps) {
  const colors = useColors();

  // Combine data for scaling
  const allBalances = useMemo(() => {
    const historicalBalances = equityCurve.map(p => p.balance);
    const projectedBalances = projection.flatMap(p => [p.projectedBalance, p.upperBound, p.lowerBound]);
    return [...historicalBalances, ...projectedBalances];
  }, [equityCurve, projection]);

  // Calculate chart dimensions
  const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Calculate scales
  const { minY, maxY, scaleY, scaleX } = useMemo(() => {
    const min = Math.min(...allBalances) * 0.95;
    const max = Math.max(...allBalances) * 1.05;
    const totalPoints = equityCurve.length + projection.length;
    
    return {
      minY: min,
      maxY: max,
      scaleY: (value: number) => chartHeight - ((value - min) / (max - min)) * chartHeight,
      scaleX: (index: number) => (index / (totalPoints - 1)) * chartWidth,
    };
  }, [allBalances, equityCurve.length, projection.length, chartHeight, chartWidth]);

  // Generate path for historical equity curve
  const historicalPath = useMemo(() => {
    if (equityCurve.length < 2) return "";
    
    return equityCurve.reduce((path, point, i) => {
      const x = scaleX(i);
      const y = scaleY(point.balance);
      return path + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, "");
  }, [equityCurve, scaleX, scaleY]);

  // Generate path for projected equity curve
  const projectedPath = useMemo(() => {
    if (projection.length < 2) return "";
    
    const startIndex = equityCurve.length - 1;
    const startX = scaleX(startIndex);
    const startY = scaleY(currentBalance);
    
    let path = `M ${startX} ${startY}`;
    
    projection.forEach((point, i) => {
      const x = scaleX(startIndex + i + 1);
      const y = scaleY(point.projectedBalance);
      path += ` L ${x} ${y}`;
    });
    
    return path;
  }, [projection, equityCurve.length, currentBalance, scaleX, scaleY]);

  // Generate confidence band path
  const confidenceBandPath = useMemo(() => {
    if (projection.length < 2) return "";
    
    const startIndex = equityCurve.length - 1;
    
    // Upper bound path
    let upperPath = "";
    projection.forEach((point, i) => {
      const x = scaleX(startIndex + i + 1);
      const y = scaleY(point.upperBound);
      upperPath += (i === 0 ? `M ${scaleX(startIndex)} ${scaleY(currentBalance)}` : "") + ` L ${x} ${y}`;
    });
    
    // Lower bound path (reversed)
    let lowerPath = "";
    [...projection].reverse().forEach((point, i) => {
      const x = scaleX(startIndex + projection.length - i);
      const y = scaleY(point.lowerBound);
      lowerPath += ` L ${x} ${y}`;
    });
    
    return upperPath + lowerPath + " Z";
  }, [projection, equityCurve.length, currentBalance, scaleX, scaleY]);

  // Y-axis labels
  const yAxisLabels = useMemo(() => {
    const labels = [];
    const step = (maxY - minY) / 4;
    for (let i = 0; i <= 4; i++) {
      const value = minY + step * i;
      labels.push({
        value,
        y: scaleY(value),
        label: `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      });
    }
    return labels;
  }, [minY, maxY, scaleY]);

  // Calculate P&L
  const totalPnl = currentBalance - startingBalance;
  const pnlPercent = ((totalPnl / startingBalance) * 100);
  const isProfit = totalPnl >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Equity Curve
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Historical + 30-Day Projection
          </Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: colors.muted }]}>
            Current Balance
          </Text>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>
            ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.pnlValue, { color: isProfit ? colors.success : colors.error }]}>
            {isProfit ? "+" : ""}{pnlPercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Y-axis grid lines */}
          {yAxisLabels.map((label, i) => (
            <Line
              key={i}
              x1={PADDING.left}
              y1={PADDING.top + label.y}
              x2={CHART_WIDTH - PADDING.right}
              y2={PADDING.top + label.y}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}

          {/* Confidence band */}
          {confidenceBandPath && (
            <Path
              d={confidenceBandPath}
              fill="url(#confidenceGradient)"
              transform={`translate(${PADDING.left}, ${PADDING.top})`}
            />
          )}

          {/* Historical equity curve */}
          {historicalPath && (
            <Path
              d={historicalPath}
              stroke={colors.success}
              strokeWidth={2.5}
              fill="none"
              transform={`translate(${PADDING.left}, ${PADDING.top})`}
            />
          )}

          {/* Projected equity curve (dotted) */}
          {projectedPath && (
            <Path
              d={projectedPath}
              stroke={colors.primary}
              strokeWidth={2}
              strokeDasharray="6,4"
              fill="none"
              transform={`translate(${PADDING.left}, ${PADDING.top})`}
            />
          )}

          {/* Current balance point */}
          <Circle
            cx={PADDING.left + scaleX(equityCurve.length - 1)}
            cy={PADDING.top + scaleY(currentBalance)}
            r={5}
            fill={colors.foreground}
            stroke={colors.background}
            strokeWidth={2}
          />

          {/* Starting balance line */}
          <Line
            x1={PADDING.left}
            y1={PADDING.top + scaleY(startingBalance)}
            x2={CHART_WIDTH - PADDING.right}
            y2={PADDING.top + scaleY(startingBalance)}
            stroke={colors.muted}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        </Svg>

        {/* Y-axis labels */}
        {yAxisLabels.map((label, i) => (
          <Text
            key={i}
            style={[
              styles.yAxisLabel,
              { color: colors.muted, top: PADDING.top + label.y - 8 },
            ]}
          >
            {label.label}
          </Text>
        ))}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Historical</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLineDashed, { borderColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Projected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBand, { backgroundColor: colors.primary + "30" }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>Confidence</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  pnlValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartContainer: {
    position: "relative",
  },
  yAxisLabel: {
    position: "absolute",
    left: 0,
    fontSize: 10,
    fontFamily: "monospace",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendLineDashed: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
  },
  legendBand: {
    width: 16,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
});
