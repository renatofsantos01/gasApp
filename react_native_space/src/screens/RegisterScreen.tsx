import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validatePhone, validateCEP, validateRequired } from '../utils/validation';
import { theme } from '../theme';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep?.replace?.(/\D/g, '') ?? '';
    if (cleanCep.length !== 8) return;
    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data?.erro) { Alert.alert('CEP não encontrado'); return; }
      setFormData((prev) => ({
        ...prev,
        street: data?.logradouro ?? prev.street,
        neighborhood: data?.bairro ?? prev.neighborhood,
        city: data?.localidade ?? prev.city,
        state: data?.uf ?? prev.state,
      }));
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (text: string) => {
    updateField('zipcode', text);
    const clean = text?.replace?.(/\D/g, '') ?? '';
    if (clean.length === 8) fetchAddressByCep(clean);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData?.name)) newErrors.name = 'Nome é obrigatório';
    if (!validateRequired(formData?.email)) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData?.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!validateRequired(formData?.password)) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!validatePassword(formData?.password)) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }
    if (!validateRequired(formData?.phone)) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(formData?.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    // Address validations (required)
    if (!validateRequired(formData?.zipcode)) {
      newErrors.zipcode = 'CEP é obrigatório';
    } else if (!validateCEP(formData?.zipcode)) {
      newErrors.zipcode = 'CEP inválido';
    }
    if (!validateRequired(formData?.street)) newErrors.street = 'Rua é obrigatória';
    if (!validateRequired(formData?.number)) newErrors.number = 'Número é obrigatório';
    if (!validateRequired(formData?.neighborhood)) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!validateRequired(formData?.city)) newErrors.city = 'Cidade é obrigatória';
    if (!validateRequired(formData?.state)) newErrors.state = 'Estado é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors ?? {}).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: formData?.name,
        email: formData?.email,
        password: formData?.password,
        phone: formData?.phone,
        address: {
          street: formData?.street,
          number: formData?.number,
          complement: formData?.complement || undefined,
          neighborhood: formData?.neighborhood,
          city: formData?.city,
          state: formData?.state,
          zipcode: formData?.zipcode,
        },
      });
    } catch (error: any) {
      const raw = error?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join('\n')
        : raw ?? error?.message ?? 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>
              Criar Conta
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Preencha seus dados para começar
            </Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Dados Pessoais
            </Text>

            <TextInput
              label="Nome Completo *"
              value={formData?.name}
              onChangeText={(text) => updateField('name', text)}
              mode="outlined"
              style={styles.input}
              error={!!errors?.name}
              disabled={loading}
            />
            {errors?.name && <HelperText type="error">{errors?.name}</HelperText>}

            <TextInput
              label="Email *"
              value={formData?.email}
              onChangeText={(text) => updateField('email', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors?.email}
              disabled={loading}
            />
            {errors?.email && <HelperText type="error">{errors?.email}</HelperText>}

            <TextInput
              label="Telefone *"
              value={formData?.phone}
              onChangeText={(text) => updateField('phone', text)}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="(11) 98765-4321"
              error={!!errors?.phone}
              disabled={loading}
            />
            {errors?.phone && <HelperText type="error">{errors?.phone}</HelperText>}

            <TextInput
              label="Senha *"
              value={formData?.password}
              onChangeText={(text) => updateField('password', text)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors?.password}
              disabled={loading}
            />
            {errors?.password && <HelperText type="error">{errors?.password}</HelperText>}

            <TextInput
              label="Confirmar Senha *"
              value={formData?.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              error={!!errors?.confirmPassword}
              disabled={loading}
            />
            {errors?.confirmPassword && <HelperText type="error">{errors?.confirmPassword}</HelperText>}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Endereço *
            </Text>

            <View style={styles.cepRow}>
              <TextInput
                label="CEP *"
                value={formData?.zipcode}
                onChangeText={handleCepChange}
                mode="outlined"
                style={[styles.input, styles.cepInput]}
                keyboardType="numeric"
                placeholder="12345-678"
                error={!!errors?.zipcode}
                disabled={loading}
              />
              {loadingCep && <ActivityIndicator style={styles.cepLoader} color={theme.colors.primary} />}
            </View>
            {errors?.zipcode && <HelperText type="error">{errors?.zipcode}</HelperText>}

            <View style={styles.row}>
              <View style={styles.flex3}>
                <TextInput
                  label="Rua"
                  value={formData?.street}
                  onChangeText={(text) => updateField('street', text)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors?.street}
                  disabled={loading}
                />
                {errors?.street && <HelperText type="error">{errors?.street}</HelperText>}
              </View>
              <View style={styles.flex1}>
                <TextInput
                  label="Número"
                  value={formData?.number}
                  onChangeText={(text) => updateField('number', text)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors?.number}
                  disabled={loading}
                />
                {errors?.number && <HelperText type="error">{errors?.number}</HelperText>}
              </View>
            </View>

            <TextInput
              label="Complemento"
              value={formData?.complement}
              onChangeText={(text) => updateField('complement', text)}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              label="Bairro"
              value={formData?.neighborhood}
              onChangeText={(text) => updateField('neighborhood', text)}
              mode="outlined"
              style={styles.input}
              error={!!errors?.neighborhood}
              disabled={loading}
            />
            {errors?.neighborhood && <HelperText type="error">{errors?.neighborhood}</HelperText>}

            <View style={styles.row}>
              <View style={styles.flex3}>
                <TextInput
                  label="Cidade"
                  value={formData?.city}
                  onChangeText={(text) => updateField('city', text)}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors?.city}
                  disabled={loading}
                />
                {errors?.city && <HelperText type="error">{errors?.city}</HelperText>}
              </View>
              <View style={styles.flex1}>
                <TextInput
                  label="UF"
                  value={formData?.state}
                  onChangeText={(text) => updateField('state', text?.toUpperCase())}
                  mode="outlined"
                  style={styles.input}
                  maxLength={2}
                  autoCapitalize="characters"
                  error={!!errors?.state}
                  disabled={loading}
                />
                {errors?.state && <HelperText type="error">{errors?.state}</HelperText>}
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              Cadastrar
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.loginButton}
              disabled={loading}
            >
              Já tem conta? Faça login
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex3: {
    flex: 3,
  },
  registerButton: {
    marginTop: 24,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginButton: {
    alignSelf: 'center',
  },
  cepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cepInput: {
    flex: 1,
  },
  cepLoader: {
    marginLeft: 8,
    marginBottom: 4,
  },
});
