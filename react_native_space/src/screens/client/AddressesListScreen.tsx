import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, IconButton, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { Address } from '../../types';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { theme } from '../../theme';

export const AddressesListScreen: React.FC<any> = ({ navigation }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Excluir Endereço',
      'Deseja realmente excluir este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAddress(addressId);
              Alert.alert('Sucesso', 'Endereço excluído com sucesso!');
              loadAddresses();
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível excluir o endereço');
            }
          },
        },
      ]
    );
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddAddress', { address });
  };

  const openMenu = (id: string) => setMenuVisible({ ...menuVisible, [id]: true });
  const closeMenu = (id: string) => setMenuVisible({ ...menuVisible, [id]: false });

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={addresses}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.addressInfo}>
                  <Text variant="bodyLarge">
                    {item?.street}, {item?.number}
                    {item?.complement ? ` - ${item?.complement}` : ''}
                  </Text>
                  <Text variant="bodyMedium" style={styles.addressDetails}>
                    {item?.neighborhood}, {item?.city}/{item?.state}
                  </Text>
                  <Text variant="bodyMedium" style={styles.addressDetails}>
                    CEP: {item?.zipcode}
                  </Text>
                  {item?.isdefault && <Text style={styles.default}>⭐ Endereço Padrão</Text>}
                </View>
                <Menu
                  visible={menuVisible?.[item?.id ?? ''] ?? false}
                  onDismiss={() => closeMenu(item?.id ?? '')}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      onPress={() => openMenu(item?.id ?? '')}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      closeMenu(item?.id ?? '');
                      handleEditAddress(item);
                    }}
                    title="Editar"
                    leadingIcon="pencil"
                  />
                  <Menu.Item
                    onPress={() => {
                      closeMenu(item?.id ?? '');
                      handleDeleteAddress(item?.id ?? '');
                    }}
                    title="Excluir"
                    leadingIcon="delete"
                  />
                </Menu>
              </View>
            </Card.Content>
          </Card>
        )}
        keyExtractor={(item) => item?.id ?? ''}
        ListEmptyComponent={
          <EmptyState
            icon="map-marker"
            title="Nenhum endereço cadastrado"
            message="Adicione um endereço para continuar"
          />
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAddress', {})}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  card: { margin: 16, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addressInfo: { flex: 1, paddingRight: 8 },
  addressDetails: { color: '#666', marginTop: 4 },
  default: { color: theme.colors.primary, fontWeight: 'bold', marginTop: 8 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: theme.colors.primary },
});
