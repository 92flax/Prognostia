import { ScrollView, Text, View, Alert } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { SettingsRow } from "@/components/settings-row";
import { ExchangeConnectionCard } from "@/components/exchange-connection-card";
import { SliderSetting } from "@/components/slider-setting";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { mockExchangeConnections, mockRiskSettings } from "@/lib/mock-data";

export default function SettingsScreen() {
  const colors = useColors();

  // Risk settings state
  const [maxLeverage, setMaxLeverage] = useState(mockRiskSettings.maxLeverage);
  const [targetVolatility, setTargetVolatility] = useState(mockRiskSettings.targetVolatility * 100);
  const [atrMultiplier, setAtrMultiplier] = useState(mockRiskSettings.atrMultiplier);

  // App settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometrics, setBiometrics] = useState(false);

  const exchanges = mockExchangeConnections;

  const handleExchangePress = (name: string) => {
    Alert.alert(
      "Exchange Configuration",
      `Configure ${name} API credentials`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Configure", onPress: () => {} },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="text-sm text-muted mt-1">Configure Your Trading Engine</Text>
        </View>

        {/* Exchange Connections */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Exchange Connections
          </Text>
          <View className="gap-3">
            {exchanges.map((exchange) => (
              <ExchangeConnectionCard
                key={exchange.id}
                connection={exchange}
                onPress={() => handleExchangePress(exchange.displayName)}
              />
            ))}
          </View>
        </View>

        {/* Risk Parameters */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Risk Parameters
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SliderSetting
              title="Max Leverage"
              value={maxLeverage}
              min={1}
              max={10}
              step={0.5}
              formatValue={(v) => `${v}x`}
              onValueChange={setMaxLeverage}
            />
            <SliderSetting
              title="Target Volatility"
              value={targetVolatility}
              min={5}
              max={50}
              step={5}
              formatValue={(v) => `${v}%`}
              onValueChange={setTargetVolatility}
            />
            <SliderSetting
              title="ATR Multiplier"
              value={atrMultiplier}
              min={1}
              max={5}
              step={0.5}
              formatValue={(v) => `${v}x`}
              onValueChange={setAtrMultiplier}
              className="border-b-0"
            />
          </View>
        </View>

        {/* AI Models */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            AI Models
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="TimesFM Model"
              value="google/timesfm-2.0"
              icon={
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={colors.primary} />
                </View>
              }
              showChevron
              onPress={() => {}}
            />
            <SettingsRow
              title="FinBERT Model"
              value="ProsusAI/finbert"
              icon={
                <View className="w-8 h-8 rounded-full bg-success/20 items-center justify-center">
                  <IconSymbol name="brain.head.profile" size={16} color={colors.success} />
                </View>
              }
              showChevron
              onPress={() => {}}
            />
            <SettingsRow
              title="Inference Backend"
              value="GPU (CUDA)"
              icon={
                <View className="w-8 h-8 rounded-full bg-warning/20 items-center justify-center">
                  <IconSymbol name="chevron.left.forwardslash.chevron.right" size={16} color={colors.warning} />
                </View>
              }
              showChevron
              onPress={() => {}}
              className="border-b-0"
            />
          </View>
        </View>

        {/* Notifications */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Notifications
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Push Notifications"
              subtitle="Get alerts for signals and trades"
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
            />
            <SettingsRow
              title="Price Alerts"
              subtitle="Notify when price targets are hit"
              toggle
              toggleValue={true}
              onToggle={() => {}}
            />
            <SettingsRow
              title="Trade Confirmations"
              subtitle="Confirm before executing trades"
              toggle
              toggleValue={true}
              onToggle={() => {}}
              className="border-b-0"
            />
          </View>
        </View>

        {/* Security */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Security
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Biometric Authentication"
              subtitle="Use Face ID or fingerprint"
              toggle
              toggleValue={biometrics}
              onToggle={setBiometrics}
            />
            <SettingsRow
              title="Change PIN"
              showChevron
              onPress={() => {}}
            />
            <SettingsRow
              title="Two-Factor Authentication"
              value="Enabled"
              showChevron
              onPress={() => {}}
              className="border-b-0"
            />
          </View>
        </View>

        {/* App Preferences */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Preferences
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Dark Mode"
              toggle
              toggleValue={darkMode}
              onToggle={setDarkMode}
            />
            <SettingsRow
              title="Currency"
              value="USD"
              showChevron
              onPress={() => {}}
            />
            <SettingsRow
              title="Language"
              value="English"
              showChevron
              onPress={() => {}}
              className="border-b-0"
            />
          </View>
        </View>

        {/* About */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            About
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Version"
              value="1.0.0"
            />
            <SettingsRow
              title="Terms of Service"
              showChevron
              onPress={() => {}}
            />
            <SettingsRow
              title="Privacy Policy"
              showChevron
              onPress={() => {}}
            />
            <SettingsRow
              title="Support"
              showChevron
              onPress={() => {}}
              className="border-b-0"
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl px-4 border border-error/30">
            <SettingsRow
              title="Reset All Settings"
              danger
              showChevron
              onPress={() => {
                Alert.alert(
                  "Reset Settings",
                  "Are you sure you want to reset all settings to defaults?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Reset", style: "destructive", onPress: () => {} },
                  ]
                );
              }}
            />
            <SettingsRow
              title="Delete Account"
              danger
              showChevron
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "This action cannot be undone. All your data will be permanently deleted.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => {} },
                  ]
                );
              }}
              className="border-b-0"
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
