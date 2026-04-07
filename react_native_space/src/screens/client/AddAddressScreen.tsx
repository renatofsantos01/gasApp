import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Switch,
  Menu,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { theme } from '../../theme';

const ESTADOS_BRASIL = [
  { label: 'AC', value: 'AC' },
  { label: 'AL', value: 'AL' },
  { label: 'AP', value: 'AP' },
  { label: 'AM', value: 'AM' },
  { label: 'BA', value: 'BA' },
  { label: 'CE', value: 'CE' },
  { label: 'DF', value: 'DF' },
  { label: 'ES', value: 'ES' },
  { label: 'GO', value: 'GO' },
  { label: 'MA', value: 'MA' },
  { label: 'MT', value: 'MT' },
  { label: 'MS', value: 'MS' },
  { label: 'MG', value: 'MG' },
  { label: 'PA', value: 'PA' },
  { label: 'PB', value: 'PB' },
  { label: 'PR', value: 'PR' },
  { label: 'PE', value: 'PE' },
  { label: 'PI', value: 'PI' },
  { label: 'RJ', value: 'RJ' },
  { label: 'RN', value: 'RN' },
  { label: 'RS', value: 'RS' },
  { label: 'RO', value: 'RO' },
  { label: 'RR', value: 'RR' },
  { label: 'SC', value: 'SC' },
  { label: 'SP', value: 'SP' },
  { label: 'SE', value: 'SE' },
  { label: 'TO', value: 'TO' },
];

export const AddAddressScreen: React.FC<any> = ({ navigation, route }) => {
  const address = route?.params?.address;
  const isEditing = !!address;

  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [stateMenuVisible, setStateMenuVisible] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        street: address?.street ?? '',
        number: address?.number ?? '',
        complement: address?.complement ?? '',
        neighborhood: address?.neighborhood ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        zipcode: address?.zipcode ?? '',
        isDefault: address?.isdefault ?? false,
      });
    }
  }, [address]);

  const fetchAddressByCep = async (cep: string) => {
    // Remove caracteres não numéricos
    const cleanCep = cep?.replace?.(/\D/g, '') ?? '';
    
    if (cleanCep.length !== 8) {
      return;
    }

    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data?.erro) {
        Alert.alert('Erro', 'CEP não encontrado');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        street: data?.logradouro ?? prev.street,
        neighborhood: data?.bairro ?? prev.neighborhood,
        city: data?.localidade ?? prev.city,
        state: data?.uf ?? prev.state,
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      Alert.alert('Erro', 'Não foi possível buscar o CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (text: string) => {
    setFormData({ ...formData, zipcode: text });
    
    const cleanCep = text?.replace?.(/\D/g, '') ?? '';
    if (cleanCep.length === 8) {
      fetchAddressByCep(cleanCep);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!formData.street?.trim()) {
      Alert.alert('Erro', 'Rua é obrigatória');
      return;
    }
    if (!formData.number?.trim()) {
      Alert.alert('Erro', 'Número é obrigatório');
      return;
    }
    if (!formData.neighborhood?.trim()) {
      Alert.alert('Erro', 'Bairro é obrigatório');
      return;
    }
    if (!formData.city?.trim()) {
      Alert.alert('Erro', 'Cidade é obrigatória');
      return;
    }
    if (!formData.state?.trim() || formData.state.length !== 2) {
      Alert.alert('Erro', 'Estado deve ter 2 letras (ex: SP)');
      return;
    }
    if (!formData.zipcode?.trim()) {
      Alert.alert('Erro', 'CEP é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const addressData = {
        street: formData.street.trim(),
        number: formData.number.trim(),
        complement: formData.complement?.trim() || undefined,
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zipcode: formData.zipcode.trim(),
        isDefault: formData.isDefault,
      };

      if (isEditing) {
        await apiService.updateAddress(address?.id ?? '', addressData);
        Alert.alert('Sucesso', 'Endereço atualizado com sucesso!');
      } else {
        await apiService.createAddress(addressData);
        Alert.alert('Sucesso', 'Endereço criado com sucesso!');
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      const message = error?.response?.data?.message ?? 'Erro ao salvar endereço';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>
                {isEditing ? 'Editar Endereço' : 'Novo Endereço'}
              </Text>

              <TextInput
                label="CEP *"
                value={formData.zipcode}
                onChangeText={handleCepChange}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                placeholder="00000-000"
                maxLength={9}
                right={loadingCep ? <TextInput.Icon icon={() => <ActivityIndicator size="small" />} /> : null}
              />

              <TextInput
                label="Rua *"
                value={formData.street}
                onChangeText={(text) => setFormData({ ...formData, street: text })}
                mode="outlined"
                style={styles.input}
              />

              <View style={styles.row}>
                <TextInput
                  label="Número *"
                  value={formData.number}
                  onChangeText={(text) => setFormData({ ...formData, number: text })}
                  mode="outlined"
                  style={[styles.input, styles.numberInput]}
                />
                <TextInput
                  label="Complemento"
                  value={formData.complement}
                  onChangeText={(text) => setFormData({ ...formData, complement: text })}
                  mode="outlined"
                  style={[styles.input, styles.complementInput]}
                />
              </View>

              <TextInput
                label="Bairro *"
                value={formData.neighborhood}
                onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Cidade *"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                mode="outlined"
                style={styles.input}
              />

              <Menu
                visible={stateMenuVisible}
                onDismiss={() => setStateMenuVisible(false)}
                anchor={
                  <TextInput
                    label="Estado (UF) *"
                    value={formData.state}
                    mode="outlined"
                    style={styles.input}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setStateMenuVisible(true)} />}
                    onPressIn={() => setStateMenuVisible(true)}
                  />
                }
              >
                <ScrollView style={styles.menuScroll}>
                  {ESTADOS_BRASIL.map((estado) => (
                    <Menu.Item
                      key={estado.value}
                      onPress={() => {
                        setFormData({ ...formData, state: estado.value });
                        setStateMenuVisible(false);
                      }}
                      title={estado.label}
                    />
                  ))}
                </ScrollView>
              </Menu>

              <View style={styles.switchContainer}>
                <Text variant="bodyLarge">Definir como endereço padrão</Text>
                <Switch
                  value={formData.isDefault}
                  onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </Card.Content>
          </Card>
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
  card: {
    margin: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  numberInput: {
    flex: 1,
  },
  complementInput: {
    flex: 2,
  },
  cityInput: {
    flex: 3,
  },
  stateInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  button: {
    marginTop: 8,
  },
  menuScroll: {
    maxHeight: 300,
  },
});
