import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { DashboardStats } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { OrderCard } from '../../components/OrderCard';
import { theme } from '../../theme';

export const AdminDashboardScreen: React.FC<any> = ({ navigation }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await apiService.getDashboard();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} colors={[theme.colors.primary]} />}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Bem-vindo, Administrador</Text>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.statValue}>{stats?.todayOrders ?? 0}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>Pedidos Hoje</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.statValue}>{stats?.pendingOrders ?? 0}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>Pendentes</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.statValue}>{stats?.inProgressOrders ?? 0}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>Em Andamento</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.statValue}>{formatCurrency(stats?.todayRevenue ?? 0)}</Text>
              <Text variant="bodyMedium" style={styles.statLabel}>Faturamento Hoje</Text>
            </Card.Content>
          </Card>
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>Pedidos Recentes</Text>
        {stats?.recentOrders?.map((order) => (
          <OrderCard key={order?.id} order={order} onPress={() => navigation.navigate('OrderDetails', { orderId: order?.id })} showCustomer />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16 },
  title: { fontWeight: 'bold' },
  subtitle: { color: '#757575', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard: { width: '48%', margin: '1%' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
  statLabel: { color: '#757575', marginTop: 4 },
  sectionTitle: { padding: 16, fontWeight: 'bold' },
});
