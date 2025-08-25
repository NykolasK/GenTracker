import { StyleSheet, Text, View } from "react-native";

interface StatItemProps {
  number: string | number;
  label: string;
}

interface StatsCardProps {
  stats: StatItemProps[];
}

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <View style={styles.statsCard}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stat.number}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
          {index < stats.length - 1 && <View style={styles.statDivider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3498DB",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginLeft: 10,
  },
});
