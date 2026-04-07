'use client';

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Searchbar,
  Button,
  Menu,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api, apiService } from '../../services/api';
import { Deliverer } from '../../types';
import { theme } from '../../theme';

interface Order {
  id: string;
  user: { name: string; email: string };
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  delivererId?: string;
  delivererName?: string;
}

const STATUS_OPTIONS = [
  'Todos',
  'Pendente',
  'Em Preparo',
  'Saiu para Entrega',
  'Entregue',
  'Cancelado',
];

const STATUS_COLORS: { [key: string]: string } = {
  Pendente: '#FFA726',
  'Em Preparo': '#42A5F5',
  'Saiu para Entrega': '#AB47BC',
  Entregue: '#66BB6A',
  Cancelado: '#EF5350',
};

export const AdminOrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);

  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [openDelivererMenuId, setOpenDelivererMenuId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      const list = response?.data?.data ?? [];
      setOrders(list);
      setFilteredOrders(list);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      apiService.getDeliverers().then(setDeliverers).catch(() => setDeliverers([]));
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filterOrders = () => {
    let filtered = orders ?? [];
    if (selectedStatus !== 'Todos') {
      filtered = filtered.filter((o) => o?.status === selectedStatus);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o?.user?.name?.toLowerCase().includes(query) ||
          o?.user?.email?.toLowerCase().includes(query) ||
          o?.id?.toLowerCase().includes(query)
      );
    }
    setFilteredOrders(filtered);
  };

  React.useEffect(() => {
    filterOrders();
  }, [searchQuery, selectedStatus, orders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setOpenStatusMenuId(null);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancelar Pedido',
      'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar Pedido',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/orders/${orderId}/cancel`, { cancelReason: 'Cancelado pelo administrador' });
              loadOrders();
            } catch (error) {
              console.error('Erro ao cancelar pedido:', error);
            }
          },
        },
      ]
    );
  };

  const handleAssignDeliverer = async (orderId: string, delivererId: string) => {
    setOpenDelivererMenuId(null);
    try {
      await apiService.assignDeliverer(orderId, delivererId);
      loadOrders();
    } catch (e) {
      console.error('Erro ao atribuir entregador:', e);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card
      style={styles.orderCard}
      onPress={() => (navigation as any).navigate('OrderDetails', { orderId: item?.id })}
    >
      <Card.Content>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text variant="titleMedium" style={styles.orderId}>
              Pedido #{item?.id?.substring(0, 8) ?? ''}
            </Text>
            <Text variant="bodySmall" style={styles.orderDate}>
              {formatDate(item?.createdAt ?? '')}
            </Text>
          </View>
          <Chip
            style={{ backgroundColor: STATUS_COLORS?.[item?.status ?? ''] ?? '#999' }}
            textStyle={{ color: 'white' }}
          >
            {item?.status ?? ''}
          </Chip>
        </View>

        <Text variant="bodyMedium" style={styles.customerName}>
          Cliente: {item?.user?.name ?? 'Desconhecido'}
        </Text>

        {item?.delivererId ? (
          <Text variant="bodySmall" style={styles.delivererBadge}>
            Entregador: {item?.delivererName ?? item.delivererId.substring(0, 8)}
          </Text>
        ) : null}

        <View style={styles.orderFooter}>
          <Text variant="titleMedium" style={styles.totalAmount}>
            R$ {(item?.totalAmount ?? 0).toFixed(2)}
          </Text>
          <Text variant="bodySmall" style={styles.paymentMethod}>
            {item?.paymentMethod ?? ''}
          </Text>
        </View>

        {item?.status !== 'Entregue' && item?.status !== 'Cancelado' && (
          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <Menu
                visible={openStatusMenuId === item.id}
                onDismiss={() => setOpenStatusMenuId(null)}
                anchor={
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setOpenStatusMenuId(item.id)}
                    style={styles.actionButton}
                  >
                    Status
                  </Button>
                }
              >
                {['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue'].map((status) => (
                  <Menu.Item
                    key={status}
                    title={status}
                    onPress={() => handleUpdateStatus(item.id, status)}
                    trailingIcon={item.status === status ? 'check' : undefined}
                  />
                ))}
              </Menu>
            </View>

            <View style={styles.actionItem}>
              <Menu
                visible={openDelivererMenuId === item.id}
                onDismiss={() => setOpenDelivererMenuId(null)}
                anchor={
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setOpenDelivererMenuId(item.id)}
                    style={styles.actionButton}
                  >
                    Entregador
                  </Button>
                }
              >
                {deliverers.length === 0 ? (
                  <Menu.Item title="Nenhum entregador cadastrado" disabled />
                ) : (
                  deliverers.map((d) => (
                    <Menu.Item
                      key={d.id}
                      title={d.name}
                      onPress={() => handleAssignDeliverer(item.id, d.id)}
                      trailingIcon={item.delivererId === d.id ? 'check' : undefined}
                    />
                  ))
                )}
              </Menu>
            </View>

            <View style={styles.actionItem}>
              <Button
                mode="outlined"
                textColor="#EF5350"
                onPress={() => handleCancelOrder(item?.id ?? '')}
                style={styles.actionButton}
                compact
              >
                Cancelar
              </Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar pedidos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusContainer}
        contentContainerStyle={styles.statusContentContainer}
      >
        {STATUS_OPTIONS.map((status) => (
          <Chip
            key={status}
            selected={selectedStatus === status}
            onPress={() => setSelectedStatus(status)}
            style={styles.statusChip}
            compact
          >
            {status}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item?.id ?? ''}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium">Nenhum pedido encontrado</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchbar: { margin: 16 },
  statusContainer: { maxHeight: 50, marginBottom: 8 },
  statusContentContainer: { paddingHorizontal: 16, alignItems: 'center' },
  statusChip: { marginRight: 8, height: 32 },
  listContent: { padding: 16 },
  orderCard: { marginBottom: 16 },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: { flex: 1 },
  orderId: { fontWeight: 'bold' },
  orderDate: { color: '#666', marginTop: 4 },
  customerName: { fontWeight: '600', marginTop: 8 },
  delivererBadge: { color: '#7B1FA2', marginTop: 2 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalAmount: { color: theme.colors.primary, fontWeight: 'bold' },
  paymentMethod: { color: '#666' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionItem: { flex: 1 },
  actionButton: { width: '100%' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
});
