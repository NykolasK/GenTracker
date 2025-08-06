"use client";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "../../components/ui/EmptyState";
import Logo from "../../components/ui/Logo";
import QuickActionCard from "../../components/ui/QuickActionCard";
import ScreenContainer from "../../components/ui/ScreenContainer";
import StatsCard from "../../components/ui/StatsCard";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { user, userData } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const statsData = [
    {
      number: userData?.stats?.totalScans || 0,
      label: "Produtos Escaneados",
    },
    {
      number: userData?.stats?.totalLists || 0,
      label: "Listas Criadas",
    },
    {
      number: `R$ ${userData?.stats?.totalSavings || "0,00"}`,
      label: "Economizado",
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: "Escanear QR",
      subtitle: "Escaneie produtos",
      icon: "qr-code",
      color: "#3498DB",
      onPress: () => {
        // Navigate to QR scanner
      },
    },
    {
      id: 2,
      title: "Nova Lista",
      subtitle: "Criar lista de compras",
      icon: "add-circle",
      color: "#27AE60",
      onPress: () => {
        // Navigate to create list
      },
    },
    {
      id: 3,
      title: "Histórico",
      subtitle: "Ver compras anteriores",
      icon: "time",
      color: "#F39C12",
      onPress: () => {
        // Navigate to history
      },
    },
    {
      id: 4,
      title: "Economias",
      subtitle: "Ver total economizado",
      icon: "trending-down",
      color: "#E74C3C",
      onPress: () => {
        // Navigate to savings
      },
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Logo and Greeting Section */}
        <View style={styles.topSection}>
          <Logo
            variant="logo"
            color="black"
            size="medium"
            style={styles.logo}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.displayName?.split(" ")[0] || "Usuário"}!
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatsCard stats={statsData} />
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.id}
                title={action.title}
                subtitle={action.subtitle}
                icon={action.icon}
                color={action.color}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atividade Recente</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Ver tudo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            <EmptyState
              icon="document-text"
              title="Nenhuma atividade ainda"
              subtitle="Comece escaneando produtos ou criando listas de compras"
              size={48}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 40,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
  },
  logo: {
    marginBottom: 0,
  },
  greetingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  greeting: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "400",
  },
  userName: {
    fontSize: 24,
    color: "#1F2937",
    fontWeight: "bold",
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeAllText: {
    fontSize: 14,
    color: "#3498DB",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
});
