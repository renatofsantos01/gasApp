import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, Chip, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DelivererStackParamList } from '../../navigation/DelivererNavigator';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<DelivererStackParamList, 'DelivererOrderDetails'>;

const STATUS_COLORS: Record<string, string> = {
  Pendente: '#FFA726',
  'Em Preparo': '#42A5F5',
  'Saiu para Entrega': '#AB47BC',
  Entregue: '#66BB6A',
  Cancelado: '#EF5350',
};

export const DelivererOrderDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const [order, setOrder] = useState(route.params.order);
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    Alert.alert(
      'Confirmar',
      `Marcar pedido como "${newStatus}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.updateDeliveryStatus(order.id, newStatus);
              setOrder((prev) => ({ ...prev, status: newStatus as any }));
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível atualizar o status');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openInMaps = () => {
    const addr = order.address;
    if (!addr) return;
    const query = encodeURIComponent(
      `${addr.street}, ${addr.number}${addr.complement ? ` ${addr.complement}` : ''}, ${addr.neighborhood}, ${addr.city} - ${addr.state}, ${addr.zipcode}`
    );

    const options: { text: string; onPress: () => void }[] = [
      {
        text: 'Google Maps',
        onPress: () => Linking.openURL(`https://maps.google.com/?q=${query}`),
      },
      {
        text: 'Waze',
        onPress: () => Linking.openURL(`https://waze.com/ul?q=${query}&navigate=yes`),
      },
    ];

    if (Platform.OS === 'ios') {
      options.push({
        text: 'Apple Maps',
        onPress: () => Linking.openURL(`maps://maps.apple.com/?q=${query}`),
      });
    }

    Alert.alert(
      'Navegar até o endereço',
      'Escolha o app de navegação:',
      [
        ...options.map((o) => ({ text: o.text, onPress: o.onPress })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  };

  const canMarkOutForDelivery =
    order.status === 'Pendente' || order.status === 'Em Preparo';
  const canMarkDelivered = order.status === 'Saiu para Entrega';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="headlineSmall" style={styles.title}>
            Pedido #{order.id.substring(0, 8).toUpperCase()}
          </Text>
          <Chip
            style={{ backgroundColor: STATUS_COLORS[order.status] ?? '#999' }}
            textStyle={{ color: 'white' }}
          >
            {order.status}
          </Chip>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Cliente</Text>
          <Text variant="bodyLarge">{order.user?.name ?? '—'}</Text>
          {order.user?.phone ? (
            <Text variant="bodyMedium" style={styles.secondary}>{order.user.phone}</Text>
          ) : null}
        </View>

        <Divider style={styles.divider} />

        {/* Endereço */}
        <TouchableOpacity style={styles.section} onPress={openInMaps} activeOpacity={0.7}>
          <View style={styles.addressHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Endereço de Entrega</Text>
            <IconButton icon="navigation" size={20} iconColor={theme.colors.primary} style={styles.navIcon} />
          </View>
          <Text variant="bodyMedium">
            {order.address?.street}, {order.address?.number}
            {order.address?.complement ? ` — ${order.address.complement}` : ''}
          </Text>
          <Text variant="bodyMedium">
            {order.address?.neighborhood} — {order.address?.city}/{order.address?.state}
          </Text>
          <Text variant="bodyMedium">CEP: {order.address?.zipcode}</Text>
          <Text variant="bodySmall" style={styles.tapHint}>Toque para navegar</Text>
        </TouchableOpacity>

        <Divider style={styles.divider} />

        {/* Itens */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Itens</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text variant="bodyMedium" style={styles.itemName}>
                {item.quantity}x {item.product?.name}
              </Text>
              <Text variant="bodyMedium" style={styles.itemPrice}>
                {formatCurrency((item.price ?? 0) * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text variant="titleLarge">Total</Text>
          <Text variant="titleLarge" style={styles.totalAmount}>
            {formatCurrency(order.totalAmount)}
          </Text>
        </View>

        <Text variant="bodyMedium" style={styles.secondary}>
          Pagamento: {order.paymentMethod}
        </Text>

        {order.observations ? (
          <View style={styles.section}>
            <Text variant="bodySmall" style={styles.secondary}>
              Observações: {order.observations}
            </Text>
          </View>
        ) : null}

        {/* Ações */}
        {canMarkOutForDelivery && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus('Saiu para Entrega')}
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            Saiu para Entrega
          </Button>
        )}

        {canMarkDelivered && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus('Entregue')}
            loading={loading}
            disabled={loading}
            style={[styles.actionButton, styles.deliveredButton]}
            contentStyle={styles.buttonContent}
          >
            Marcar como Entregue
          </Button>
        )}

        {order.status === 'Entregue' && (
          <View style={styles.deliveredBadge}>
            <Text variant="titleMedium" style={styles.deliveredText}>
              Entregue ✓
            </Text>
          </View>
        )}

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Voltar
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontWeight: 'bold' },
  section: { marginVertical: 8 },
  sectionTitle: { fontWeight: '600', marginBottom: 6, color: theme.colors.primary, flex: 1 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navIcon: { margin: 0, padding: 0 },
  tapHint: { color: theme.colors.primary, marginTop: 4, fontStyle: 'italic' },
  secondary: { color: '#666', marginTop: 2 },
  divider: { marginVertical: 12 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: { flex: 1 },
  itemPrice: { fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalAmount: { fontWeight: 'bold', color: theme.colors.primary },
  actionButton: { marginTop: 24 },
  deliveredButton: { backgroundColor: '#66BB6A' },
  buttonContent: { paddingVertical: 8 },
  deliveredBadge: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveredText: { color: '#2E7D32', fontWeight: 'bold' },
  backButton: { marginTop: 12 },
});
