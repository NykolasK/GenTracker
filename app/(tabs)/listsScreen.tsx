"use client"

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import ScreenContainer from '../../components/ui/ScreenContainer'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { firebaseService, type ShoppingList } from '../../services/firebaseService'

export default function ListsScreen() {
  const { user } = useAuth()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadShoppingLists()
    }
  }, [user])

  const loadShoppingLists = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const userLists = await firebaseService.getUserShoppingLists(user.uid)
      setLists(userLists)
    } catch (error) {
      console.error('Error loading shopping lists:', error)
      Alert.alert('Erro', 'Não foi possível carregar as listas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!user) return

    Alert.prompt(
      'Nova Lista',
      'Digite o nome da lista:',
      async (name) => {
        if (name && name.trim()) {
          try {
            await firebaseService.createCustomShoppingList(user.uid, name.trim())
            loadShoppingLists()
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível criar a lista')
          }
        }
      }
    )
  }

  const handleListPress = (list: ShoppingList) => {
    router.push({
      pathname: '/shopping-list-details',
      params: { listId: list.id }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#27AE60'
      case 'completed': return '#3498DB'
      case 'archived': return '#95A5A6'
      default: return '#95A5A6'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa'
      case 'completed': return 'Concluída'
      case 'archived': return 'Arquivada'
      default: return 'Desconhecido'
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando listas...</Text>
          </View>
        </View>
      </ScreenContainer>
    )
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
      </ScreenContainer>
    )
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

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.listDescription}>{list.description}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(list.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(list.status)}</Text>
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
                    {list.items.filter(item => item.purchased).length} comprados
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
                  <Text style={styles.invoiceTagText}>Gerada de nota fiscal</Text>
                </View>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(list.items.filter(item => item.purchased).length / list.items.length) * 100}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round((list.items.filter(item => item.purchased).length / list.items.length) * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  invoiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  invoiceTagText: {
    fontSize: 12,
    color: '#3498DB',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 30,
  },
})
