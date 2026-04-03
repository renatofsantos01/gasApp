import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, Linking, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, api } from '../../services/api';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/format';
import { EmptyState } from '../../components/EmptyState';
import { theme } from '../../theme';
import { DelivererStackParamList } from '../../navigation/DelivererNavigator';

const SEEN_ORDERS_KEY = 'deliverer_seen_orders';

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
  const [available, setAvailable] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const loadSeenIds = async () => {
    try {
      const raw = await AsyncStorage.getItem(SEEN_ORDERS_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      seenIdsRef.current = new Set(ids);
    } catch (_) {}
  };

  const markAsSeen = async (orderId: string) => {
    seenIdsRef.current.add(orderId);
    setNewOrderIds((prev) => { const next = new Set(prev); next.delete(orderId); return next; });
    try {
      await AsyncStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...seenIdsRef.current]));
    } catch (_) {}
  };

  const loadDeliveries = async () => {
    try {
      const data = await apiService.getMyDeliveries();
      const unseen = data.filter((o) => !seenIdsRef.current.has(o.id)).map((o) => o.id);
      setNewOrderIds(new Set(unseen));
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
      loadSeenIds().then(loadDeliveries);
      const interval = setInterval(loadDeliveries, 15000);
      return () => clearInterval(interval);
    }, [])
  );

  // Para o rastreamento quando o componente desmonta
  useEffect(() => {
    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos da sua localização para atribuir pedidos próximos a você.',
      );
      return false;
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50, // atualiza a cada 50 metros
        timeInterval: 30000,  // ou a cada 30 segundos
      },
      async (location) => {
        try {
          await api.patch('/auth/location', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (e) {
          console.warn('[GPS] Falha ao enviar localização:', e);
        }
      },
    );

    return true;
  };

  const stopTracking = () => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  };

  const toggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      if (!available) {
        const started = await startTracking();
        if (!started) return;
        await api.patch('/auth/availability', { available: true });
        setAvailable(true);
      } else {
        stopTracking();
        await api.patch('/auth/availability', { available: false });
        setAvailable(false);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar sua disponibilidade.');
      console.error('[Jornada]', e);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const openInMaps = (item: Order) => {
    const addr = item.address;
    if (!addr) return;
    const query = encodeURIComponent(
      `${addr.street}, ${addr.number}${addr.complement ? ` ${addr.complement}` : ''}, ${addr.neighborhood}, ${addr.city} - ${addr.state}, ${addr.zipcode}`
    );

    const options = [
      { text: 'Google Maps', onPress: () => Linking.openURL(`https://maps.google.com/?q=${query}`) },
      { text: 'Waze', onPress: () => Linking.openURL(`https://waze.com/ul?q=${query}&navigate=yes`) },
      ...(Platform.OS === 'ios'
        ? [{ text: 'Apple Maps', onPress: () => Linking.openURL(`maps://maps.apple.com/?q=${query}`) }]
        : []),
    ];

    Alert.alert(
      'Navegar até o endereço',
      'Escolha o app de navegação:',
      [
        ...options.map((o) => ({ text: o.text, onPress: o.onPress })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const isNew = newOrderIds.has(item.id);
    return (
    <Card
      style={[styles.card, isNew && styles.cardNew]}
      onPress={() => { markAsSeen(item.id); navigation.navigate('DelivererOrderDetails', { order: item }); }}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.orderNumRow}>
            <Text variant="titleMedium" style={styles.orderNum}>
              Pedido #{item.id.substring(0, 8).toUpperCase()}
            </Text>
            {isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NOVO</Text>
              </View>
            )}
          </View>
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
        <TouchableOpacity onPress={() => openInMaps(item)} activeOpacity={0.6} style={styles.addressRow}>
          <Text variant="bodySmall" style={styles.address}>
            {item.address?.street}, {item.address?.number} — {item.address?.neighborhood}
          </Text>
          <Text variant="bodySmall" style={styles.addressNav}>⬡ GPS</Text>
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.total}>
          {formatCurrency(item.totalAmount)}
        </Text>
      </Card.Content>
    </Card>
  );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text variant="headlineMedium" style={styles.title}>Minhas Entregas</Text>
        <Button
          mode="contained"
          onPress={toggleAvailability}
          loading={togglingAvailability}
          disabled={togglingAvailability}
          icon={available ? 'stop-circle' : 'play-circle'}
          style={[styles.journeyBtn, available ? styles.journeyBtnStop : styles.journeyBtnStart]}
          textColor="#fff"
          compact
        >
          {available ? 'Encerrar Jornada' : 'Iniciar Jornada'}
        </Button>
      </View>

      {available && (
        <View style={styles.statusBar}>
          <View style={styles.statusDot} />
          <Text variant="bodySmall" style={styles.statusText}>
            Disponível — recebendo pedidos próximos
          </Text>
        </View>
      )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontWeight: 'bold' },
  journeyBtn: { borderRadius: 20 },
  journeyBtnStart: { backgroundColor: '#66BB6A' },
  journeyBtnStop: { backgroundColor: '#EF5350' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#66BB6A',
  },
  statusText: { color: '#2E7D32', fontWeight: '600' },
  list: { padding: 16 },
  card: { marginBottom: 12 },
  cardNew: {
    borderWidth: 2,
    borderColor: '#66BB6A',
  },
  orderNumRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newBadge: {
    backgroundColor: '#66BB6A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNum: { fontWeight: 'bold' },
  clientName: { fontWeight: '600', marginBottom: 2 },
  phone: { color: '#666', marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  address: { color: '#666', flex: 1 },
  addressNav: { color: theme.colors.primary, fontWeight: '600' },
  total: { color: theme.colors.primary, fontWeight: 'bold' },
});
