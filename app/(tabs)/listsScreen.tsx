"use client";

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ScreenContainer from "../../components/ui/ScreenContainer";
import StatsOverview from "../../components/ui/StatsOverview";
import { useAuth } from "../../context/AuthContext";
import {
  firebaseService,
  type ShoppingList,
  type ShoppingListItem,
} from "../../services/firebaseService";
import { logger } from "../../utils/logger";
import { ResponsiveUtils } from "../../utils/responsiveUtils";

interface NewItem {
  name: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
  category: string;
}

const COMMON_UNITS = ["UN", "KG", "L", "PC", "PCT", "CX", "G", "ML"];
const COMMON_CATEGORIES = [
  "Alimentação",
  "Limpeza",
  "Higiene",
  "Bebidas",
  "Medicamentos",
  "Outros",
];

export default function ListsScreen() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  // Estados para criação/edição de lista
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [currentItem, setCurrentItem] = useState<NewItem>({
    name: "",
    quantity: "1",
    unit: "UN",
    estimatedPrice: "",
    category: "Alimentação",
  });
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const loadShoppingLists = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userLists = await firebaseService.getUserShoppingLists(user.uid);
      setLists(userLists);
    } catch (error) {
      logger.error("Error loading shopping lists:", error);
      Alert.alert("Erro", "Não foi possível carregar as listas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadShoppingLists();
    }
  }, [user, loadShoppingLists]);

  const handleCreateList = async () => {
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setListName("");
    setListDescription("");
    setItems([]);
    setCurrentItem({
      name: "",
      quantity: "1",
      unit: "UN",
      estimatedPrice: "",
      category: "Alimentação",
    });
    setIsEditMode(false);
    setSelectedList(null);
  };

  const addItem = () => {
    if (!currentItem.name.trim()) {
      Alert.alert("Erro", "Nome do produto é obrigatório");
      return;
    }

    const quantity = parseInt(currentItem.quantity) || 1;
    const estimatedPrice = parseFloat(currentItem.estimatedPrice) || 0;

    const newItem: ShoppingListItem = {
      id: Date.now().toString(),
      name: currentItem.name.trim(),
      quantity,
      unit: currentItem.unit,
      estimated_price: estimatedPrice,
      category: currentItem.category,
      brand: null,
      purchased: false,
      actual_price: null,
      notes: null,
    };

    setItems([...items, newItem]);
    setCurrentItem({
      name: "",
      quantity: "1",
      unit: currentItem.unit,
      estimatedPrice: "",
      category: currentItem.category,
    });
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const saveList = async () => {
    if (!user) return;

    if (!listName.trim()) {
      Alert.alert("Erro", "Nome da lista é obrigatório");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um item à lista");
      return;
    }

    try {
      setSaving(true);

      if (isEditMode && selectedList) {
        await updateList();
      } else {
        await firebaseService.createCustomShoppingList(
          user.uid,
          listName.trim(),
          listDescription.trim() || "",
          items
        );

        Alert.alert("Sucesso", "Lista criada com sucesso!");
        setShowCreateModal(false);
        resetForm();
        loadShoppingLists(); // Recarregar listas
      }
    } catch (error) {
      logger.error("Error saving list:", error);
      Alert.alert(
        "Erro",
        isEditMode
          ? "Não foi possível atualizar a lista"
          : "Não foi possível criar a lista"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await firebaseService.deleteShoppingList(listId);
      Alert.alert("Sucesso", "Lista excluída com sucesso!");
      loadShoppingLists(); // Recarregar listas
    } catch (error) {
      logger.error("Error deleting list:", error);
      Alert.alert("Erro", "Não foi possível excluir a lista");
    }
  };

  const confirmDeleteList = (listId: string, listName: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a lista "${listName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => handleDeleteList(listId),
        },
      ]
    );
  };

  const handleListPress = (list: ShoppingList) => {
    setSelectedList(list);
    setShowViewModal(true);
  };

  const handleEditList = (list: ShoppingList) => {
    setSelectedList(list);
    setListName(list.name);
    setListDescription(list.description || "");
    setItems([...list.items]);
    setIsEditMode(true);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const toggleItemPurchased = async (
    listId: string,
    itemId: string,
    purchased: boolean
  ) => {
    try {
      // Atualizar localmente primeiro para resposta imediata
      if (selectedList) {
        const updatedItems = selectedList.items.map((item) =>
          item.id === itemId ? { ...item, purchased } : item
        );

        setSelectedList({
          ...selectedList,
          items: updatedItems,
        });

        // Também atualizar a lista principal
        setLists((prevLists) =>
          prevLists.map((list) =>
            list.id === listId ? { ...list, items: updatedItems } : list
          )
        );
      }

      // Depois sincronizar com Firebase
      await firebaseService.updateShoppingListItem(listId, itemId, {
        purchased,
      });
    } catch (error) {
      logger.error("Error updating item status:", error);
      Alert.alert("Erro", "Não foi possível atualizar o item");
      // Reverter mudança local em caso de erro
      loadShoppingLists();
    }
  };

  const updateList = async () => {
    if (!user || !selectedList) return;

    if (!listName.trim()) {
      Alert.alert("Erro", "Nome da lista é obrigatório");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Erro", "A lista deve ter pelo menos um item");
      return;
    }

    try {
      setSaving(true);

      // Calcular o total estimado
      const totalCost = items.reduce(
        (sum, item) => sum + (item.estimated_price || 0) * item.quantity,
        0
      );

      await firebaseService.updateShoppingList(selectedList.id!, {
        name: listName.trim(),
        description: listDescription.trim() || "",
        items,
        total_estimated_cost: totalCost,
      });

      Alert.alert("Sucesso", "Lista atualizada com sucesso!");
      setShowEditModal(false);
      resetForm();
      setSelectedList(null);
      setIsEditMode(false);
      loadShoppingLists();
    } catch (error) {
      logger.error("Error updating list:", error);
      Alert.alert("Erro", "Não foi possível atualizar a lista");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#27AE60";
      case "completed":
        return "#3498DB";
      case "archived":
        return "#95A5A6";
      default:
        return "#95A5A6";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "completed":
        return "Concluída";
      case "archived":
        return "Arquivada";
      default:
        return "Desconhecido";
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando listas...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (lists.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <EmptyState
            icon="document-text"
            title="Nenhuma lista ainda"
            subtitle="Crie sua primeira lista de compras ou escaneie uma nota fiscal"
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Criar Nova Lista"
              onPress={handleCreateList}
              variant="primary"
            />
          </View>
        </View>

        {/* Modal de Criação de Lista */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <KeyboardAvoidingView
              style={styles.modalContent}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Nova Lista</Text>
                <TouchableOpacity
                  onPress={saveList}
                  style={[
                    styles.modalSaveButton,
                    saving && styles.modalSaveButtonDisabled,
                  ]}
                  disabled={saving}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Informações da Lista */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Informações da Lista
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nome da Lista *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={listName}
                      onChangeText={setListName}
                      placeholder="Ex: Compras do mês"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Descrição (opcional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.textAreaInput]}
                      value={listDescription}
                      onChangeText={setListDescription}
                      placeholder="Ex: Lista para compras de casa"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>

                {/* Adicionar Produto */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Adicionar Produto
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nome do Produto *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentItem.name}
                      onChangeText={(text) =>
                        setCurrentItem({ ...currentItem, name: text })
                      }
                      placeholder="Ex: Arroz integral"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View
                      style={[
                        styles.inputContainer,
                        styles.inputContainerSmall,
                      ]}
                    >
                      <Text style={styles.inputLabel}>Quantidade</Text>
                      <TextInput
                        style={styles.textInput}
                        value={currentItem.quantity}
                        onChangeText={(text) =>
                          setCurrentItem({ ...currentItem, quantity: text })
                        }
                        placeholder="1"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>

                    <View
                      style={[
                        styles.inputContainer,
                        styles.inputContainerMedium,
                      ]}
                    >
                      <Text style={styles.inputLabel}>Unidade</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.unitSelector}
                      >
                        {COMMON_UNITS.map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            style={[
                              styles.unitButton,
                              currentItem.unit === unit &&
                                styles.unitButtonSelected,
                            ]}
                            onPress={() =>
                              setCurrentItem({ ...currentItem, unit })
                            }
                          >
                            <Text
                              style={[
                                styles.unitButtonText,
                                currentItem.unit === unit &&
                                  styles.unitButtonTextSelected,
                              ]}
                            >
                              {unit}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View
                      style={[
                        styles.inputContainer,
                        styles.inputContainerMedium,
                      ]}
                    >
                      <Text style={styles.inputLabel}>Preço Estimado</Text>
                      <TextInput
                        style={styles.textInput}
                        value={currentItem.estimatedPrice}
                        onChangeText={(text) =>
                          setCurrentItem({
                            ...currentItem,
                            estimatedPrice: text,
                          })
                        }
                        placeholder="0,00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <View
                      style={[
                        styles.inputContainer,
                        styles.inputContainerMedium,
                      ]}
                    >
                      <Text style={styles.inputLabel}>Categoria</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categorySelector}
                      >
                        {COMMON_CATEGORIES.map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryButton,
                              currentItem.category === category &&
                                styles.categoryButtonSelected,
                            ]}
                            onPress={() =>
                              setCurrentItem({ ...currentItem, category })
                            }
                          >
                            <Text
                              style={[
                                styles.categoryButtonText,
                                currentItem.category === category &&
                                  styles.categoryButtonTextSelected,
                              ]}
                            >
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={addItem}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addItemButtonText}>
                      Adicionar Produto
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Lista de Produtos */}
                {items.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Produtos Adicionados ({items.length})
                    </Text>

                    {items.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemDetails}>
                            {item.quantity} {item.unit} • {item.category} •{" "}
                            {firebaseService.formatCurrency(
                              item.estimated_price
                            )}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeItemButton}
                          onPress={() => removeItem(item.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Minhas Listas</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateList}>
            <Ionicons name="add" size={24} color="#3498DB" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <StatsOverview variant="compact" />
        </View>

        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {lists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={styles.listCard}
              onPress={() => handleListPress(list)}
              activeOpacity={0.7}
            >
              <View style={styles.listHeader}>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{list.name}</Text>
                  {list.description && (
                    <Text style={styles.listDescription}>
                      {list.description}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(list.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(list.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.listStats}>
                <View style={styles.statItem}>
                  <Ionicons name="list" size={16} color="#6B7280" />
                  <Text style={styles.statText}>{list.items.length} itens</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                  <Text style={styles.statText}>
                    {list.items.filter((item) => item.purchased).length}{" "}
                    comprados
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cash" size={16} color="#6B7280" />
                  <Text style={styles.statText}>
                    {firebaseService.formatCurrency(list.total_estimated_cost)}
                  </Text>
                </View>
              </View>

              {list.created_from_invoice && (
                <View style={styles.invoiceTag}>
                  <Ionicons name="receipt" size={14} color="#3498DB" />
                  <Text style={styles.invoiceTagText}>
                    Gerada de nota fiscal
                  </Text>
                </View>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          (list.items.filter((item) => item.purchased).length /
                            list.items.length) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(
                    (list.items.filter((item) => item.purchased).length /
                      list.items.length) *
                      100
                  )}
                  %
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal de Criação de Lista */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nova Lista</Text>
              <TouchableOpacity
                onPress={saveList}
                style={[
                  styles.modalSaveButton,
                  saving && styles.modalSaveButtonDisabled,
                ]}
                disabled={saving}
              >
                <Text style={styles.modalSaveButtonText}>
                  {saving ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Informações da Lista */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Informações da Lista
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome da Lista *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={listName}
                    onChangeText={setListName}
                    placeholder="Ex: Compras do mês"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Descrição (opcional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    value={listDescription}
                    onChangeText={setListDescription}
                    placeholder="Ex: Lista para compras de casa"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Adicionar Produto */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Adicionar Produto</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome do Produto *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={currentItem.name}
                    onChangeText={(text) =>
                      setCurrentItem({ ...currentItem, name: text })
                    }
                    placeholder="Ex: Arroz integral"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View
                    style={[styles.inputContainer, styles.inputContainerSmall]}
                  >
                    <Text style={styles.inputLabel}>Quantidade</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentItem.quantity}
                      onChangeText={(text) =>
                        setCurrentItem({ ...currentItem, quantity: text })
                      }
                      placeholder="1"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View
                    style={[styles.inputContainer, styles.inputContainerMedium]}
                  >
                    <Text style={styles.inputLabel}>Unidade</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.unitSelector}
                    >
                      {COMMON_UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitButton,
                            currentItem.unit === unit &&
                              styles.unitButtonSelected,
                          ]}
                          onPress={() =>
                            setCurrentItem({ ...currentItem, unit })
                          }
                        >
                          <Text
                            style={[
                              styles.unitButtonText,
                              currentItem.unit === unit &&
                                styles.unitButtonTextSelected,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View
                    style={[styles.inputContainer, styles.inputContainerMedium]}
                  >
                    <Text style={styles.inputLabel}>Preço Estimado</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentItem.estimatedPrice}
                      onChangeText={(text) =>
                        setCurrentItem({ ...currentItem, estimatedPrice: text })
                      }
                      placeholder="0,00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View
                    style={[styles.inputContainer, styles.inputContainerMedium]}
                  >
                    <Text style={styles.inputLabel}>Categoria</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.categorySelector}
                    >
                      {COMMON_CATEGORIES.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryButton,
                            currentItem.category === category &&
                              styles.categoryButtonSelected,
                          ]}
                          onPress={() =>
                            setCurrentItem({ ...currentItem, category })
                          }
                        >
                          <Text
                            style={[
                              styles.categoryButtonText,
                              currentItem.category === category &&
                                styles.categoryButtonTextSelected,
                            ]}
                          >
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={addItem}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addItemButtonText}>
                    Adicionar Produto
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Produtos */}
              {items.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Produtos Adicionados ({items.length})
                  </Text>

                  {items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDetails}>
                          {item.quantity} {item.unit} • {item.category} •{" "}
                          {firebaseService.formatCurrency(item.estimated_price)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeItemButton}
                        onPress={() => removeItem(item.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Visualização da Lista */}
      <Modal
        visible={showViewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowViewModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowViewModal(false);
                  setSelectedList(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedList?.name}</Text>
              <View style={styles.viewModalActions}>
                <TouchableOpacity
                  onPress={() => handleEditList(selectedList!)}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={20} color="#3498DB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    confirmDeleteList(selectedList!.id!, selectedList!.name)
                  }
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {selectedList && (
                <>
                  {/* Informações da Lista */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Informações</Text>
                    {selectedList.description && (
                      <Text style={styles.listDescriptionText}>
                        {selectedList.description}
                      </Text>
                    )}
                    <View style={styles.listStatsContainer}>
                      <View style={styles.statItem}>
                        <Ionicons name="list" size={16} color="#6B7280" />
                        <Text style={styles.statText}>
                          {selectedList.items.length} itens
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#6B7280"
                        />
                        <Text style={styles.statText}>
                          {
                            selectedList.items.filter((item) => item.purchased)
                              .length
                          }{" "}
                          comprados
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="cash" size={16} color="#6B7280" />
                        <Text style={styles.statText}>
                          {firebaseService.formatCurrency(
                            selectedList.total_estimated_cost
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Barra de Progresso */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${
                                (selectedList.items.filter(
                                  (item) => item.purchased
                                ).length /
                                  selectedList.items.length) *
                                100
                              }%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(
                          (selectedList.items.filter((item) => item.purchased)
                            .length /
                            selectedList.items.length) *
                            100
                        )}
                        %
                      </Text>
                    </View>
                  </View>

                  {/* Lista de Produtos */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Produtos</Text>
                    {selectedList.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.itemCheckCard,
                          item.purchased && styles.itemCheckCardCompleted,
                        ]}
                        onPress={() =>
                          toggleItemPurchased(
                            selectedList.id!,
                            item.id,
                            !item.purchased
                          )
                        }
                      >
                        <View style={styles.checkboxContainer}>
                          <View
                            style={[
                              styles.checkbox,
                              item.purchased && styles.checkboxChecked,
                            ]}
                          >
                            {item.purchased && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                        </View>
                        <View style={styles.itemInfo}>
                          <Text
                            style={[
                              styles.itemName,
                              item.purchased && styles.itemNameCompleted,
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={[
                              styles.itemDetails,
                              item.purchased && styles.itemDetailsCompleted,
                            ]}
                          >
                            {item.quantity} {item.unit} • {item.category} •{" "}
                            {firebaseService.formatCurrency(
                              item.estimated_price
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Edição da Lista */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Editar Lista</Text>
              <TouchableOpacity
                onPress={updateList}
                style={[
                  styles.modalSaveButton,
                  saving && styles.modalSaveButtonDisabled,
                ]}
                disabled={saving}
              >
                <Text style={styles.modalSaveButtonText}>
                  {saving ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Informações da Lista */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Informações da Lista
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome da Lista *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={listName}
                    onChangeText={setListName}
                    placeholder="Ex: Compras do mês"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Descrição (opcional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    value={listDescription}
                    onChangeText={setListDescription}
                    placeholder="Ex: Lista para compras de casa"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Adicionar Produto */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Adicionar Produto</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome do Produto *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={currentItem.name}
                    onChangeText={(text) =>
                      setCurrentItem({ ...currentItem, name: text })
                    }
                    placeholder="Ex: Arroz integral"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View
                    style={[styles.inputContainer, styles.inputContainerSmall]}
                  >
                    <Text style={styles.inputLabel}>Quantidade</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentItem.quantity}
                      onChangeText={(text) =>
                        setCurrentItem({ ...currentItem, quantity: text })
                      }
                      placeholder="1"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View
                    style={[styles.inputContainer, styles.inputContainerMedium]}
                  >
                    <Text style={styles.inputLabel}>Unidade</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.unitSelector}
                    >
                      {COMMON_UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitButton,
                            currentItem.unit === unit &&
                              styles.unitButtonSelected,
                          ]}
                          onPress={() =>
                            setCurrentItem({ ...currentItem, unit })
                          }
                        >
                          <Text
                            style={[
                              styles.unitButtonText,
                              currentItem.unit === unit &&
                                styles.unitButtonTextSelected,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View
                    style={[styles.inputContainer, styles.inputContainerMedium]}
                  >
                    <Text style={styles.inputLabel}>Preço Estimado</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentItem.estimatedPrice}
                      onChangeText={(text) =>
                        setCurrentItem({ ...currentItem, estimatedPrice: text })
                      }
                      placeholder="0,00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View
                    style={[styles.inputContainer, styles.inputContainerMedium]}
                  >
                    <Text style={styles.inputLabel}>Categoria</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.categorySelector}
                    >
                      {COMMON_CATEGORIES.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryButton,
                            currentItem.category === category &&
                              styles.categoryButtonSelected,
                          ]}
                          onPress={() =>
                            setCurrentItem({ ...currentItem, category })
                          }
                        >
                          <Text
                            style={[
                              styles.categoryButtonText,
                              currentItem.category === category &&
                                styles.categoryButtonTextSelected,
                            ]}
                          >
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={addItem}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addItemButtonText}>
                    Adicionar Produto
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Produtos */}
              {items.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Produtos na Lista ({items.length})
                  </Text>

                  {items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDetails}>
                          {item.quantity} {item.unit} • {item.category} •{" "}
                          {firebaseService.formatCurrency(item.estimated_price)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeItemButton}
                        onPress={() => removeItem(item.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: ResponsiveUtils.getVerticalSpacing(),
    paddingHorizontal: ResponsiveUtils.getHorizontalPadding(),
    paddingBottom: 0, // Remove padding inferior para evitar sobreposição com navbar
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ResponsiveUtils.getVerticalSpacing(),
  },
  title: {
    fontSize: ResponsiveUtils.getFontSizes().header,
    fontWeight: "bold",
    color: "#1F2937",
    flexShrink: 1,
  },
  addButton: {
    width: ResponsiveUtils.isSmallDevice ? 36 : 40,
    height: ResponsiveUtils.isSmallDevice ? 36 : 40,
    borderRadius: ResponsiveUtils.isSmallDevice ? 18 : 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: ResponsiveUtils.getFontSizes().large,
    color: "#6B7280",
  },
  buttonContainer: {
    marginTop: ResponsiveUtils.getVerticalSpacing() * 1.5,
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: ResponsiveUtils.isSmallDevice ? 12 : 16,
    padding: ResponsiveUtils.getCardPadding(),
    marginBottom: ResponsiveUtils.getSpacing().md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  listStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#6B7280",
  },
  invoiceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  invoiceTagText: {
    fontSize: 12,
    color: "#3498DB",
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498DB",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    minWidth: 30,
  },
  statsSection: {
    marginBottom: 20,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalSaveButton: {
    backgroundColor: "#3498DB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputContainerSmall: {
    flex: 1,
    marginRight: 8,
  },
  inputContainerMedium: {
    flex: 2,
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  textAreaInput: {
    height: 60,
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  unitSelector: {
    maxHeight: 40,
  },
  unitButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  unitButtonSelected: {
    backgroundColor: "#3498DB",
  },
  unitButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  unitButtonTextSelected: {
    color: "#FFFFFF",
  },
  categorySelector: {
    maxHeight: 40,
  },
  categoryButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryButtonSelected: {
    backgroundColor: "#3498DB",
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  categoryButtonTextSelected: {
    color: "#FFFFFF",
  },
  addItemButton: {
    backgroundColor: "#3498DB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  addItemButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: "#6B7280",
  },
  removeItemButton: {
    padding: 8,
  },

  // Estilos para Modal de Visualização
  viewModalActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBF8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  listDescriptionText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  listStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  // Estilos para Checklist
  itemCheckCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemCheckCardCompleted: {
    backgroundColor: "#F0F9FF",
    borderColor: "#3498DB",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#3498DB",
    borderColor: "#3498DB",
  },
  itemNameCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  itemDetailsCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
});
