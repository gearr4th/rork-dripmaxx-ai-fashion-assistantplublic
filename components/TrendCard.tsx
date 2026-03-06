import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { TrendingUp } from "lucide-react-native";

interface TrendCardProps {
  trend: string;
}

export default function TrendCard({ trend }: TrendCardProps) {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7}>
      <TrendingUp color="#60A5FA" size={14} />
      <Text style={styles.text}>{trend}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  text: {
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
