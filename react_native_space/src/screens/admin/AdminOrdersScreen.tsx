import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Searchbar,
  Button,
  Portal,
  Modal,
  RadioButton,
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

  // Status modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Assign deliverer modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [selectedDelivererId, setSelectedDelivererId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response?.data ?? []);
      setFilteredOrders(response?.data ?? []);
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
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
      setStatusModalVisible(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`, { cancelReason: 'Cancelado pelo administrador' });
      loadOrders();
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
    }
  };

  const openAssignModal = async (order: Order) => {
    setSelectedOrder(order);
    setSelectedDelivererId(order.delivererId ?? '');
    try {
      const list = await apiService.getDeliverers();
      setDeliverers(list);
    } catch {
      setDeliverers([]);
    }
    setAssignModalVisible(true);
  };

  const handleAssignDeliverer = async () => {
    if (!selectedOrder || !selectedDelivererId) return;
    try {
      setAssignLoading(true);
      await apiService.assignDeliverer(selectedOrder.id, selectedDelivererId);
      loadOrders();
      setAssignModalVisible(false);
      setSelectedOrder(null);
    } catch (e) {
      console.error('Erro ao atribuir entregador:', e);
    } finally {
      setAssignLoading(false);
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
            <Button
              mode="outlined"
              onPress={() => { setSelectedOrder(item); setStatusModalVisible(true); }}
              style={styles.actionButton}
              compact
            >
              Status
            </Button>
            <Button
              mode="outlined"
              onPress={() => openAssignModal(item)}
              style={styles.actionButton}
              compact
            >
              Entregador
            </Button>
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

      {/* Modal de status */}
      <Portal>
        <Modal
          visible={statusModalVisible}
          onDismiss={() => { setStatusModalVisible(false); setSelectedOrder(null); }}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Atualizar Status</Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Pedido #{selectedOrder?.id?.substring(0, 8) ?? ''}
          </Text>
          {['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue'].map((status) => (
            <Button
              key={status}
              mode="outlined"
              onPress={() => handleUpdateStatus(selectedOrder?.id ?? '', status)}
              style={styles.statusButton}
            >
              {status}
            </Button>
          ))}
          <Button mode="text" onPress={() => { setStatusModalVisible(false); setSelectedOrder(null); }}>
            Cancelar
          </Button>
        </Modal>
      </Portal>

      {/* Modal de atribuição de entregador */}
      <Portal>
        <Modal
          visible={assignModalVisible}
          onDismiss={() => { setAssignModalVisible(false); setSelectedOrder(null); }}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Atribuir Entregador</Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Pedido #{selectedOrder?.id?.substring(0, 8) ?? ''}
          </Text>

          {deliverers.length === 0 ? (
            <Text variant="bodyMedium" style={styles.noDeliverers}>
              Nenhum entregador cadastrado.{'\n'}Crie um usuário com role "entregador".
            </Text>
          ) : (
            <RadioButton.Group
              onValueChange={setSelectedDelivererId}
              value={selectedDelivererId}
            >
              {deliverers.map((d) => (
                <RadioButton.Item
                  key={d.id}
                  label={d.name}
                  value={d.id}
                />
              ))}
            </RadioButton.Group>
          )}

          <Button
            mode="contained"
            onPress={handleAssignDeliverer}
            disabled={!selectedDelivererId || assignLoading}
            loading={assignLoading}
            style={styles.assignButton}
          >
            Atribuir
          </Button>
          <Button mode="text" onPress={() => { setAssignModalVisible(false); setSelectedOrder(null); }}>
            Cancelar
          </Button>
        </Modal>
      </Portal>
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
  actionButton: { flex: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: { marginBottom: 8, fontWeight: 'bold' },
  modalSubtitle: { marginBottom: 16, color: '#666' },
  statusButton: { marginBottom: 8 },
  noDeliverers: { color: '#666', textAlign: 'center', marginVertical: 16 },
  assignButton: { marginTop: 16, marginBottom: 8 },
});
