import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Divider, TextInput, ActivityIndicator, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import { apiService } from '../../services/api';
import { Address } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { theme } from '../../theme';

// Step indicator component
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Produtos', 'Pagamento', 'Confirmar'];
  return (
    <View style={stepStyles.container}>
      {steps.map((label, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <React.Fragment key={step}>
            {index > 0 && <View style={[stepStyles.line, isDone && stepStyles.lineDone]} />}
            <View style={stepStyles.stepWrapper}>
              <View style={[stepStyles.circle, isActive && stepStyles.circleActive, isDone && stepStyles.circleDone]}>
                <Text style={[stepStyles.circleText, (isActive || isDone) && stepStyles.circleTextActive]}>
                  {isDone ? '✓' : step}
                </Text>
              </View>
              <Text style={[stepStyles.label, isActive && stepStyles.labelActive]}>{label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  stepWrapper: { alignItems: 'center' },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: { backgroundColor: theme.colors.primary },
  circleDone: { backgroundColor: '#4CAF50' },
  circleText: { fontSize: 13, fontWeight: 'bold', color: '#9E9E9E' },
  circleTextActive: { color: '#fff' },
  label: { fontSize: 11, color: '#9E9E9E', marginTop: 4 },
  labelActive: { color: theme.colors.primary, fontWeight: '600' },
  line: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginBottom: 18 },
  lineDone: { backgroundColor: '#4CAF50' },
});

export const CheckoutScreen: React.FC<any> = ({ navigation }) => {
  const { items, total, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);

  // Data
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [observations, setObservations] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [changeFor, setChangeFor] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const finalTotal = Math.max(0, total - discountAmount);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await apiService.getAddresses();
      setAddresses(data ?? []);
      const def = data?.find((a) => a.isdefault);
      setSelectedAddressId(def?.id ?? data?.[0]?.id ?? '');
    } catch {
      Alert.alert('Erro', 'Erro ao carregar endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const result = await apiService.validateCoupon(couponInput.trim(), total);
      if (result.valid) {
        setCouponCode(couponInput.trim().toUpperCase());
        setDiscountAmount(result.discountAmount);
        setCouponMessage(`✓ Cupom aplicado! Desconto de ${formatCurrency(result.discountAmount)}`);
      } else {
        setCouponCode('');
        setDiscountAmount(0);
        setCouponMessage(result.message ?? 'Cupom inválido');
      }
    } catch {
      setCouponMessage('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setDiscountAmount(0);
    setCouponMessage('');
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de finalizar.');
      navigation.goBack();
      return;
    }
    if (!selectedAddressId) {
      Alert.alert('Aviso', 'Selecione um endereço');
      return;
    }
    setSubmitting(true);
    try {
      const order = await apiService.createOrder({
        addressId: selectedAddressId,
        paymentMethod: paymentMethod as any,
        observations: observations || undefined,
        couponCode: couponCode || undefined,
        cpfCnpj: cpfCnpj.replace(/\D/g, '') || undefined,
        changeFor: paymentMethod === 'Dinheiro' && changeFor ? parseFloat(changeFor) : undefined,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      clearCart();
      Alert.alert('Pedido realizado!', 'Seu pedido foi enviado com sucesso.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'OrderDetails', params: { orderId: order.id } }],
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message ?? 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const formatAddress = (addr: Address) =>
    `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;

  if (loading) return <Loading message="Carregando..." />;

  if (addresses.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.emptyContainer}>
          <Text variant="titleLarge" style={styles.emptyTitle}>
            Nenhum endereço cadastrado
          </Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Cadastre um endereço para continuar
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('AddressesList')}>
            Cadastrar Endereço
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>

      {/* Address bar - always visible */}
      <TouchableOpacity
        style={styles.addressBar}
        onPress={() => navigation.navigate('AddressesList')}
      >
        <View style={styles.addressBarContent}>
          <Text style={styles.addressBarLabel}>📍 Entregar em</Text>
          <Text style={styles.addressBarText} numberOfLines={1}>
            {selectedAddress ? formatAddress(selectedAddress) : 'Selecionar endereço'}
          </Text>
        </View>
        <Text style={styles.addressBarChange}>Alterar</Text>
      </TouchableOpacity>

      <StepIndicator currentStep={currentStep} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STEP 1 - Products + Coupon */}
        {currentStep === 1 && (
          <View>
            <Card style={styles.card}>
              <Card.Title title="Passo 1 — Produtos" titleVariant="titleMedium" />
              <Card.Content>
                {items.map((item) => (
                  <View key={item.product.id} style={styles.orderItem}>
                    <Text variant="bodyMedium">
                      {item.quantity}x {item.product.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.itemPrice}>
                      {formatCurrency(item.product.price * item.quantity)}
                    </Text>
                  </View>
                ))}
                <Divider style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text variant="titleMedium">Subtotal:</Text>
                  <Text variant="titleMedium">{formatCurrency(total)}</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Cupom de Desconto" titleVariant="titleMedium" />
              <Card.Content>
                {couponCode ? (
                  <View>
                    <Text style={styles.couponSuccess}>{couponMessage}</Text>
                    <Button mode="outlined" onPress={handleRemoveCoupon} style={{ marginTop: 8 }}>
                      Remover Cupom
                    </Button>
                  </View>
                ) : (
                  <View>
                    <View style={styles.couponRow}>
                      <TextInput
                        mode="outlined"
                        placeholder="Digite o código"
                        value={couponInput}
                        onChangeText={(t) => setCouponInput(t.toUpperCase())}
                        style={styles.couponInput}
                        autoCapitalize="characters"
                      />
                      <Button
                        mode="contained"
                        onPress={handleApplyCoupon}
                        loading={couponLoading}
                        disabled={couponLoading || !couponInput.trim()}
                        style={styles.couponButton}
                      >
                        Aplicar
                      </Button>
                    </View>
                    {couponMessage ? (
                      <Text style={styles.couponError}>{couponMessage}</Text>
                    ) : null}
                  </View>
                )}
              </Card.Content>
            </Card>

            <View style={styles.footer}>
              <Button
                mode="contained"
                onPress={() => setCurrentStep(2)}
                contentStyle={styles.buttonContent}
              >
                Próximo — Pagamento
              </Button>
            </View>
          </View>
        )}

        {/* STEP 2 - Payment */}
        {currentStep === 2 && (
          <View>
            <Card style={styles.card}>
              <Card.Title title="Passo 2 — Pagamento" titleVariant="titleMedium" />
              <Card.Content>
                <Text variant="bodyMedium" style={styles.paymentNote}>
                  O pagamento será realizado no momento da entrega.
                </Text>
                <RadioButton.Group onValueChange={(v) => { setPaymentMethod(v); setChangeFor(''); }} value={paymentMethod}>
                  <RadioButton.Item label="💵 Dinheiro na entrega" value="Dinheiro" />
                  <RadioButton.Item label="📱 Pix na entrega" value="Pix" />
                  <RadioButton.Item label="💳 Cartão na entrega" value="Cartão" />
                </RadioButton.Group>
                {paymentMethod === 'Dinheiro' && (
                  <View style={{ marginTop: 8 }}>
                    <Text variant="labelMedium" style={styles.paymentNote}>
                      Troco para quanto? (opcional)
                    </Text>
                    <TextInput
                      mode="outlined"
                      placeholder={`Ex: ${formatCurrency(Math.ceil(finalTotal / 10) * 10)}`}
                      value={changeFor}
                      onChangeText={setChangeFor}
                      keyboardType="numeric"
                      left={<TextInput.Affix text="R$" />}
                      style={{ marginTop: 4 }}
                    />
                    {changeFor && parseFloat(changeFor) > 0 && parseFloat(changeFor) < finalTotal && (
                      <Text style={{ color: '#F44336', fontSize: 12, marginTop: 4 }}>
                        Valor deve ser maior que o total de {formatCurrency(finalTotal)}
                      </Text>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>

            <View style={styles.footer}>
              <Button
                mode="outlined"
                onPress={() => setCurrentStep(1)}
                style={{ marginBottom: 8 }}
              >
                Voltar
              </Button>
              <Button
                mode="contained"
                onPress={() => setCurrentStep(3)}
                contentStyle={styles.buttonContent}
              >
                Próximo — Confirmar
              </Button>
            </View>
          </View>
        )}

        {/* STEP 3 - Confirm */}
        {currentStep === 3 && (
          <View>
            <Card style={styles.card}>
              <Card.Title title="Passo 3 — Confirmar Pedido" titleVariant="titleMedium" />
              <Card.Content>
                <Text variant="labelMedium" style={styles.sectionLabel}>
                  RESUMO
                </Text>
                {items.map((item) => (
                  <View key={item.product.id} style={styles.orderItem}>
                    <Text variant="bodySmall">
                      {item.quantity}x {item.product.name}
                    </Text>
                    <Text variant="bodySmall">
                      {formatCurrency(item.product.price * item.quantity)}
                    </Text>
                  </View>
                ))}
                <Divider style={styles.divider} />

                {discountAmount > 0 && (
                  <>
                    <View style={styles.totalRow}>
                      <Text variant="bodyMedium">Subtotal:</Text>
                      <Text variant="bodyMedium">{formatCurrency(total)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text variant="bodyMedium" style={{ color: '#4CAF50' }}>
                        Desconto ({couponCode}):
                      </Text>
                      <Text variant="bodyMedium" style={{ color: '#4CAF50' }}>
                        -{formatCurrency(discountAmount)}
                      </Text>
                    </View>
                    <Divider style={styles.divider} />
                  </>
                )}

                <View style={styles.totalRow}>
                  <Text variant="titleLarge">Total:</Text>
                  <Text variant="titleLarge" style={styles.totalAmount}>
                    {formatCurrency(finalTotal)}
                  </Text>
                </View>

                <Divider style={styles.divider} />
                <Text variant="labelMedium" style={styles.sectionLabel}>
                  PAGAMENTO
                </Text>
                <Text variant="bodyMedium">{paymentMethod} na entrega</Text>
                {paymentMethod === 'Dinheiro' && changeFor && parseFloat(changeFor) >= finalTotal && (
                  <Text variant="bodyMedium" style={{ color: '#4CAF50', marginTop: 2 }}>
                    Troco para {formatCurrency(parseFloat(changeFor))} — levar {formatCurrency(parseFloat(changeFor) - finalTotal)} de troco
                  </Text>
                )}

                <Divider style={styles.divider} />
                <Text variant="labelMedium" style={styles.sectionLabel}>
                  CPF/CNPJ NA NOTA (opcional)
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={cpfCnpj}
                  onChangeText={setCpfCnpj}
                  keyboardType="numeric"
                  style={styles.input}
                />

                <Divider style={styles.divider} />
                <Text variant="labelMedium" style={styles.sectionLabel}>
                  OBSERVAÇÕES (opcional)
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Ex: Deixar na portaria"
                  value={observations}
                  onChangeText={setObservations}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            <View style={styles.footer}>
              <Button
                mode="outlined"
                onPress={() => setCurrentStep(2)}
                style={{ marginBottom: 8 }}
              >
                Voltar
              </Button>
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontWeight: 'bold' },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addressBarContent: { flex: 1, marginRight: 12 },
  addressBarLabel: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressBarText: { fontSize: 13, color: '#333' },
  addressBarChange: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  scrollContent: { paddingBottom: 24 },
  card: { margin: 16, marginBottom: 0 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemPrice: { fontWeight: '600' },
  divider: { marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalAmount: { fontWeight: 'bold', color: theme.colors.primary },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  couponInput: { flex: 1 },
  couponButton: { marginTop: 6 },
  couponSuccess: { color: '#4CAF50', fontWeight: '600' },
  couponError: { color: '#F44336', marginTop: 6, fontSize: 13 },
  paymentNote: { color: '#757575', marginBottom: 12 },
  sectionLabel: {
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: { marginTop: 4 },
  footer: { padding: 16 },
  buttonContent: { paddingVertical: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: { fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  emptyMessage: { color: '#757575', textAlign: 'center', marginBottom: 24 },
});
