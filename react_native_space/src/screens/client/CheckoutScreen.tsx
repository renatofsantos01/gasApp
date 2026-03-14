import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, Button, Card, RadioButton, TextInput, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ClientTabParamList } from '../../navigation/ClientNavigator';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { Address, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { theme } from '../../theme';

type CheckoutNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ClientTabParamList, 'Checkout'>,
  BottomTabNavigationProp<ClientTabParamList>
>;

type CheckoutScreenProps = {
  navigation: CheckoutNavigationProp;
};

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { items, total, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAddresses();
      setAddresses(data ?? []);
      const defaultAddress = data?.find((a) => a?.isdefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress?.id ?? '');
      } else if ((data?.length ?? 0) > 0) {
        setSelectedAddressId(data?.[0]?.id ?? '');
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddressId) {
      Alert.alert('Aviso', 'Selecione um endereço de entrega');
      return;
    }

    if ((items?.length ?? 0) === 0) {
      Alert.alert('Aviso', 'Carrinho vazio');
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiService.createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        observations: observations || undefined,
        items: items?.map((item) => ({
          productId: item?.product?.id ?? '',
          quantity: item?.quantity ?? 0,
        })) ?? [],
      });

      clearCart();

      Alert.alert(
        'Sucesso!',
        'Pedido realizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('OrderDetails', { orderId: order?.id ?? '' });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      let message = 'Erro ao criar pedido. Tente novamente.';
      
      if (error?.response?.data?.message) {
        message = error?.response?.data?.message;
      } else if (error?.message) {
        message = error?.message;
      }
      
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatAddress = (addr: Address): string => {
    return `${addr?.street ?? ''}, ${addr?.number ?? ''}${
      addr?.complement ? ` - ${addr?.complement}` : ''
    } - ${addr?.neighborhood ?? ''}, ${addr?.city ?? ''}/${addr?.state ?? ''} - ${addr?.zipcode ?? ''}`;
  };

  if (loading) {
    return <Loading message="Carregando..." />;
  }

  if ((addresses?.length ?? 0) === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Finalizar Pedido
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text variant="titleLarge" style={styles.emptyTitle}>
            Nenhum endereço cadastrado
          </Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Cadastre um endereço para continuar
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddressesList')}
            style={styles.addAddressButton}
          >
            Cadastrar Endereço
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Finalizar Pedido
            </Text>
          </View>

          <Card style={styles.card}>
            <Card.Title title="Resumo do Pedido" titleVariant="titleLarge" />
            <Card.Content>
              {items?.map((item) => (
                <View key={item?.product?.id} style={styles.orderItem}>
                  <Text variant="bodyMedium">
                    {item?.quantity}x {item?.product?.name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.itemPrice}>
                    {formatCurrency((item?.product?.price ?? 0) * (item?.quantity ?? 0))}
                  </Text>
                </View>
              ))}
              <Divider style={styles.divider} />
              <View style={styles.totalRow}>
                <Text variant="titleLarge">Total:</Text>
                <Text variant="titleLarge" style={styles.totalAmount}>
                  {formatCurrency(total ?? 0)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Endereço de Entrega" titleVariant="titleLarge" />
            <Card.Content>
              <RadioButton.Group
                onValueChange={(value) => setSelectedAddressId(value)}
                value={selectedAddressId}
              >
                {addresses?.map((addr) => (
                  <View key={addr?.id} style={styles.addressOption}>
                    <RadioButton.Item
                      label={formatAddress(addr)}
                      value={addr?.id ?? ''}
                      style={styles.radioItem}
                    />
                    {addr?.isdefault && (
                      <Text variant="bodySmall" style={styles.defaultBadge}>
                        Padrão
                      </Text>
                    )}
                  </View>
                ))}
              </RadioButton.Group>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('AddressesList')}
                style={styles.manageAddressButton}
              >
                Gerenciar Endereços
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Forma de Pagamento" titleVariant="titleLarge" />
            <Card.Content>
              <RadioButton.Group
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                value={paymentMethod}
              >
                <RadioButton.Item label="💵 Dinheiro" value="Dinheiro" />
                <RadioButton.Item label="📱 Pix" value="Pix" />
                <RadioButton.Item label="💳 Cartão" value="Cartão" />
              </RadioButton.Group>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Observações" titleVariant="titleLarge" />
            <Card.Content>
              <TextInput
                mode="outlined"
                placeholder="Ex: Deixar na portaria"
                value={observations}
                onChangeText={setObservations}
                multiline
                numberOfLines={3}
              />
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              contentStyle={styles.buttonContent}
            >
              Confirmar Pedido
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemPrice: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  addressOption: {
    marginBottom: 8,
  },
  radioItem: {
    paddingVertical: 4,
  },
  defaultBadge: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: 40,
    marginTop: -8,
    marginBottom: 8,
  },
  manageAddressButton: {
    marginTop: 16,
  },
  footer: {
    padding: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  addAddressButton: {
    marginTop: 8,
  },
});
