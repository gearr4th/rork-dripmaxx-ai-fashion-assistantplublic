import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Droplets, Wind, MapPin, RefreshCw, Settings } from "lucide-react-native";
import { Weather } from "@/types";

interface WeatherCardProps {
  weather: Weather | null;
  loading: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export default function WeatherCard({ weather, loading, error, onRefresh }: WeatherCardProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#FFD700" />
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || "Unable to fetch weather"}</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <RefreshCw color="#FFD700" size={16} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.location}>
          <MapPin color="#FFD700" size={16} />
          <Text style={styles.locationText}>{weather.location}</Text>
        </View>
        <Text style={styles.temperature}>{weather.temperature}°C</Text>
      </View>
      {error && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>{error}</Text>
          {error.includes('Location access denied') && (
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => {
                Alert.alert(
                  "Enable Location Access",
                  "To get weather for your current location, please enable location permissions in your device settings.",
                  [
                    { text: "OK", style: "default" },
                  ]
                );
              }}
            >
              <Settings color="#FFD700" size={14} />
              <Text style={styles.settingsText}>Enable Location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Text style={styles.condition}>{weather.condition}</Text>
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Droplets color="#666" size={16} />
          <Text style={styles.detailText}>{weather.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Wind color="#666" size={16} />
          <Text style={styles.detailText}>{weather.windSpeed} km/h</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    color: "#FF6B00",
    fontSize: 14,
    fontWeight: "600",
  },
  temperature: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F2F2F2",
  },
  condition: {
    fontSize: 18,
    color: "#F2F2F2",
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    gap: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: "#888",
    fontSize: 14,
  },
  errorText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  warningText: {
    color: "#FFB347",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 107, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.3)",
  },
  retryText: {
    color: "#FF6B00",
    fontSize: 14,
    fontWeight: "600",
  },
  warningContainer: {
    marginBottom: 8,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 107, 0, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.2)",
    alignSelf: "flex-start",
  },
  settingsText: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "500",
  },
});