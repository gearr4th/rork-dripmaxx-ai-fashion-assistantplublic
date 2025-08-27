import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TrendingUp } from "lucide-react-native";

interface TrendCardProps {
  trend: string;
}

export default function TrendCard({ trend }: TrendCardProps) {
  return (
    <TouchableOpacity style={styles.container}>
      <TrendingUp color="#FFD700" size={16} />
      <Text style={styles.text}>{trend}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  text: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
});