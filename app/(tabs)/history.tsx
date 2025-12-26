import { ScrollView, Text, View, Pressable, StyleSheet, FlatList } from "react-native";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { mockSignalHistory } from "@/lib/mock-signal";
import { formatSignalForClipboard, type SignalSetup } from "@/lib/signal-engine";

interface SignalHistoryItemProps {
  signal: SignalSetup;
  onCopy: () => void;
}

function SignalHistoryItem({ signal, onCopy }: SignalHistoryItemProps) {
  const colors = useColors();
  const isLong = signal.direction === "LONG";
  const directionColor = isLong ? colors.success : colors.error;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: isLong ? colors.success + '20' : colors.error + '20' }}
          >
            <Text style={{ color: directionColor }} className="font-bold text-sm">
              {signal.direction}
            </Text>
          </View>
          <Text className="text-foreground font-semibold">{signal.asset}</Text>
        </View>
        
        <Text className="text-muted text-xs">
          {signal.timestamp.toLocaleString()}
        </Text>
      </View>

      {/* Trade Setup */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">LEV</Text>
          <Text className="text-foreground font-bold">{signal.leverageRecommendation}x</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1">ENTRY</Text>
          <Text className="text-foreground font-bold">{formatPrice(signal.entryPrice)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-success text-xs mb-1">TP</Text>
          <Text className="text-success font-bold">{formatPrice(signal.takeProfitPrice)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-error text-xs mb-1">SL</Text>
          <Text className="text-error font-bold">{formatPrice(signal.stopLossPrice)}</Text>
        </View>
      </View>

      {/* Rationale */}
      <Text className="text-muted text-sm mb-3">{signal.rationale}</Text>

      {/* Actions */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <View 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.warning }}
          />
          <Text className="text-muted text-xs">
            {signal.confidenceScore}% confidence
          </Text>
        </View>
        
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.copyButton,
            { backgroundColor: colors.primary + '20' },
            pressed && styles.copyButtonPressed,
          ]}
        >
          <IconSymbol name="doc.on.doc.fill" size={14} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="text-xs font-semibold ml-1">
            Copy
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (signal: SignalSetup) => {
    const text = formatSignalForClipboard(signal);
    await Clipboard.setStringAsync(text);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setCopiedId(signal.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate more history items
  const historyData = [
    ...mockSignalHistory,
    // Add some older signals
    {
      ...mockSignalHistory[0],
      id: 'old1',
      timestamp: new Date(Date.now() - 3600000),
      confidenceScore: 72,
    },
    {
      ...mockSignalHistory[1],
      id: 'old2',
      timestamp: new Date(Date.now() - 7200000),
      confidenceScore: 65,
    },
  ];

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">History</Text>
          <Text className="text-sm text-muted mt-1">Past Signal Setups</Text>
        </View>

        {/* Stats Summary */}
        <View className="px-4 py-3">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
              <Text className="text-muted text-xs">Total Signals</Text>
              <Text className="text-foreground text-xl font-bold">{historyData.length}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
              <Text className="text-muted text-xs">Avg Confidence</Text>
              <Text className="text-foreground text-xl font-bold">
                {Math.round(historyData.reduce((acc, s) => acc + s.confidenceScore, 0) / historyData.length)}%
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
              <Text className="text-muted text-xs">Long/Short</Text>
              <Text className="text-foreground text-xl font-bold">
                {historyData.filter(s => s.direction === 'LONG').length}/{historyData.filter(s => s.direction === 'SHORT').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Signal List */}
        <FlatList
          data={historyData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <SignalHistoryItem
              signal={item}
              onCopy={() => handleCopy(item)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <IconSymbol name="clock.fill" size={48} color={colors.muted} />
              <Text className="text-muted text-base mt-4">No signals yet</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
});
