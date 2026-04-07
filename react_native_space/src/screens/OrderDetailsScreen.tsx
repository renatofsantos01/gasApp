import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider, Portal, Dialog, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Order, OrderStatus, OrderActivity } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { StatusBadge } from '../components/StatusBadge';
import { Loading } from '../components/Loading';
import { theme } from '../theme';

type OrderDetailsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, any>;
};

const STATUSES: OrderStatus[] = ['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue', 'Cancelado'];
const CANCEL_WINDOW_MINUTES = 15;

const getCancelDeadline = (createdAt: string): Date => {
  const date = new Date(createdAt);
  date.setMinutes(date.getMinutes() + CANCEL_WINDOW_MINUTES);
  return date;
};

const isWithinCancelWindow = (createdAt: string): boolean => new Date() < getCancelDeadline(createdAt);

const formatDeadlineTime = (createdAt: string): string =>
  getCancelDeadline(createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const orderId = route?.params?.orderId ?? '';
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'info' | 'activities'>('info');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('Pendente');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());
  const [activities, setActivities] = useState<OrderActivity[]>([]);
  const [seenCount, setSeenCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const hasNewActivity = activities.length > seenCount;

  useEffect(() => { loadOrder(); }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadActivities = async () => {
    try {
      const data = await apiService.getOrderActivities(orderId);
      setActivities(data);
    } catch (_) {}
  };

  useEffect(() => {
    if (!orderId) return;
    loadActivities();
    const poll = setInterval(loadActivities, 15000);
    return () => clearInterval(poll);
  }, [orderId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await apiService.addOrderActivity(orderId, newMessage.trim());
      setNewMessage('');
      await loadActivities();
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível enviar a observação');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatActivityDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

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

  const createdAt = order?.createdAt ?? order?.createdat ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Informações
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activities' && styles.tabActive]}
          onPress={() => { setActiveTab('activities'); setSeenCount(activities.length); }}
        >
          <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>
            Atividades
          </Text>
          {activeTab !== 'activities' && hasNewActivity && (
            <View style={styles.badgeNew}>
              <Text style={styles.badgeText}>● novo</Text>
            </View>
          )}
          {activeTab !== 'activities' && !hasNewActivity && activities.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activities.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'info' ? (
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

          {!isAdmin && order?.status === 'Pendente' && (
            <View style={styles.clientCancelContainer}>
              {isWithinCancelWindow(createdAt) ? (
                <>
                  <Text variant="bodySmall" style={styles.cancelHint}>
                    Você pode cancelar seu pedido até às {formatDeadlineTime(createdAt)}
                  </Text>
                  <Button mode="outlined" textColor={theme.colors.error} style={styles.actionButton} onPress={() => setCancelDialogVisible(true)}>
                    Cancelar Pedido
                  </Button>
                </>
              ) : (
                <Text variant="bodySmall" style={styles.cancelExpired}>
                  O prazo para cancelamento encerrou às {formatDeadlineTime(createdAt)}
                </Text>
              )}
            </View>
          )}

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
      ) : (
        <View style={styles.activitiesContainer}>
          <ScrollView style={styles.activitiesList} contentContainerStyle={styles.activitiesContent}>
            {activities.length === 0 ? (
              <Text variant="bodySmall" style={styles.noActivity}>Nenhuma atividade ainda.</Text>
            ) : (
              activities.map((a) => (
                <View key={a.id} style={[styles.activityItem, a.type === 'message' && styles.activityItemMessage]}>
                  <Text style={styles.activityDate}>{formatActivityDate(a.createdAt)}</Text>
                  <Text style={[styles.activityContent, a.type === 'message' && styles.activityMessage]}>
                    {a.type === 'message' && a.user ? `${a.user.name}: ` : ''}{a.content}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.messageBox}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              mode="outlined"
              placeholder="Adicionar observação..."
              style={styles.messageInput}
              dense
              multiline
            />
            <Button
              mode="contained"
              onPress={handleSendMessage}
              loading={sendingMessage}
              disabled={sendingMessage || !newMessage.trim()}
              style={styles.sendButton}
            >
              Enviar
            </Button>
          </View>
        </View>
      )}

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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: { fontSize: 14, color: '#999' },
  tabTextActive: { color: theme.colors.primary, fontWeight: '600' },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeNew: {
    backgroundColor: '#E53935',
    borderRadius: 10,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  // Info tab
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
  clientCancelContainer: { padding: 16 },
  actionButton: { marginBottom: 12 },
  statusButton: { marginBottom: 8 },
  cancelHint: { color: '#555', marginBottom: 10, textAlign: 'center' },
  cancelExpired: { color: '#999', textAlign: 'center', fontStyle: 'italic' },

  // Activities tab
  activitiesContainer: { flex: 1 },
  activitiesList: { flex: 1 },
  activitiesContent: { padding: 16, gap: 8 },
  noActivity: { color: '#999', textAlign: 'center', marginTop: 32 },
  activityItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
  },
  activityItemMessage: {
    backgroundColor: '#EEF4FF',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  activityDate: { color: '#999', fontSize: 11, marginBottom: 2 },
  activityContent: { color: '#555', fontSize: 13 },
  activityMessage: { color: '#222', fontWeight: '500' },
  messageBox: {
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  messageInput: { backgroundColor: '#fff' },
  sendButton: {},
});
