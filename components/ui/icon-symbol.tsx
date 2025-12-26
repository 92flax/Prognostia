// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for AQTE trading app.
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "chart.line.uptrend.xyaxis": "show-chart",
  "brain.head.profile": "psychology",
  "shield.checkered": "security",
  "briefcase.fill": "work",
  "gearshape.fill": "settings",
  // Navigation icons
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.up": "keyboard-arrow-up",
  "chevron.down": "keyboard-arrow-down",
  // Action icons
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "arrow.up.circle.fill": "arrow-upward",
  "arrow.down.circle.fill": "arrow-downward",
  "arrow.triangle.2.circlepath": "sync",
  // Status icons
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",
  // Trading icons
  "chart.bar.fill": "bar-chart",
  "chart.pie.fill": "pie-chart",
  "dollarsign.circle.fill": "attach-money",
  "bitcoinsign.circle.fill": "currency-bitcoin",
  "percent": "percent",
  // Misc icons
  "bell.fill": "notifications",
  "person.fill": "person",
  "link": "link",
  "doc.text.fill": "description",
  "clock.fill": "schedule",
  "star.fill": "star",
  // Trading mode icons
  "play.circle.fill": "play-circle-filled",
  "pause.circle.fill": "pause-circle-filled",
  "bolt.fill": "flash-on",
  "bolt.slash.fill": "flash-off",
  "target": "gps-fixed",
  "scope": "my-location",
  // Risk icons
  "gauge.high": "speed",
  "gauge.low": "slow-motion-video",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "flame.fill": "local-fire-department",
  "snowflake": "ac-unit",
  // Exchange icons
  "building.columns.fill": "account-balance",
  "creditcard.fill": "credit-card",
  "key.fill": "vpn-key",
  // AI icons
  "sparkles": "auto-awesome",
  "lightbulb.fill": "lightbulb",
  "wand.and.stars": "auto-fix-high",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
