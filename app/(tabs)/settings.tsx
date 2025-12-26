import { ScrollView, Text, View, Alert } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { SettingsRow } from "@/components/settings-row";
import { SliderSetting } from "@/components/slider-setting";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const colors = useColors();

  // Signal generation settings
  const [safetyFactor, setSafetyFactor] = useState(2.0);
  const [riskRewardRatio, setRiskRewardRatio] = useState(2.0);
  const [maxLeverage, setMaxLeverage] = useState(20);
  const [atrMultiplier, setAtrMultiplier] = useState(3.0);

  // App settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Settings</Text>
          <Text className="text-sm text-muted mt-1">Configure Signal Generation</Text>
        </View>

        {/* Signal Parameters */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Signal Parameters
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SliderSetting
              title="Safety Factor"
              value={safetyFactor}
              min={1}
              max={4}
              step={0.5}
              formatValue={(v) => `${v}x`}
              onValueChange={setSafetyFactor}
            />
            <SliderSetting
              title="Risk-Reward Ratio"
              value={riskRewardRatio}
              min={1.5}
              max={4}
              step={0.5}
              formatValue={(v) => `1:${v}`}
              onValueChange={setRiskRewardRatio}
            />
            <SliderSetting
              title="Max Leverage"
              value={maxLeverage}
              min={5}
              max={50}
              step={5}
              formatValue={(v) => `${v}x`}
              onValueChange={setMaxLeverage}
            />
            <SliderSetting
              title="ATR Multiplier (SL)"
              value={atrMultiplier}
              min={2}
              max={5}
              step={0.5}
              formatValue={(v) => `${v}x`}
              onValueChange={setAtrMultiplier}
              className="border-b-0"
            />
          </View>
          
          {/* Parameter Explanation */}
          <View className="mt-3 p-3 bg-primary/10 rounded-xl">
            <Text className="text-xs text-muted leading-relaxed">
              <Text className="font-semibold text-foreground">Safety Factor</Text>: Higher = lower leverage recommendation{'\n'}
              <Text className="font-semibold text-foreground">Risk-Reward</Text>: TP distance relative to SL{'\n'}
              <Text className="font-semibold text-foreground">ATR Multiplier</Text>: Stop loss distance (higher = wider stops)
            </Text>
          </View>
        </View>

        {/* Signal Engine Info */}
        <View className="px-4 py-3">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Signal Engine
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Leverage Formula"
              value="1 / (Vol × Safety)"
              icon={
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <IconSymbol name="gauge.with.needle.fill" size={16} color={colors.primary} />
                </View>
              }
            />
            <SettingsRow
              title="Stop Loss"
              value="Chandelier Exit (ATR)"
              icon={
                <View className="w-8 h-8 rounded-full bg-error/20 items-center justify-center">
                  <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} />
                </View>
              }
            />
            <SettingsRow
              title="Take Profit"
              value="R:R Based"
              icon={
                <View className="w-8 h-8 rounded-full bg-success/20 items-center justify-center">
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                </View>
              }
            />
            <SettingsRow
              title="Direction Logic"
              value="Sentiment + EMA + RSI"
              icon={
                <View className="w-8 h-8 rounded-full bg-warning/20 items-center justify-center">
                  <IconSymbol name="brain.head.profile" size={16} color={colors.warning} />
                </View>
              }
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
              title="New Signal Alerts"
              subtitle="Get notified when new signals are generated"
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
            />
            <SettingsRow
              title="High Confidence Only"
              subtitle="Only notify for signals with >70% confidence"
              toggle
              toggleValue={true}
              onToggle={() => {}}
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
              value="2.0.0"
            />
            <SettingsRow
              title="Signal Intelligence Dashboard"
              subtitle="Decision support for manual trading"
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

        {/* Reset */}
        <View className="px-4 py-3">
          <View className="bg-surface rounded-2xl px-4 border border-warning/30">
            <SettingsRow
              title="Reset to Defaults"
              subtitle="Restore all signal parameters to default values"
              showChevron
              onPress={() => {
                Alert.alert(
                  "Reset Settings",
                  "Reset all signal parameters to their default values?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Reset", 
                      onPress: () => {
                        setSafetyFactor(2.0);
                        setRiskRewardRatio(2.0);
                        setMaxLeverage(20);
                        setAtrMultiplier(3.0);
                      } 
                    },
                  ]
                );
              }}
              className="border-b-0"
            />
          </View>
        </View>

        {/* Disclaimer */}
        <View className="px-4 py-3">
          <Text className="text-muted text-xs text-center leading-relaxed">
            This app provides trading signals for informational purposes only. 
            It does not execute trades or connect to exchanges. 
            Always trade responsibly.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
