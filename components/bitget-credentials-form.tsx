import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface BitgetCredentialsFormProps {
  apiKey: string;
  secret: string;
  passphrase: string;
  onApiKeyChange: (value: string) => void;
  onSecretChange: (value: string) => void;
  onPassphraseChange: (value: string) => void;
  onTestConnection: () => void;
  onSave: () => void;
  isConnected: boolean;
  isTesting: boolean;
  connectionError?: string;
}

export function BitgetCredentialsForm({
  apiKey,
  secret,
  passphrase,
  onApiKeyChange,
  onSecretChange,
  onPassphraseChange,
  onTestConnection,
  onSave,
  isConnected,
  isTesting,
  connectionError,
}: BitgetCredentialsFormProps) {
  const colors = useColors();
  const [showSecret, setShowSecret] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleTestConnection = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onTestConnection();
  };

  const handleSave = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave();
  };

  const hasCredentials = apiKey.length > 0 && secret.length > 0 && passphrase.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
          <IconSymbol name="key.fill" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Bitget API Credentials
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Required for live trading
          </Text>
        </View>
      </View>

      {/* Connection Status */}
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: isConnected
              ? colors.success + "15"
              : connectionError
              ? colors.error + "15"
              : colors.muted + "15",
          },
        ]}
      >
        <IconSymbol
          name={isConnected ? "checkmark.circle.fill" : connectionError ? "xmark.circle.fill" : "info.circle.fill"}
          size={18}
          color={isConnected ? colors.success : connectionError ? colors.error : colors.muted}
        />
        <Text
          style={[
            styles.statusText,
            {
              color: isConnected ? colors.success : connectionError ? colors.error : colors.muted,
            },
          ]}
        >
          {isConnected
            ? "Connected to Bitget"
            : connectionError
            ? connectionError
            : "Not connected - Paper trading mode"}
        </Text>
      </View>

      {/* API Key Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.muted }]}>API Key</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={apiKey}
            onChangeText={onApiKeyChange}
            placeholder="Enter your Bitget API key"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Secret Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.muted }]}>API Secret</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={secret}
            onChangeText={onSecretChange}
            placeholder="Enter your API secret"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showSecret}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={() => setShowSecret(!showSecret)}
            style={styles.eyeButton}
          >
            <IconSymbol
              name={showSecret ? "lock.open.fill" : "lock.fill"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        </View>
      </View>

      {/* Passphrase Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.muted }]}>Passphrase</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={passphrase}
            onChangeText={onPassphraseChange}
            placeholder="Enter your API passphrase"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassphrase}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={() => setShowPassphrase(!showPassphrase)}
            style={styles.eyeButton}
          >
            <IconSymbol
              name={showPassphrase ? "lock.open.fill" : "lock.fill"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleTestConnection}
          disabled={!hasCredentials || isTesting}
          style={({ pressed }) => [
            styles.testButton,
            {
              backgroundColor: colors.muted + "20",
              opacity: !hasCredentials || isTesting ? 0.5 : 1,
            },
            pressed && styles.buttonPressed,
          ]}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <>
              <IconSymbol name="bolt.fill" size={18} color={colors.foreground} />
              <Text style={[styles.testButtonText, { color: colors.foreground }]}>
                Test Connection
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={!hasCredentials}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: !hasCredentials ? 0.5 : 1,
            },
            pressed && styles.buttonPressed,
          ]}
        >
          <IconSymbol name="checkmark.circle.fill" size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      {/* Help Text */}
      <View style={[styles.helpContainer, { backgroundColor: colors.warning + "10" }]}>
        <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
        <Text style={[styles.helpText, { color: colors.warning }]}>
          Create API keys at bitget.com → API Management. Enable Futures trading permissions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  testButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
