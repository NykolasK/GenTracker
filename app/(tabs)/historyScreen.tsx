"use client";

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import InvoiceFiltersModal from "../../components/ui/InvoiceFiltersModal";
import ScreenContainer from "../../components/ui/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import {
  firebaseService,
  type FirebaseInvoice,
  type InvoiceFilters,
} from "../../services/firebaseService";
import { logger } from "../../utils/logger";

interface InvoiceCardProps {
  invoice: FirebaseInvoice;
  onPress: () => void;
  onDelete: () => void;
}

function InvoiceCard({ invoice, onPress, onDelete }: InvoiceCardProps) {
  return (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{invoice.store_name}</Text>
          <Text style={styles.invoiceNumber}>
            NF-e: {invoice.invoice_number}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Text style={styles.amount}>
            {firebaseService.formatCurrency(invoice.total_amount)}
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* FIXED: Changed from && to ternary operator */}
      {invoice.discounts && invoice.discounts > 0 ? (
        <View style={styles.discountInfo}>
          <Ionicons name="pricetag" size={14} color="#27AE60" />
          <Text style={styles.discountText}>
            Desconto: {firebaseService.formatCurrency(invoice.discounts)}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardBody}>
        <View style={styles.itemsInfo}>
          <Ionicons name="basket-outline" size={16} color="#6B7280" />
          <Text style={styles.itemsText}>
            {invoice.items.length}{" "}
            {invoice.items.length === 1 ? "item" : "itens"}
          </Text>
        </View>

        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            Emitida: {firebaseService.formatDate(invoice.invoice_date)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.scannedInfo}>
          <Ionicons name="scan-outline" size={14} color="#3498DB" />
          <Text style={styles.scannedText}>
            Escaneada: {firebaseService.formatDateTime(invoice.scanned_at)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<FirebaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<InvoiceFilters>({
    sortBy: "scanned_at",
    sortOrder: "desc",
  });

  // Load invoices handler
  const loadInvoices = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      logger.info("📋 Loading invoices for user:", user.uid);
      const userInvoices = await firebaseService.getUserInvoices(
        user.uid,
        undefined,
        filters
      );
      setInvoices(userInvoices);
      logger.info("✅ Loaded", userInvoices.length, "invoices");
    } catch (error) {
      logger.error("Error fetching invoices:", error);
      Alert.alert("Erro", "Não foi possível carregar as compras.");
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user, filters, refreshKey, loadInvoices]);

  // Atualiza automaticamente quando a tela ganha foco (volta do QR scanner)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        logger.info("📱 History screen focused, refreshing data...");
        loadInvoices();
      }
    }, [user, loadInvoices])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleInvoicePress = (invoice: FirebaseInvoice) => {
    router.push({
      pathname: "/invoice-details",
      params: { invoiceId: invoice.id },
    });
  };

  const handleDeleteInvoice = async (invoice: FirebaseInvoice) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a nota fiscal de ${invoice.store_name}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await firebaseService.deleteInvoice(invoice.id!);
              await loadInvoices();
              Alert.alert("Sucesso", "Nota fiscal excluída com sucesso!");
            } catch (error) {
              logger.error("Error deleting invoice:", error);
              Alert.alert("Erro", "Não foi possível excluir a nota fiscal");
            }
          },
        },
      ]
    );
  };

  const handleApplyFilters = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      sortBy: "scanned_at",
      sortOrder: "desc",
    });
    setShowFilters(false);
  };

  const getTotalSpent = () => {
    return invoices.reduce((total, invoice) => total + invoice.total_amount, 0);
  };

  const getThisMonthSpent = () => {
    const now = new Date();
    const thisMonth = invoices.filter((invoice) => {
      const scannedDate = new Date(invoice.scanned_at);
      return (
        scannedDate.getMonth() === now.getMonth() &&
        scannedDate.getFullYear() === now.getFullYear()
      );
    });
    return thisMonth.reduce(
      (total, invoice) => total + invoice.total_amount,
      0
    );
  };

  const hasActiveFilters = () => {
    return (
      filters.dateFrom ||
      filters.dateTo ||
      filters.minAmount ||
      filters.maxAmount ||
      filters.minItems ||
      filters.maxItems ||
      filters.storeName
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (invoices.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <EmptyState
            icon="receipt-outline"
            title={
              hasActiveFilters()
                ? "Nenhuma nota encontrada"
                : "Nenhuma nota fiscal ainda"
            }
            subtitle={
              hasActiveFilters()
                ? "Tente ajustar os filtros de busca"
                : "Escaneie QR codes de notas fiscais para começar a acompanhar seus gastos"
            }
          />
          <View style={styles.buttonContainer}>
            {hasActiveFilters() ? (
              <Button
                title="Limpar Filtros"
                onPress={clearFilters}
                variant="secondary"
              />
            ) : (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push("/(tabs)/qrScreen")}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>
                  Escanear Primeira Nota
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScreenContainer>
    );
  }

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
        {/* Statistics Header */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {firebaseService.formatCurrency(getTotalSpent())}
            </Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {firebaseService.formatCurrency(getThisMonthSpent())}
            </Text>
            <Text style={styles.statLabel}>Este Mês</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{invoices.length}</Text>
            <Text style={styles.statLabel}>Notas Fiscais</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Histórico de Compras</Text>
          <View style={styles.headerActions}>
            {/* FIXED: Changed from && to ternary operator */}
            {hasActiveFilters() ? (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Ionicons name="close-circle" size={20} color="#E74C3C" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters() ? styles.filterButtonActive : null,
              ]}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons
                name="filter"
                size={20}
                color={hasActiveFilters() ? "#FFFFFF" : "#3498DB"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Display */}
        {/* FIXED: Changed from && to ternary operator */}
        {hasActiveFilters() ? (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>Filtros ativos:</Text>
            <View style={styles.activeFiltersList}>
              {filters.dateFrom ? (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    De: {firebaseService.formatDate(filters.dateFrom)}
                  </Text>
                </View>
              ) : null}
              {filters.dateTo ? (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Até: {firebaseService.formatDate(filters.dateTo)}
                  </Text>
                </View>
              ) : null}
              {filters.minAmount ? (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Min: {firebaseService.formatCurrency(filters.minAmount)}
                  </Text>
                </View>
              ) : null}
              {filters.maxAmount ? (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Max: {firebaseService.formatCurrency(filters.maxAmount)}
                  </Text>
                </View>
              ) : null}
              {filters.storeName ? (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    Loja: {filters.storeName}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Invoices List */}
        <View style={styles.invoicesList}>
          {invoices.map((invoice) => (
            <InvoiceCard
              key={`${invoice.id}-${refreshKey}`}
              invoice={invoice}
              onPress={() => handleInvoicePress(invoice)}
              onDelete={() => handleDeleteInvoice(invoice)}
            />
          ))}
        </View>

        {/* Load More Button */}
        {/* FIXED: Changed from && to ternary operator */}
        {invoices.length >= 50 ? (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={forceRefresh}
            >
              <Text style={styles.loadMoreText}>Carregar Mais</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Filters Modal */}
      <InvoiceFiltersModal
        visible={showFilters}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setShowFilters(false)}
        onClear={clearFilters}
      />
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
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498DB",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498DB",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#3498DB",
  },
  clearFiltersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  activeFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  activeFiltersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeFilter: {
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3498DB",
  },
  activeFilterText: {
    fontSize: 12,
    color: "#3498DB",
    fontWeight: "500",
  },
  invoicesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3498DB",
  },
  deleteButton: {
    padding: 4,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itemsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scannedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scannedText: {
    fontSize: 12,
    color: "#3498DB",
    fontWeight: "500",
  },
  discountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  discountText: {
    fontSize: 12,
    color: "#27AE60",
    fontWeight: "500",
  },
  loadMoreContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
});
