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
    >
      <View style={styles.headerRow}>
        <View style={styles.dateContainer}>
          <Calendar color="#666" size={16} />
          <Text style={styles.date}>{formatDate(history.date)}</Text>
        </View>
        {selectable && (
          <View style={styles.selectIcon}>
            {selected ? (
              <CheckCircle color="#FFD700" size={22} fill="#FFD700" />
            ) : (
              <Circle color="#666" size={22} />
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
              style={[styles.itemImage, { marginLeft: index > 0 ? -20 : 0 }]}
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
                color={i < history.rating ? "#FFD700" : "#333"}
                fill={i < history.rating ? "#FFD700" : "transparent"}
              />
            ))}
          </View>
        </View>
        
        {history.favorite && (
          <Heart color="#FF4444" size={20} fill="#FF4444" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  containerSelected: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.08)",
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
    color: "#888",
    fontSize: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  imagesContainer: {
    flexDirection: "row",
    marginRight: 16,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#0A0A0A",
  },
  details: {
    flex: 1,
  },
  occasion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  weather: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  rating: {
    flexDirection: "row",
    gap: 2,
  },
});