import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, Card, Button, TextInput, Chip, Divider, FAB, Portal, Modal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { theme } from '../../theme';

interface Coupon {
  id: string;
  code: string;
  discounttype: 'percentage' | 'fixed';
  discountvalue: number;
  maxuses: number | null;
  usedcount: number;
  isactive: boolean;
  expiresat: string | null;
}

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxUses: '',
  expiresAt: '',
};

export const AdminCouponsScreen: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons');
      setCoupons(res.data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os cupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCoupons(); }, [loadCoupons]));

  const handleCreate = async () => {
    if (!form.code || !form.discountValue) {
      Alert.alert('Atenção', 'Código e valor do desconto são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/coupons', {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setForm(emptyForm);
      setShowModal(false);
      await loadCoupons();
      Alert.alert('Sucesso', 'Cupom criado com sucesso!');
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao criar cupom.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await api.put(`/coupons/${coupon.id}`, { isActive: !coupon.isactive });
      await loadCoupons();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o cupom.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remover Cupom', 'Deseja remover este cupom?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/coupons/${id}`);
            await loadCoupons();
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o cupom.');
          }
        },
      },
    ]);
  };

  const formatDiscount = (c: Coupon) =>
    c.discounttype === 'percentage'
      ? `${c.discountvalue}%`
      : `R$ ${c.discountvalue.toFixed(2)}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <Text style={styles.empty}>Carregando...</Text>
        ) : coupons.length === 0 ? (
          <Text style={styles.empty}>Nenhum cupom cadastrado.</Text>
        ) : (
          coupons.map((c) => (
            <Card key={c.id} style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <Text variant="titleMedium" style={styles.code}>{c.code}</Text>
                  <Chip
                    compact
                    style={c.isactive ? styles.activeChip : styles.inactiveChip}
                    textStyle={c.isactive ? styles.activeText : styles.inactiveText}
                  >
                    {c.isactive ? 'Ativo' : 'Inativo'}
                  </Chip>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.row}>
                  <Text variant="bodySmall" style={styles.label}>Desconto</Text>
                  <Text variant="bodyMedium">{formatDiscount(c)}</Text>
                </View>
                <View style={styles.row}>
                  <Text variant="bodySmall" style={styles.label}>Usos</Text>
                  <Text variant="bodyMedium">{c.usedcount} / {c.maxuses ?? '∞'}</Text>
                </View>
                {c.expiresat && (
                  <View style={styles.row}>
                    <Text variant="bodySmall" style={styles.label}>Validade</Text>
                    <Text variant="bodyMedium">
                      {new Date(c.expiresat).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => handleToggle(c)}>
                  {c.isactive ? 'Desativar' : 'Ativar'}
                </Button>
                <Button textColor="#EF5350" onPress={() => handleDelete(c.id)}>
                  Remover
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          dismissable={false}
          contentContainerStyle={styles.modal}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Text variant="titleLarge" style={styles.modalTitle}>Novo Cupom</Text>

              <TextInput
                label="Código *"
                value={form.code}
                onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })}
                autoCapitalize="characters"
                style={styles.input}
              />
              <TextInput
                label={form.discountType === 'percentage' ? 'Desconto (%) *' : 'Desconto (R$) *'}
                value={form.discountValue}
                onChangeText={(v) => setForm({ ...form, discountValue: v })}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <View style={styles.typeRow}>
                <Text variant="bodyMedium" style={styles.label}>Tipo:</Text>
                <Button
                  mode={form.discountType === 'percentage' ? 'contained' : 'outlined'}
                  onPress={() => setForm({ ...form, discountType: 'percentage' })}
                  compact
                  style={styles.typeBtn}
                >
                  %
                </Button>
                <Button
                  mode={form.discountType === 'fixed' ? 'contained' : 'outlined'}
                  onPress={() => setForm({ ...form, discountType: 'fixed' })}
                  compact
                  style={styles.typeBtn}
                >
                  R$
                </Button>
              </View>
              <TextInput
                label="Máx. usos (vazio = ilimitado)"
                value={form.maxUses}
                onChangeText={(v) => setForm({ ...form, maxUses: v })}
                keyboardType="number-pad"
                style={styles.input}
              />

              <View style={styles.modalActions}>
                <Button onPress={() => setShowModal(false)}>Cancelar</Button>
                <Button mode="contained" onPress={handleCreate} loading={saving} disabled={saving}>
                  Criar
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowModal(true)}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  code: { fontWeight: 'bold', fontFamily: 'monospace', fontSize: 18 },
  label: { color: '#888' },
  divider: { marginVertical: 8 },
  activeChip: { backgroundColor: '#e8f5e9' },
  inactiveChip: { backgroundColor: '#f5f5f5' },
  activeText: { color: '#2e7d32', fontSize: 11 },
  inactiveText: { color: '#757575', fontSize: 11 },
  empty: { textAlign: 'center', marginTop: 60, color: '#aaa' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: theme.colors.primary },
  modal: { backgroundColor: '#fff', margin: 20, borderRadius: 12, padding: 20 },
  modalTitle: { fontWeight: 'bold', marginBottom: 16 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  typeBtn: { flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
