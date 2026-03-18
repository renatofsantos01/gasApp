import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiService } from '../../services/api';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/format';
import { EmptyState } from '../../components/EmptyState';
import { theme } from '../../theme';
import { DelivererStackParamList } from '../../navigation/DelivererNavigator';

type Nav = NativeStackNavigationProp<DelivererStackParamList, 'DelivererHome'>;

const STATUS_COLORS: Record<string, string> = {
  Pendente: '#FFA726',
  'Em Preparo': '#42A5F5',
  'Saiu para Entrega': '#AB47BC',
  Entregue: '#66BB6A',
  Cancelado: '#EF5350',
};

export const DelivererHomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = async () => {
    try {
      const data = await apiService.getMyDeliveries();
      setOrders(data);
    } catch (e) {
      console.error('Erro ao carregar entregas:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDeliveries();
    }, [])
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('DelivererOrderDetails', { order: item })}
    >
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.orderNum}>
            Pedido #{item.id.substring(0, 8).toUpperCase()}
          </Text>
          <Chip
            style={{ backgroundColor: STATUS_COLORS[item.status] ?? '#999' }}
            textStyle={{ color: 'white', fontSize: 12 }}
            compact
          >
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.clientName}>
          {item.user?.name ?? '—'}
        </Text>
        {item.user?.phone ? (
          <Text variant="bodySmall" style={styles.phone}>{item.user.phone}</Text>
        ) : null}
        <Text variant="bodySmall" style={styles.address}>
          {item.address?.street}, {item.address?.number} — {item.address?.neighborhood}
        </Text>
        <Text variant="titleMedium" style={styles.total}>
          {formatCurrency(item.totalAmount)}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text variant="headlineMedium" style={styles.title}>Minhas Entregas</Text>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={() => { setRefreshing(true); loadDeliveries(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="car-outline"
              title="Nenhuma entrega"
              message="Você não tem entregas atribuídas no momento"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  pageHeader: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontWeight: 'bold' },
  list: { padding: 16 },
  card: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNum: { fontWeight: 'bold' },
  clientName: { fontWeight: '600', marginBottom: 2 },
  phone: { color: '#666', marginBottom: 4 },
  address: { color: '#666', marginBottom: 8 },
  total: { color: theme.colors.primary, fontWeight: 'bold' },
});
