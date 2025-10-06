import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Trash2, X, CheckSquare } from "lucide-react-native";
import OutfitHistoryCard from "@/components/OutfitHistoryCard";
import { OutfitHistory } from "@/types";

export default function HistoryScreen() {
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [history, setHistory] = useState<OutfitHistory[]>([
    {
      id: "1",
      date: new Date("2024-01-15"),
      outfit: {
        id: "1",
        items: [
          { id: "1", name: "Black Blazer", type: "top", color: "#000000", imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400" },
          { id: "2", name: "White Shirt", type: "top", color: "#FFFFFF", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
          { id: "3", name: "Dark Jeans", type: "bottom", color: "#1A1A2E", imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400" },
        ],
        occasion: "Office Meeting",
        weather: "Partly Cloudy, 18°C",
        style: "Business Casual",
      },
      rating: 5,
      favorite: true,
    },
    {
      id: "2",
      date: new Date("2024-01-14"),
      outfit: {
        id: "2",
        items: [
          { id: "4", name: "Hoodie", type: "top", color: "#808080", imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400" },
          { id: "5", name: "Joggers", type: "bottom", color: "#404040", imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400" },
        ],
        occasion: "Weekend Chill",
        weather: "Sunny, 22°C",
        style: "Casual",
      },
      rating: 4,
      favorite: false,
    },
  ]);

  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredHistory = useMemo(() => (
    filter === "favorites" ? history.filter(h => h.favorite) : history
  ), [filter, history]);

  const enterSelectionFor = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) {
      Alert.alert("Nothing selected", "Tap items to select them for deletion.");
      return;
    }
    Alert.alert(
      "Delete outfits",
      `Delete ${selectedIds.size} selected outfit(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
          setHistory(prev => prev.filter(h => !selectedIds.has(h.id)));
          exitSelection();
        }},
      ]
    );
  }, [selectedIds, exitSelection]);

  const handleDeleteAll = useCallback(() => {
    if (filteredHistory.length === 0) return;
    Alert.alert(
      "Delete all",
      `This will delete all ${filteredHistory.length} outfit(s) in this view. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: () => {
          const idsToDelete = new Set(filteredHistory.map(h => h.id));
          setHistory(prev => prev.filter(h => !idsToDelete.has(h.id)));
          exitSelection();
        }}
      ]
    );
  }, [filteredHistory, exitSelection]);

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A1A", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Outfit History</Text>
          <View style={styles.actions}>
            {selectionMode ? (
              <>
                <TouchableOpacity accessibilityRole="button" testID="exit-selection" onPress={exitSelection} style={styles.iconPill}>
                  <X color="#0A0A0A" size={20} />
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" testID="delete-selected" onPress={handleDeleteSelected} style={[styles.iconPill, { backgroundColor: "#FF5A5F" }]}>
                  <Trash2 color="#0A0A0A" size={20} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
            onPress={() => setFilter("all")}
            testID="filter-all"
          >
            <Text style={[styles.filterButtonText, filter === "all" && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === "favorites" && styles.filterButtonActive]}
            onPress={() => setFilter("favorites")}
            testID="filter-favorites"
          >
            <Text style={[styles.filterButtonText, filter === "favorites" && styles.filterButtonTextActive]}>Favorites</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectionMode && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>{selectedIds.size} selected</Text>
              <TouchableOpacity testID="delete-all" style={[styles.selectionButton, { backgroundColor: "#FF5A5F" }]} onPress={handleDeleteAll}>
                <Trash2 color="#0A0A0A" size={18} />
                <Text style={styles.selectionButtonText}>Delete All</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color="#666" size={48} />
              <Text style={styles.emptyStateText}>No outfits yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your outfit history will appear here
              </Text>
            </View>
          ) : (
            filteredHistory.map((item) => {
              const selected = selectedIds.has(item.id);
              return (
                <OutfitHistoryCard
                  key={item.id}
                  history={item}
                  selectable={selectionMode}
                  selected={selected}
                  onLongPress={() => enterSelectionFor(item.id)}
                  onPress={() => selectionMode ? toggleSelect(item.id) : undefined}
                  testID={`history-item-${item.id}`}
                />
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E0E0E0",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FF5C00",
  },
  filterButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#0A0A0A",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  selectionText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5C00',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectionButtonText: {
    color: '#0A0A0A',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#E0E0E0",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
});