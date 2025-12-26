import { ScrollView, Text, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

interface AssetSelectorProps {
  assets: Asset[];
  selectedAsset: string;
  onSelect: (symbol: string) => void;
}

export function AssetSelector({ assets, selectedAsset, onSelect }: AssetSelectorProps) {
  const colors = useColors();

  const handleSelect = (symbol: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(symbol);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {assets.map((asset) => {
        const isSelected = asset.symbol === selectedAsset;
        const isPositive = asset.change24h >= 0;

        return (
          <Pressable
            key={asset.symbol}
            onPress={() => handleSelect(asset.symbol)}
            style={({ pressed }) => [
              styles.assetCard,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.symbol,
                { color: isSelected ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {asset.name}
            </Text>
            <Text
              style={[
                styles.price,
                { color: isSelected ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {formatPrice(asset.price)}
            </Text>
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.2)"
                    : isPositive
                    ? colors.success + "20"
                    : colors.error + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  {
                    color: isSelected
                      ? "#FFFFFF"
                      : isPositive
                      ? colors.success
                      : colors.error,
                  },
                ]}
              >
                {isPositive ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  assetCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  symbol: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
