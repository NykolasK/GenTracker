import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useUserStats } from "../../hooks/useUserStats";
import { statsService } from "../../services/statsService";

interface StatsOverviewProps {
  variant?: "compact" | "detailed";
  onPress?: () => void;
}

export default function StatsOverview({
  variant = "compact",
  onPress,
}: StatsOverviewProps) {
  const { userStats, loading } = useUserStats();

  if (loading || !userStats) {
    return (
      <View
        style={[
          styles.container,
          variant === "compact" ? styles.compact : styles.detailed,
        ]}
      >
        <Text style={styles.loadingText}>Carregando estatísticas...</Text>
      </View>
    );
  }

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        variant === "compact" ? styles.compact : styles.detailed,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {onPress && (
        <View style={styles.header}>
          <Text style={styles.title}>Suas Estatísticas</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.totalProducts}</Text>
          <Text style={styles.statLabel}>Produtos</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.totalInvoices}</Text>
          <Text style={styles.statLabel}>Notas Fiscais</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userStats.totalLists}</Text>
          <Text style={styles.statLabel}>Listas</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.savingsValue]}>
            R$ {statsService.formatCurrencyValue(userStats.totalSavings)}
          </Text>
          <Text style={styles.statLabel}>Economizado</Text>
        </View>
      </View>

      {variant === "detailed" && (
        <View style={styles.extraStats}>
          <View style={styles.extraStatRow}>
            <Text style={styles.extraStatLabel}>Gasto Total:</Text>
            <Text style={styles.extraStatValue}>
              R$ {statsService.formatCurrencyValue(userStats.totalSpent)}
            </Text>
          </View>

          <View style={styles.extraStatRow}>
            <Text style={styles.extraStatLabel}>Ticket Médio:</Text>
            <Text style={styles.extraStatValue}>
              R${" "}
              {statsService.formatCurrencyValue(userStats.averageInvoiceValue)}
            </Text>
          </View>

          <View style={styles.extraStatRow}>
            <Text style={styles.extraStatLabel}>Loja Favorita:</Text>
            <Text
              style={[styles.extraStatValue, styles.storeValue]}
              numberOfLines={1}
            >
              {userStats.mostShoppedStore}
            </Text>
          </View>

          <View style={styles.extraStatRow}>
            <Text style={styles.extraStatLabel}>Gasto Este Mês:</Text>
            <Text style={[styles.extraStatValue, styles.monthValue]}>
              R$ {statsService.formatCurrencyValue(userStats.currentMonthSpent)}
            </Text>
          </View>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  compact: {
    // Compact variant styles
  },
  detailed: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  savingsValue: {
    color: "#10B981",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  extraStats: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
    marginTop: 4,
  },
  extraStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  extraStatLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  extraStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "right",
    flex: 1,
  },
  storeValue: {
    color: "#3498DB",
  },
  monthValue: {
    color: "#F39C12",
  },
});
