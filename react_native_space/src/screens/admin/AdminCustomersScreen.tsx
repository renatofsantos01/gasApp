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
  Searchbar,
  Portal,
  Modal,
  Divider,
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { theme } from '../../theme';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: {
    id: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  }[];
  _count?: {
    orders: number;
  };
}

interface CustomerOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: { [key: string]: string } = {
  Pendente: '#FFA726',
  'Em Preparo': '#42A5F5',
  'Saiu para Entrega': '#AB47BC',
  Entregue: '#66BB6A',
  Cancelado: '#EF5350',
};

export const AdminCustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/clients');
      const list = response?.data?.data ?? [];
      setCustomers(list);
      setFilteredCustomers(list);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const filterCustomers = () => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery?.toLowerCase() ?? '';
    const filtered = customers?.filter(
      (c) =>
        (c?.name?.toLowerCase()?.includes(query) ?? false) ||
        (c?.email?.toLowerCase()?.includes(query) ?? false) ||
        (c?.phone?.toLowerCase()?.includes(query) ?? false)
    ) ?? [];

    setFilteredCustomers(filtered);
  };

  React.useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const handleCustomerPress = async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);
      const response = await api.get(`/users/${customer?.id}/orders`);
      setCustomerOrders(response?.data ?? []);
      setModalVisible(true);
    } catch (error) {
      console.error('Erro ao carregar pedidos do cliente:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) ?? '';
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Card style={styles.customerCard} onPress={() => handleCustomerPress(item)}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.customerName}>
          {item?.name ?? 'Cliente'}
        </Text>
        <Text variant="bodyMedium" style={styles.customerEmail}>
          {item?.email ?? ''}
        </Text>
        {item?.phone && (
          <Text variant="bodySmall" style={styles.customerPhone}>
            {item?.phone ?? ''}
          </Text>
        )}

        <Divider style={styles.divider} />

        {item?.addresses && item?.addresses?.length > 0 && (
          <View style={styles.addressContainer}>
            <Text variant="bodySmall" style={styles.addressLabel}>
              Endereço:
            </Text>
            <Text variant="bodySmall" style={styles.addressText}>
              {item?.addresses?.[0]?.street ?? ''}, {item?.addresses?.[0]?.number ?? ''} - {item?.addresses?.[0]?.neighborhood ?? ''}
            </Text>
            <Text variant="bodySmall" style={styles.addressText}>
              {item?.addresses?.[0]?.city ?? ''} - {item?.addresses?.[0]?.state ?? ''}
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text variant="bodySmall" style={styles.statsText}>
            Total de pedidos: {item?._count?.orders ?? 0}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar clientes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item?.id ?? ''}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium">Nenhum cliente encontrado</Text>
          </View>
        }
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView showsVerticalScrollIndicator={true}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {selectedCustomer?.name ?? ''}
            </Text>
            <Text variant="bodyMedium" style={styles.modalSubtitle}>
              {selectedCustomer?.email ?? ''}
            </Text>

            <Divider style={styles.modalDivider} />

            <Text variant="titleMedium" style={styles.ordersTitle}>
              Histórico de Pedidos ({customerOrders?.length ?? 0})
            </Text>

            {customerOrders?.length > 0 ? (
              customerOrders?.map((order) => (
                <Card key={order?.id} style={styles.orderCard}>
                  <Card.Content>
                    <View style={styles.orderHeader}>
                      <Text variant="bodyMedium" style={styles.orderId}>
                        #{order?.id?.substring(0, 8) ?? ''}
                      </Text>
                      <Chip
                        style={{
                          backgroundColor: STATUS_COLORS?.[order?.status ?? ''] ?? '#999',
                        }}
                        textStyle={{ color: 'white', fontSize: 12 }}
                        compact
                      >
                        {order?.status ?? ''}
                      </Chip>
                    </View>
                    <View style={styles.orderDetails}>
                      <Text variant="bodySmall" style={styles.orderDate}>
                        {formatDate(order?.createdAt ?? '')}
                      </Text>
                      <Text variant="titleSmall" style={styles.orderAmount}>
                        R$ {(order?.totalAmount ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )) ?? []
            ) : (
              <Text variant="bodyMedium" style={styles.noOrders}>
                Nenhum pedido realizado ainda
              </Text>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    marginBottom: 16,
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerEmail: {
    color: '#666',
    marginBottom: 2,
  },
  customerPhone: {
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    color: '#666',
  },
  statsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#666',
  },
  modalDivider: {
    marginVertical: 16,
  },
  ordersTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  orderCard: {
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    color: '#666',
  },
  orderAmount: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  noOrders: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
  },
});
