import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { tenantService } from '../services/tenantService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

type TenantSelectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TenantSelection'>;
};

export const TenantSelectionScreen: React.FC<TenantSelectionScreenProps> = ({ navigation }) => {
  const { setTenant } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!code?.trim()) {
      setError('Digite o código da distribuidora');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tenantConfig = await tenantService.getBySubdomain(code.trim().toLowerCase());

      if (!tenantConfig) {
        setError('Distribuidora não encontrada. Verifique o código e tente novamente.');
        setLoading(false);
        return;
      }

      // Salvar configuração do tenant
      await AsyncStorage.setItem('tenantId', tenantConfig.id);
      await AsyncStorage.setItem('tenantConfig', JSON.stringify(tenantConfig));

      // Atualizar contexto para que o RootNavigator renderize as telas corretas
      setTenant(tenantConfig.id, tenantConfig);
    } catch (err: any) {
      console.error('Error selecting tenant:', err);
      setError('Erro ao buscar distribuidora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Bem-vindo
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Digite o código da sua distribuidora
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Código da Distribuidora"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError('');
              }}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              placeholder="Ex: demo"
              error={!!error}
              disabled={loading}
            />
            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : (
              <HelperText type="info" visible>
                O código foi fornecido pela sua distribuidora
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleContinue}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Continuar
            </Button>
          </View>

          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              Não tem um código? Entre em contato com sua distribuidora.
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#757575',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#757575',
    textAlign: 'center',
  },
});
