"use client";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../components/ui/ActionButton";
import Button from "../components/ui/Button";
import DiscountIndicator from "../components/ui/DiscountIndicator";
import ScreenContainer from "../components/ui/ScreenContainer";
import { DateService } from "../services/dateService";
import {
  firebaseService,
  type FirebaseInvoice,
} from "../services/firebaseService";
import { ResponsiveUtils } from "../utils/responsiveUtils";

interface ProductItemProps {
  item: any;
  index: number;
}

function ProductItem({ item, index }: ProductItemProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Alimentação: "#27AE60",
      Bebidas: "#3498DB",
      Limpeza: "#9B59B6",
      Higiene: "#E91E63",
      Decoração: "#FF9800",
      Eletrônicos: "#607D8B",
      Papelaria: "#795548",
      PetShop: "#4CAF50",
      Medicamentos: "#F44336",
      Domésticas: "#2196F3",
      Acessórios: "#E91E63",
      Lazer: "#FF5722",
      Automotivo: "#424242",
      Jardinagem: "#8BC34A",
      Outros: "#9E9E9E",
    };
    return colors[category] || colors["Outros"];
  };

  return (
    <View style={styles.productItem}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          {/* FIXED: Changed from && to ternary operator */}
          {item.code ? (
            <Text style={styles.productCode}>Código: {item.code}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.productCategory,
            {
              backgroundColor: `${getCategoryColor(
                item.category || "Outros"
              )}15`,
              borderColor: getCategoryColor(item.category || "Outros"),
            },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: getCategoryColor(item.category || "Outros") },
            ]}
          >
            {item.category || "Outros"}
          </Text>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.productDetailRow}>
          <Text style={styles.detailLabel}>Quantidade:</Text>
          <Text style={styles.detailValue}>
            {item.quantity} {item.unit}
          </Text>
        </View>

        <View style={styles.productDetailRow}>
          <Text style={styles.detailLabel}>Preço unitário:</Text>
          <Text style={styles.detailValue}>
            {firebaseService.formatCurrency(item.unit_price)}
          </Text>
        </View>

        <View style={styles.productDetailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {firebaseService.formatCurrency(item.total_price)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function InvoiceDetailsScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<FirebaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const invoiceData = await firebaseService.getInvoiceById(invoiceId);
      setInvoice(invoiceData);
    } catch (error) {
      console.error("Error loading invoice:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar os detalhes da nota fiscal"
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId, loadInvoice]);

  const handleEditDate = () => {
    if (!invoice) return;

    const currentDate = DateService.formatForInput(invoice.invoice_date);
    setTempDate(currentDate);
    setShowDateModal(true);
  };

  const handleSaveDate = async () => {
    if (!invoice || !tempDate.trim()) return;

    // Validar formato da data (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = tempDate.match(dateRegex);

    if (!match) {
      Alert.alert("Erro", "Data deve estar no formato DD/MM/AAAA");
      return;
    }

    const [, day, month, year] = match;
    const newDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );

    if (
      newDate.getDate() !== parseInt(day) ||
      newDate.getMonth() !== parseInt(month) - 1 ||
      newDate.getFullYear() !== parseInt(year)
    ) {
      Alert.alert("Erro", "Data inválida");
      return;
    }

    setSaving(true);

    try {
      await firebaseService.updateInvoiceDate(invoiceId, newDate);

      // Atualizar o estado local
      setInvoice({ ...invoice, invoice_date: newDate });
      setShowDateModal(false);
      setTempDate("");

      Alert.alert("Sucesso", "Data atualizada com sucesso!");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar a data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.",
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
              Alert.alert("Sucesso", "Nota fiscal excluída com sucesso!", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch {
              Alert.alert("Erro", "Não foi possível excluir a nota fiscal");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!invoice) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Nota fiscal não encontrada</Text>
          <Text style={styles.errorText}>
            A nota fiscal solicitada não foi encontrada ou foi removida.
          </Text>
          <ActionButton
            title="Voltar"
            onPress={async () => router.back()}
            variant="primary"
            actionName="navigate-back"
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Information */}
        <View style={styles.storeCard}>
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
            </View>
          </View>

          {/* Desconto */}
          {/* FIXED: Changed from && to ternary operator */}
          {invoice.discounts && invoice.discounts > 0 ? (
            <View style={styles.discountContainer}>
              <DiscountIndicator
                amount={invoice.discounts}
                variant="badge"
                size="medium"
                showPercentage={true}
                originalAmount={invoice.total_amount + invoice.discounts}
              />
            </View>
          ) : null}

          {/* FIXED: Changed from && to ternary operator */}
          {invoice.store_address ? (
            <View style={styles.storeDetail}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.storeAddress} numberOfLines={3}>
                {invoice.store_address}
              </Text>
            </View>
          ) : null}

          {/* FIXED: Changed from && to ternary operator */}
          {invoice.store_cnpj ? (
            <View style={styles.storeDetail}>
              <Ionicons name="business-outline" size={16} color="#6B7280" />
              <Text style={styles.storeCnpj}>CNPJ: {invoice.store_cnpj}</Text>
            </View>
          ) : null}
        </View>

        {/* Invoice Information */}
        <View style={styles.invoiceCard}>
          <Text style={styles.cardTitle}>Informações da Nota Fiscal</Text>

          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Número:</Text>
              <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
            </View>

            {/* FIXED: Changed from && to ternary operator */}
            {invoice.series ? (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.detailLabel}>Série:</Text>
                <Text style={styles.detailValue}>{invoice.series}</Text>
              </View>
            ) : null}

            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Data de Emissão:</Text>
              <View style={styles.editableDateContainer}>
                <Text style={styles.detailValue}>
                  {DateService.formatForDisplay(invoice.invoice_date, false)}
                </Text>
                <TouchableOpacity
                  style={styles.editDateButton}
                  onPress={handleEditDate}
                >
                  <Ionicons name="pencil" size={16} color="#3498DB" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Escaneada em:</Text>
              <Text style={[styles.detailValue, styles.scannedDate]}>
                {DateService.formatForDisplay(invoice.scanned_at, true)}
              </Text>
            </View>

            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Tempo relativo:</Text>
              <Text style={[styles.detailValue, styles.relativeTime]}>
                {DateService.getRelativeTime(invoice.scanned_at)}
              </Text>
            </View>

            {/* FIXED: Changed from && to ternary operator */}
            {invoice.protocol ? (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.detailLabel}>Protocolo:</Text>
                <Text style={styles.detailValue}>{invoice.protocol}</Text>
              </View>
            ) : null}

            {/* FIXED: Changed from && to ternary operator */}
            {invoice.access_key ? (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.detailLabel}>Chave de Acesso:</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {invoice.access_key}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumo Financeiro</Text>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {firebaseService.formatCurrency(
                  invoice.total_amount - (invoice.taxes || 0)
                )}
              </Text>
            </View>

            {/* FIXED: Changed from && to ternary operator */}
            {invoice.taxes && invoice.taxes > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Impostos:</Text>
                <Text style={styles.summaryValue}>
                  {firebaseService.formatCurrency(invoice.taxes)}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {firebaseService.formatCurrency(invoice.total_amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsCard}>
          <View style={styles.productsHeader}>
            <Text style={styles.cardTitle}>
              Produtos ({invoice.items.length})
            </Text>
            <View style={styles.itemsCount}>
              <Ionicons name="basket" size={16} color="#3498DB" />
              <Text style={styles.itemsCountText}>
                {invoice.items.length} itens
              </Text>
            </View>
          </View>

          <View style={styles.productsList}>
            {invoice.items.map((item, index) => (
              <ProductItem key={index} item={item} index={index} />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <ActionButton
            title="Excluir Nota Fiscal"
            onPress={handleDelete}
            variant="danger"
            icon="trash-outline"
            actionName="delete-invoice"
            cooldownMs={5000}
            showCooldownTimer={true}
          />
        </View>
      </ScrollView>

      {/* Modal para editar data */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={styles.modalTitle}>Editar Data de Emissão</Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>Data (DD/MM/AAAA)</Text>
              <TextInput
                style={styles.modalInput}
                value={tempDate}
                onChangeText={setTempDate}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowDateModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title={saving ? "Salvando..." : "Salvar"}
                onPress={handleSaveDate}
                style={styles.modalButton}
                disabled={saving}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  storeCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  storeInfo: {
    flex: 1,
    marginRight: 12,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    lineHeight: 20,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#6B7280",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: {
    fontSize: 16,
    color: "#3498DB",
    fontWeight: "600",
    marginRight: 12,
  },
  discountContainer: {
    marginBottom: 16,
    alignItems: "flex-start",
  },
  storeDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  storeAddress: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    lineHeight: 20,
  },
  storeCnpj: {
    fontSize: 14,
    color: "#6B7280",
  },
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: ResponsiveUtils.getHorizontalPadding(),
    marginBottom: ResponsiveUtils.getSpacing().md,
    borderRadius: ResponsiveUtils.isSmallDevice ? 12 : 16,
    padding: ResponsiveUtils.getCardPadding(),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: ResponsiveUtils.getFontSizes().large,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: ResponsiveUtils.getSpacing().lg,
  },
  invoiceDetails: {
    gap: 4, // Reduzir ainda mais o espaçamento entre as linhas de informações da NF
  },
  invoiceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: ResponsiveUtils.getSpacing().xs, // Espaçamento responsivo consistente
  },
  detailLabel: {
    fontSize: ResponsiveUtils.getFontSizes().medium,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
    flexShrink: 1, // Permite quebra de texto
  },
  detailValue: {
    fontSize: ResponsiveUtils.getFontSizes().medium,
    color: "#1F2937",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
    flexShrink: 1, // Permite quebra de texto
  },
  scannedDate: {
    color: "#3498DB",
  },
  relativeTime: {
    color: "#27AE60",
    fontStyle: "italic",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryDetails: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    color: "#3498DB",
    fontWeight: "bold",
  },
  productsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemsCountText: {
    fontSize: 12,
    color: "#3498DB",
    fontWeight: "500",
  },
  productsList: {
    gap: 16,
  },
  productItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    lineHeight: 20,
  },
  productCode: {
    fontSize: 12,
    color: "#6B7280",
  },
  productCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
  },
  productDetails: {
    gap: 8,
  },
  productDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  editableDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editDateButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1F2937",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
