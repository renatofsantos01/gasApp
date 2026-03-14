import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { StatusBadge } from './StatusBadge';
import { theme } from '../theme';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  showCustomer?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, showCustomer = false }) => {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.orderNumber}>
            Pedido #{order?.orderNumber?.substring(0, 8) ?? ''}
          </Text>
          <StatusBadge status={order?.status ?? 'Pendente'} size="small" />
        </View>
        <Text variant="bodySmall" style={styles.date}>
          {formatDate(order?.createdat ?? '')}
        </Text>
        {showCustomer && order?.user && (
          <Text variant="bodyMedium" style={styles.customer}>
            Cliente: {order?.user?.name ?? ''}
          </Text>
        )}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.items}>
            {order?.items?.length ?? 0} {(order?.items?.length ?? 0) === 1 ? 'item' : 'itens'}
          </Text>
          <Text variant="titleLarge" style={styles.total}>
            {formatCurrency(order?.totalamount ?? 0)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontWeight: 'bold',
  },
  date: {
    color: '#757575',
    marginBottom: 8,
  },
  customer: {
    marginBottom: 8,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  items: {
    color: '#757575',
  },
  total: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
