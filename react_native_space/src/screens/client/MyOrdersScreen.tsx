import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientTabParamList } from '../../navigation/ClientNavigator';
import { apiService } from '../../services/api';
import { Order } from '../../types';
import { OrderCard } from '../../components/OrderCard';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { theme } from '../../theme';

type MyOrdersScreenProps = {
  navigation: NativeStackNavigationProp<ClientTabParamList, 'MyOrders'>;
};

export const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await apiService.getOrders();
      setOrders(data?.sort((a, b) => new Date(b?.createdat ?? '').getTime() - new Date(a?.createdat ?? '').getTime()) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <Loading message="Carregando pedidos..." />;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Meus Pedidos</Text>
      </View>
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item?.id ?? '' })}
          />
        )}
        keyExtractor={(item) => item?.id ?? ''}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="Nenhum pedido" message="Você ainda não fez nenhum pedido" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} colors={[theme.colors.primary]} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontWeight: 'bold' },
});
