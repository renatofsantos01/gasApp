import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, TextInput, FAB, Portal, Modal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { theme } from '../../theme';

interface Deliverer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const emptyForm = { name: '', email: '', password: '', phone: '' };

export const AdminDeliverersScreen: React.FC = () => {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/deliverers');
      setDeliverers(res.data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os entregadores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (d: Deliverer) => {
    setEditingId(d.id);
    setForm({ name: d.name, email: d.email, password: '', phone: d.phone ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editingId && !form.password) {
      Alert.alert('Atenção', 'Senha é obrigatória para novo entregador.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const body: any = { name: form.name, phone: form.phone };
        if (form.password) body.password = form.password;
        await api.put(`/users/deliverers/${editingId}`, body);
      } else {
        await api.post('/users/deliverers', {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
        });
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (d: Deliverer) => {
    Alert.alert('Remover', `Deseja remover ${d.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/deliverers/${d.id}`);
            await load();
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o entregador.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <Text style={styles.empty}>Carregando...</Text>
        ) : deliverers.length === 0 ? (
          <Text style={styles.empty}>Nenhum entregador cadastrado.</Text>
        ) : (
          deliverers.map((d) => (
            <Card key={d.id} style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.name}>{d.name}</Text>
                <Text variant="bodySmall" style={styles.info}>{d.email}</Text>
                {d.phone ? <Text variant="bodySmall" style={styles.info}>{d.phone}</Text> : null}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => openEdit(d)}>Editar</Button>
                <Button textColor="#EF5350" onPress={() => handleDelete(d)}>Remover</Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {editingId ? 'Editar Entregador' : 'Novo Entregador'}
          </Text>

          <TextInput
            label="Nome *"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            style={styles.input}
          />
          <TextInput
            label="E-mail *"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            disabled={!!editingId}
          />
          <TextInput
            label={editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label="Telefone"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Button onPress={() => setShowModal(false)}>Cancelar</Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={openCreate} color="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12 },
  name: { fontWeight: 'bold' },
  info: { color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: '#aaa' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: theme.colors.primary },
  modal: { backgroundColor: '#fff', margin: 20, borderRadius: 12, padding: 20 },
  modalTitle: { fontWeight: 'bold', marginBottom: 16 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
