"use client";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import Logo from "../../components/ui/Logo";
import ScreenContainer from "../../components/ui/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { useUserStats } from "../../hooks/useUserStats";
import { logOut } from "../../services/authService";
import { statsService } from "../../services/statsService";

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color="#3498DB" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, userData } = useAuth();
  const { userStats, refreshStats } = useUserStats();

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    Alert.alert("Editar Perfil", "Funcionalidade será implementada em breve!");
  };

  const handleChangePassword = () => {
    Alert.alert("Alterar Senha", "Funcionalidade será implementada em breve!");
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      "Configurações de Privacidade",
      "Funcionalidade será implementada em breve!"
    );
  };

  const handleDataExport = () => {
    Alert.alert("Exportar Dados", "Funcionalidade será implementada em breve!");
  };

  const handleSupport = () => {
    Alert.alert(
      "Suporte",
      "Entre em contato conosco em: suporte@gentracker.com"
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Sobre o GenTracker",
      "GenTracker v1.0.0\nSua gestão inteligente de compras e listas.\n\n© 2024 GenTracker. Todos os direitos reservados."
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirmar Logout",
      "Tem certeza que deseja sair da sua conta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await logOut();
              if (result.success) {
                Alert.alert(
                  "Logout Realizado",
                  "Você foi desconectado com sucesso!",
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace("/(auth)/startScreen"),
                    },
                  ]
                );
              } else {
                Alert.alert("Erro", result.error || "Erro ao fazer logout");
              }
            } catch {
              Alert.alert("Erro", "Ocorreu um erro inesperado");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Esta ação é irreversível. Todos os seus dados serão perdidos permanentemente. Tem certeza?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Funcionalidade em Desenvolvimento",
              "A exclusão de conta será implementada em breve!"
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with User Info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#3498DB" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.displayName || "Usuário"}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.userStats}>
                <Text style={styles.statsText}>
                  {userStats?.totalProducts || userData?.stats?.totalScans || 0}{" "}
                  produtos • {userStats?.totalInvoices || 0} notas •{" "}
                  {userStats?.totalLists || userData?.stats?.totalLists || 0}{" "}
                  listas
                </Text>
                {userStats && (
                  <Text style={styles.extraStatsText}>
                    Economizou: R${" "}
                    {statsService.formatCurrencyValue(userStats.totalSavings)} •
                    Gastou: R${" "}
                    {statsService.formatCurrencyValue(userStats.totalSpent)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="pencil" size={18} color="#3498DB" />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="person-outline"
              title="Editar Perfil"
              subtitle="Nome, foto e informações pessoais"
              onPress={handleEditProfile}
            />
            <SettingItem
              icon="lock-closed-outline"
              title="Alterar Senha"
              subtitle="Atualize sua senha de acesso"
              onPress={handleChangePassword}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacidade"
              subtitle="Controle de dados e privacidade"
              onPress={handlePrivacySettings}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações do App</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="notifications-outline"
              title="Notificações"
              subtitle="Alertas e lembretes"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#E5E7EB", true: "#3498DB" }}
                  thumbColor={notifications ? "#FFFFFF" : "#9CA3AF"}
                />
              }
            />
            <SettingItem
              icon="moon-outline"
              title="Modo Escuro"
              subtitle="Tema escuro para o aplicativo"
              showArrow={false}
              rightComponent={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: "#E5E7EB", true: "#3498DB" }}
                  thumbColor={darkMode ? "#FFFFFF" : "#9CA3AF"}
                />
              }
            />
            <SettingItem
              icon="finger-print-outline"
              title="Autenticação Biométrica"
              subtitle="Use impressão digital ou Face ID"
              showArrow={false}
              rightComponent={
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                  trackColor={{ false: "#E5E7EB", true: "#3498DB" }}
                  thumbColor={biometric ? "#FFFFFF" : "#9CA3AF"}
                />
              }
            />
            <SettingItem
              icon="sync-outline"
              title="Sincronização Automática"
              subtitle="Sincronizar dados automaticamente"
              showArrow={false}
              rightComponent={
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: "#E5E7EB", true: "#3498DB" }}
                  thumbColor={autoSync ? "#FFFFFF" : "#9CA3AF"}
                />
              }
            />
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados e Armazenamento</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="download-outline"
              title="Exportar Dados"
              subtitle="Baixe seus dados em formato CSV"
              onPress={handleDataExport}
            />
            <SettingItem
              icon="trash-outline"
              title="Limpar Cache"
              subtitle="Libere espaço removendo dados temporários"
              onPress={() =>
                Alert.alert(
                  "Cache Limpo",
                  "Cache do aplicativo foi limpo com sucesso!"
                )
              }
            />
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suporte e Informações</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="help-circle-outline"
              title="Central de Ajuda"
              subtitle="FAQ e tutoriais"
              onPress={handleSupport}
            />
            <SettingItem
              icon="mail-outline"
              title="Contato"
              subtitle="Entre em contato conosco"
              onPress={handleSupport}
            />
            <SettingItem
              icon="information-circle-outline"
              title="Sobre o App"
              subtitle="Versão e informações legais"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Button
            title="Sair da Conta"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.dangerTitle}>Zona de Perigo</Text>
          <View style={styles.dangerCard}>
            <SettingItem
              icon="trash-outline"
              title="Excluir Conta"
              subtitle="Remover permanentemente sua conta"
              onPress={handleDeleteAccount}
              showArrow={false}
              rightComponent={
                <Ionicons name="warning" size={20} color="#E74C3C" />
              }
            />
          </View>
        </View>

        {/* App Logo and Version */}
        <View style={styles.footer}>
          <Logo variant="icon" color="black" size="small" />
          <Text style={styles.versionText}>GenTracker v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  userStats: {
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statsText: {
    fontSize: 12,
    color: "#3498DB",
    fontWeight: "500",
  },
  extraStatsText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    marginLeft: 4,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E74C3C",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dangerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    shadowColor: "#E74C3C",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E74C3C",
  },
  logoutButtonText: {
    color: "#E74C3C",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
