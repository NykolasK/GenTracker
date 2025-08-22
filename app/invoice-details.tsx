"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, Share } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import ScreenContainer from "../components/ui/ScreenContainer"
import ActionButton from "../components/ui/ActionButton"
import DiscountIndicator from "../components/ui/DiscountIndicator"
import { firebaseService, type FirebaseInvoice } from "../services/firebaseService"
import { DateService } from "../services/dateService"

interface ProductItemProps {
  item: any
  index: number
}

function ProductItem({ item, index }: ProductItemProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      Alimentação: "#27AE60",
      Bebidas: "#3498DB",
      Limpeza: "#9B59B6",
      "Higiene Pessoal": "#E91E63",
      "Casa e Decoração": "#FF9800",
      Eletrônicos: "#607D8B",
      Papelaria: "#795548",
      "Pet Shop": "#4CAF50",
      Medicamentos: "#F44336",
      "Utilidades Domésticas": "#2196F3",
      "Roupas e Acessórios": "#E91E63",
      "Esportes e Lazer": "#FF5722",
      Automotivo: "#424242",
      Jardinagem: "#8BC34A",
      Outros: "#9E9E9E",
    }
    return colors[category] || colors["Outros"]
  }

  return (
    <View style={styles.productItem}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          {item.code && <Text style={styles.productCode}>Código: {item.code}</Text>}
        </View>
        <View
          style={[
            styles.productCategory,
            {
              backgroundColor: `${getCategoryColor(item.category || "Outros")}15`,
              borderColor: getCategoryColor(item.category || "Outros"),
            },
          ]}
        >
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category || "Outros") }]}>
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
          <Text style={styles.detailValue}>{firebaseService.formatCurrency(item.unit_price)}</Text>
        </View>

        <View style={styles.productDetailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {firebaseService.formatCurrency(item.total_price)}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default function InvoiceDetailsScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>()
  const [invoice, setInvoice] = useState<FirebaseInvoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const invoiceData = await firebaseService.getInvoiceById(invoiceId)
      setInvoice(invoiceData)
    } catch (error) {
      console.error("Error loading invoice:", error)
      Alert.alert("Erro", "Não foi possível carregar os detalhes da nota fiscal")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return

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
              await firebaseService.deleteInvoice(invoice.id!)
              Alert.alert("Sucesso", "Nota fiscal excluída com sucesso!", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ])
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a nota fiscal")
            }
          },
        },
      ],
    )
  }

  const handleShare = async () => {
    if (!invoice) return

    const shareText = `
📄 Nota Fiscal - ${invoice.store_name}

🏪 Loja: ${invoice.store_name}
📋 Número: ${invoice.invoice_number}
📅 Data da Nota: ${DateService.formatForDisplay(invoice.invoice_date, false)}
🔍 Escaneada em: ${DateService.formatForDisplay(invoice.scanned_at, true)}

💰 Total: ${firebaseService.formatCurrency(invoice.total_amount)}
📦 Itens: ${invoice.items.length}

${invoice.discounts && invoice.discounts > 0 ? `💸 Desconto: ${firebaseService.formatCurrency(invoice.discounts)}\n` : ""}
${invoice.taxes && invoice.taxes > 0 ? `🏛️ Impostos: ${firebaseService.formatCurrency(invoice.taxes)}\n` : ""}

📱 Gerado pelo GenTracker
    `.trim()

    try {
      await Share.share({
        message: shareText,
        title: `Nota Fiscal - ${invoice.store_name}`,
      })
    } catch (error) {
      console.error("Error sharing invoice:", error)
    }
  }

  const handleCreateShoppingList = async () => {
    if (!invoice) return

    const listId = await firebaseService.createShoppingListFromInvoice(invoice)
    Alert.alert("Lista Criada!", "Uma nova lista de compras foi criada baseada nesta nota fiscal.", [
      {
        text: "Ver Lista",
        onPress: () =>
          router.push({
            pathname: "/shopping-list-details",
            params: { listId },
          }),
      },
      {
        text: "OK",
        style: "cancel",
      },
    ])
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </ScreenContainer>
    )
  }

  if (!invoice) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Nota fiscal não encontrada</Text>
          <Text style={styles.errorText}>A nota fiscal solicitada não foi encontrada ou foi removida.</Text>
          <ActionButton
            title="Voltar"
            onPress={async () => router.back()}
            variant="primary"
            actionName="navigate-back"
          />
        </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Store Information */}
        <View style={styles.storeCard}>
          <View style={styles.cardHeader}>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{invoice.store_name}</Text>
              <Text style={styles.invoiceNumber}>NF-e: {invoice.invoice_number}</Text>
            </View>
            <View style={styles.cardActions}>
              <Text style={styles.amount}>{firebaseService.formatCurrency(invoice.total_amount)}</Text>
            </View>
          </View>

          {/* Desconto */}
          {invoice.discounts && invoice.discounts > 0 && (
            <View style={styles.discountContainer}>
              <DiscountIndicator
                amount={invoice.discounts}
                variant="badge"
                size="medium"
                showPercentage={true}
                originalAmount={invoice.total_amount + invoice.discounts}
              />
            </View>
          )}

          {invoice.store_address && (
            <View style={styles.storeDetail}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.storeAddress} numberOfLines={3}>
                {invoice.store_address}
              </Text>
            </View>
          )}

          {invoice.store_cnpj && (
            <View style={styles.storeDetail}>
              <Ionicons name="business-outline" size={16} color="#6B7280" />
              <Text style={styles.storeCnpj}>CNPJ: {invoice.store_cnpj}</Text>
            </View>
          )}
        </View>

        {/* Invoice Information */}
        <View style={styles.invoiceCard}>
          <Text style={styles.cardTitle}>Informações da Nota Fiscal</Text>

          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Número:</Text>
              <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
            </View>

            {invoice.series && (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.detailLabel}>Série:</Text>
                <Text style={styles.detailValue}>{invoice.series}</Text>
              </View>
            )}

            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Data de Emissão:</Text>
              <Text style={styles.detailValue}>{DateService.formatForDisplay(invoice.invoice_date, false)}</Text>
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

            {invoice.protocol && (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.detailLabel}>Protocolo:</Text>
                <Text style={styles.detailValue}>{invoice.protocol}</Text>
              </View>
            )}

            {invoice.access_key && (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.detailLabel}>Chave de Acesso:</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {invoice.access_key}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumo Financeiro</Text>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {firebaseService.formatCurrency(invoice.total_amount - (invoice.taxes || 0))}
              </Text>
            </View>

            {invoice.taxes && invoice.taxes > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Impostos:</Text>
                <Text style={styles.summaryValue}>{firebaseService.formatCurrency(invoice.taxes)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{firebaseService.formatCurrency(invoice.total_amount)}</Text>
            </View>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsCard}>
          <View style={styles.productsHeader}>
            <Text style={styles.cardTitle}>Produtos ({invoice.items.length})</Text>
            <View style={styles.itemsCount}>
              <Ionicons name="basket" size={16} color="#3498DB" />
              <Text style={styles.itemsCountText}>{invoice.items.length} itens</Text>
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
            title="Criar Lista de Compras"
            onPress={handleCreateShoppingList}
            variant="primary"
            icon="list"
            actionName="create-shopping-list"
            cooldownMs={3000}
          />

          <ActionButton
            title="Compartilhar"
            onPress={handleShare}
            variant="secondary"
            icon="share-outline"
            actionName="share-invoice"
            cooldownMs={1000}
          />

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
    </ScreenContainer>
  )
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  invoiceDetails: {
    gap: 12,
  },
  invoiceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
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
  totalValue: {
    color: "#3498DB",
    fontWeight: "600",
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
})
