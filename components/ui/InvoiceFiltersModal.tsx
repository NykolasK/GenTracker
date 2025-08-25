"use client";

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  firebaseService,
  type InvoiceFilters,
} from "../../services/firebaseService";
import Button from "./Button";

interface InvoiceFiltersModalProps {
  visible: boolean;
  filters: InvoiceFilters;
  onApply: (filters: InvoiceFilters) => void;
  onClose: () => void;
  onClear: () => void;
}

export default function InvoiceFiltersModal({
  visible,
  filters,
  onApply,
  onClose,
  onClear,
}: InvoiceFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<InvoiceFilters>(filters);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({
      sortBy: "scanned_at",
      sortOrder: "desc",
    });
    onClear();
  };

  const updateFilter = (key: keyof InvoiceFilters, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatCurrencyInput = (value: string) => {
    // Remove non-numeric characters except comma and dot
    const numericValue = value.replace(/[^\d,.]/g, "");
    return numericValue;
  };

  const parseCurrencyInput = (value: string): number | undefined => {
    if (!value) return undefined;
    // Replace comma with dot and parse as float
    const numericValue = Number.parseFloat(value.replace(",", "."));
    return isNaN(numericValue) ? undefined : numericValue;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Período de Escaneamento</Text>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>Data Inicial</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDateFromPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {localFilters.dateFrom
                      ? firebaseService.formatDate(localFilters.dateFrom)
                      : "Selecionar"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.dateField}>
                <Text style={styles.fieldLabel}>Data Final</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDateToPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {localFilters.dateTo
                      ? firebaseService.formatDate(localFilters.dateTo)
                      : "Selecionar"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Amount Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor Total</Text>

            <View style={styles.amountRow}>
              <View style={styles.amountField}>
                <Text style={styles.fieldLabel}>Valor Mínimo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="R$ 0,00"
                  value={
                    localFilters.minAmount?.toString().replace(".", ",") || ""
                  }
                  onChangeText={(text) => {
                    const formatted = formatCurrencyInput(text);
                    updateFilter("minAmount", parseCurrencyInput(formatted));
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.amountField}>
                <Text style={styles.fieldLabel}>Valor Máximo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="R$ 999,99"
                  value={
                    localFilters.maxAmount?.toString().replace(".", ",") || ""
                  }
                  onChangeText={(text) => {
                    const formatted = formatCurrencyInput(text);
                    updateFilter("maxAmount", parseCurrencyInput(formatted));
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Items Count Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantidade de Itens</Text>

            <View style={styles.amountRow}>
              <View style={styles.amountField}>
                <Text style={styles.fieldLabel}>Mínimo de Itens</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  value={localFilters.minItems?.toString() || ""}
                  onChangeText={(text) => {
                    const value = Number.parseInt(text) || undefined;
                    updateFilter("minItems", value);
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.amountField}>
                <Text style={styles.fieldLabel}>Máximo de Itens</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  value={localFilters.maxItems?.toString() || ""}
                  onChangeText={(text) => {
                    const value = Number.parseInt(text) || undefined;
                    updateFilter("maxItems", value);
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Store Name Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nome da Loja</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da loja"
              value={localFilters.storeName || ""}
              onChangeText={(text) =>
                updateFilter("storeName", text || undefined)
              }
            />
          </View>

          {/* Sort Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ordenação</Text>

            <View style={styles.sortSection}>
              <Text style={styles.fieldLabel}>Ordenar por:</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: "scanned_at", label: "Data de Escaneamento" },
                  { key: "invoice_date", label: "Data da Nota Fiscal" },
                  { key: "total_amount", label: "Valor Total" },
                  { key: "items_count", label: "Quantidade de Itens" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      localFilters.sortBy === option.key &&
                        styles.sortOptionActive,
                    ]}
                    onPress={() => updateFilter("sortBy", option.key)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        localFilters.sortBy === option.key &&
                          styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.fieldLabel}>Ordem:</Text>
              <View style={styles.sortOrderRow}>
                <TouchableOpacity
                  style={[
                    styles.sortOrderOption,
                    localFilters.sortOrder === "desc" &&
                      styles.sortOrderOptionActive,
                  ]}
                  onPress={() => updateFilter("sortOrder", "desc")}
                >
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={
                      localFilters.sortOrder === "desc" ? "#FFFFFF" : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.sortOrderText,
                      localFilters.sortOrder === "desc" &&
                        styles.sortOrderTextActive,
                    ]}
                  >
                    Decrescente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOrderOption,
                    localFilters.sortOrder === "asc" &&
                      styles.sortOrderOptionActive,
                  ]}
                  onPress={() => updateFilter("sortOrder", "asc")}
                >
                  <Ionicons
                    name="arrow-up"
                    size={16}
                    color={
                      localFilters.sortOrder === "asc" ? "#FFFFFF" : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.sortOrderText,
                      localFilters.sortOrder === "asc" &&
                        styles.sortOrderTextActive,
                    ]}
                  >
                    Crescente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Aplicar Filtros"
            onPress={handleApply}
            variant="primary"
          />
        </View>

        {/* Date Pickers */}
        {showDateFromPicker && (
          <DateTimePicker
            value={localFilters.dateFrom || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDateFromPicker(false);
              if (selectedDate) {
                updateFilter("dateFrom", selectedDate);
              }
            }}
          />
        )}

        {showDateToPicker && (
          <DateTimePicker
            value={localFilters.dateTo || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDateToPicker(false);
              if (selectedDate) {
                updateFilter("dateTo", selectedDate);
              }
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  clearText: {
    fontSize: 16,
    color: "#3498DB",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#374151",
  },
  amountRow: {
    flexDirection: "row",
    gap: 12,
  },
  amountField: {
    flex: 1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#374151",
  },
  sortSection: {
    marginBottom: 16,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionActive: {
    backgroundColor: "#3498DB",
    borderColor: "#3498DB",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  sortOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  sortOrderRow: {
    flexDirection: "row",
    gap: 12,
  },
  sortOrderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  sortOrderOptionActive: {
    backgroundColor: "#3498DB",
    borderColor: "#3498DB",
  },
  sortOrderText: {
    fontSize: 14,
    color: "#6B7280",
  },
  sortOrderTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});
