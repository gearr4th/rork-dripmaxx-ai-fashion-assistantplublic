import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Heart, Star, Calendar, CheckCircle, Circle } from "lucide-react-native";
import { OutfitHistory } from "@/types";
import { router } from "expo-router";

interface OutfitHistoryCardProps {
  history: OutfitHistory;
  selectable?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export default function OutfitHistoryCard({ history, selectable = false, selected = false, onPress, onLongPress, testID }: OutfitHistoryCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.container, selected ? styles.containerSelected : undefined]}
      onPress={onPress ?? (() => router.push("/outfit-details" as any))}
      onLongPress={onLongPress}
      delayLongPress={250}
      testID={testID}
      accessibilityRole="button"
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.dateContainer}>
          <Calendar color="#475569" size={14} />
          <Text style={styles.date}>{formatDate(history.date)}</Text>
        </View>
        {selectable && (
          <View style={styles.selectIcon}>
            {selected ? (
              <CheckCircle color="#F97316" size={22} fill="#F97316" />
            ) : (
              <Circle color="#334155" size={22} />
            )}
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.imagesContainer}>
          {history.outfit.items.slice(0, 3).map((item, index) => (
            <Image
              key={item.id}
              source={{ uri: item.imageUrl }}
              style={[styles.itemImage, { marginLeft: index > 0 ? -18 : 0 }]}
            />
          ))}
        </View>
        
        <View style={styles.details}>
          <Text style={styles.occasion}>{history.outfit.occasion}</Text>
          <Text style={styles.weather}>{history.outfit.weather}</Text>
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < history.rating ? "#FBBF24" : "#1E293B"}
                fill={i < history.rating ? "#FBBF24" : "transparent"}
              />
            ))}
          </View>
        </View>
        
        {history.favorite && (
          <Heart color="#EF4444" size={18} fill="#EF4444" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 58, 95, 0.35)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.12)",
  },
  containerSelected: {
    borderColor: "#F97316",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectIcon: {
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500" as const,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagesContainer: {
    flexDirection: "row",
    marginRight: 14,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#0F1729",
  },
  details: {
    flex: 1,
  },
  occasion: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#E2E8F0",
    marginBottom: 3,
  },
  weather: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
  },
  rating: {
    flexDirection: "row",
    gap: 2,
  },
});
