import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface EmptyStateProps {
  icon: string
  title: string
  subtitle: string
  size?: number
}

export default function EmptyState({ icon, title, subtitle, size = 64 }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={size} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
})
