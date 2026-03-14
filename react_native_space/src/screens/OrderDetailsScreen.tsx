import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, Divider, Portal, Dialog, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { StatusBadge } from '../components/StatusBadge';
import { Loading } from '../components/Loading';
import { theme } from '../theme';

type OrderDetailsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, any>;
};

const STATUSES: OrderStatus[] = ['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue', 'Cancelado'];

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const orderId = route?.params?.orderId ?? '';
  const isAdmin = user?.role === 'admin';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('Pendente');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrder(orderId);
      setOrder(data);
      setSelectedStatus(data?.status ?? 'Pendente');
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar pedido');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order?.id) return;
    setSubmitting(true);
    try {
      await apiService.updateOrderStatus(order?.id, { status: selectedStatus });
      Alert.alert('Sucesso', 'Status atualizado com sucesso');
      await loadOrder();
      setStatusDialogVisible(false);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.id || !cancelReason) {
      Alert.alert('Aviso', 'Informe o motivo do cancelamento');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.cancelOrder(order?.id, { cancelReason });
      Alert.alert('Sucesso', 'Pedido cancelado');
      await loadOrder();
      setCancelDialogVisible(false);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao cancelar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!order) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Informações do Pedido" />
          <Card.Content>
            <View style={styles.row}>
              <Text variant="bodyLarge">Número:</Text>
              <Text variant="bodyLarge" style={styles.bold}>#{order?.orderNumber?.substring(0, 8)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyLarge">Data:</Text>
              <Text variant="bodyLarge">{formatDate(order?.createdAt ?? order?.createdat ?? '')}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodyLarge">Status:</Text>
              <StatusBadge status={order?.status ?? 'Pendente'} />
            </View>
            {isAdmin && order?.user && (
              <View style={styles.row}>
                <Text variant="bodyLarge">Cliente:</Text>
                <Text variant="bodyLarge">{order?.user?.name}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Endereço de Entrega" />
          <Card.Content>
            <Text variant="bodyMedium">
              {order?.address?.street}, {order?.address?.number}
              {order?.address?.complement ? ` - ${order?.address?.complement}` : ''}
              {'\n'}
              {order?.address?.neighborhood}, {order?.address?.city}/{order?.address?.state}
              {'\n'}
              CEP: {order?.address?.zipcode}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Itens do Pedido" />
          <Card.Content>
            {order?.items?.map((item) => (
              <View key={item?.id} style={styles.itemRow}>
                <Image source={{ uri: item?.product?.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge">{item?.product?.name}</Text>
                  <Text variant="bodyMedium" style={styles.itemDetails}>
                    {item?.quantity}x {formatCurrency(item?.price ?? 0)}
                  </Text>
                </View>
                <Text variant="titleMedium" style={styles.itemTotal}>
                  {formatCurrency((item?.price ?? 0) * (item?.quantity ?? 0))}
                </Text>
              </View>
            ))}
            <Divider style={styles.divider} />
            <View style={styles.totalRow}>
              <Text variant="titleLarge">Total:</Text>
              <Text variant="titleLarge" style={styles.totalAmount}>{formatCurrency(order?.totalAmount ?? order?.totalamount ?? 0)}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Pagamento e Observações" />
          <Card.Content>
            <View style={styles.row}>
              <Text variant="bodyLarge">Pagamento:</Text>
              <Text variant="bodyLarge" style={styles.bold}>{order?.paymentMethod ?? order?.paymentmethod ?? 'Não informado'}</Text>
            </View>
            {order?.observations && (
              <View style={styles.observationsContainer}>
                <Text variant="bodyLarge">Observações:</Text>
                <Text variant="bodyMedium">{order?.observations}</Text>
              </View>
            )}
            {(order?.cancelReason ?? order?.cancelreason) && (
              <View style={styles.observationsContainer}>
                <Text variant="bodyLarge" style={styles.errorText}>Motivo do Cancelamento:</Text>
                <Text variant="bodyMedium" style={styles.errorText}>{order?.cancelReason ?? order?.cancelreason}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {isAdmin && order?.status !== 'Cancelado' && order?.status !== 'Entregue' && (
          <View style={styles.adminActions}>
            <Button mode="contained" onPress={() => setStatusDialogVisible(true)} style={styles.actionButton}>
              Atualizar Status
            </Button>
            <Button mode="outlined" onPress={() => setCancelDialogVisible(true)} style={styles.actionButton} textColor={theme.colors.error}>
              Cancelar Pedido
            </Button>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={statusDialogVisible} onDismiss={() => setStatusDialogVisible(false)}>
          <Dialog.Title>Atualizar Status</Dialog.Title>
          <Dialog.Content>
            {STATUSES.map((status) => (
              <Button
                key={status}
                mode={selectedStatus === status ? 'contained' : 'outlined'}
                onPress={() => setSelectedStatus(status)}
                style={styles.statusButton}
              >
                {status}
              </Button>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleUpdateStatus} loading={submitting}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>Cancelar Pedido</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Motivo do cancelamento"
              value={cancelReason}
              onChangeText={setCancelReason}
              mode="outlined"
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>Voltar</Button>
            <Button onPress={handleCancelOrder} loading={submitting} textColor={theme.colors.error}>Cancelar Pedido</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  card: { margin: 16, marginBottom: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bold: { fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemDetails: { color: '#757575', marginTop: 4 },
  itemTotal: { fontWeight: 'bold' },
  divider: { marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalAmount: { fontWeight: 'bold', color: theme.colors.primary },
  observationsContainer: { marginTop: 12 },
  errorText: { color: theme.colors.error },
  adminActions: { padding: 16 },
  actionButton: { marginBottom: 12 },
  statusButton: { marginBottom: 8 },
});
