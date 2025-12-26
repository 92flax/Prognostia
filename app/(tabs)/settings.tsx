import { ScrollView, Text, View, Switch, Pressable, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { BitgetCredentialsForm } from "@/components/bitget-credentials-form";
import { SettingsRow } from "@/components/settings-row";
import { SliderSetting } from "@/components/slider-setting";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

/**
 * Settings Screen - Configuration for trading bot
 * 
 * Features:
 * - Bitget API credentials input
 * - Connection test
 * - Risk parameters
 * - Auto-trade settings
 */
export default function SettingsScreen() {
  const colors = useColors();
  
  // API Credentials state
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | undefined>();

  // Signal generation settings
  const [safetyFactor, setSafetyFactor] = useState(2.0);
  const [riskRewardRatio, setRiskRewardRatio] = useState(2.0);
  const [maxLeverage, setMaxLeverage] = useState(20);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);

  // App settings state
  const [notifications, setNotifications] = useState(true);

  // Handle connection test
  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionError(undefined);
    
    // Simulate API connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Validate credentials format
    if (apiKey.length < 10) {
      setConnectionError("Invalid API key format");
      setIsConnected(false);
    } else if (secret.length < 10) {
      setConnectionError("Invalid API secret format");
      setIsConnected(false);
    } else if (passphrase.length < 4) {
      setConnectionError("Invalid passphrase format");
      setIsConnected(false);
    } else {
      // Success
      setIsConnected(true);
      setConnectionError(undefined);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    
    setIsTesting(false);
  };

  // Handle save credentials
  const handleSaveCredentials = () => {
    // In production, save to secure storage
    Alert.alert(
      "Credentials Saved",
      "Your API credentials have been saved securely.",
      [{ text: "OK" }]
    );
  };

  // Handle reset paper wallet
  const handleResetPaperWallet = () => {
    Alert.alert(
      "Reset Paper Wallet",
      "Are you sure you want to reset your paper wallet to $10,000?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Success", "Paper wallet has been reset to $10,000");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Configure your trading bot
          </Text>
        </View>

        {/* Bitget Credentials */}
        <View style={styles.section}>
          <BitgetCredentialsForm
            apiKey={apiKey}
            secret={secret}
            passphrase={passphrase}
            onApiKeyChange={setApiKey}
            onSecretChange={setSecret}
            onPassphraseChange={setPassphrase}
            onTestConnection={handleTestConnection}
            onSave={handleSaveCredentials}
            isConnected={isConnected}
            isTesting={isTesting}
            connectionError={connectionError}
          />
        </View>

        {/* Auto-Trade Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Auto-Trade Settings
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SliderSetting
              title="Confidence Threshold"
              value={confidenceThreshold}
              min={50}
              max={95}
              step={5}
              formatValue={(v) => `${v}%`}
              onValueChange={setConfidenceThreshold}
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
              title="Risk-Reward Ratio"
              value={riskRewardRatio}
              min={1.5}
              max={4}
              step={0.5}
              formatValue={(v) => `1:${v}`}
              onValueChange={setRiskRewardRatio}
            />
            <SliderSetting
              title="Safety Factor"
              value={safetyFactor}
              min={1}
              max={4}
              step={0.5}
              formatValue={(v) => `${v}x`}
              onValueChange={setSafetyFactor}
              className="border-b-0"
            />
          </View>
          
          {/* Parameter Explanation */}
          <View className="mt-3 p-3 bg-primary/10 rounded-xl">
            <Text className="text-xs text-muted leading-relaxed">
              <Text className="font-semibold text-foreground">Confidence Threshold</Text>: Minimum signal confidence for auto-execution{'\n'}
              <Text className="font-semibold text-foreground">Safety Factor</Text>: Higher = lower leverage recommendation{'\n'}
              <Text className="font-semibold text-foreground">Risk-Reward</Text>: TP distance relative to SL
            </Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Notifications
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Signal Alerts"
              subtitle="Get notified for new high-confidence signals"
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
              className="border-b-0"
            />
          </View>
        </View>

        {/* Paper Trading */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Paper Trading
          </Text>
          
          <Pressable
            onPress={handleResetPaperWallet}
            style={({ pressed }) => [
              styles.resetButton,
              { backgroundColor: colors.error + "15", borderColor: colors.error + "30" },
              pressed && styles.buttonPressed,
            ]}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.error} />
            <Text style={[styles.resetButtonText, { color: colors.error }]}>
              Reset Paper Wallet to $10,000
            </Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            About
          </Text>
          <View className="bg-surface rounded-2xl px-4 border border-border">
            <SettingsRow
              title="Version"
              value="2.0.0 - Hybrid Mode"
            />
            <SettingsRow
              title="Mode"
              value={isConnected ? "Live Trading" : "Paper Trading"}
            />
            <SettingsRow
              title="Exchange"
              value="Bitget Futures"
              className="border-b-0"
            />
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.section}>
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            This app provides automated trading functionality. Live trading involves real funds and significant risk. 
            Paper trading mode is recommended for testing. Always trade responsibly.
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 4,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
