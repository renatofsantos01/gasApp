import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validateRequired } from '../utils/validation';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { tenantId } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validate = () => {
    if (!validateRequired(email)) {
      setEmailError('E-mail é obrigatório');
      return false;
    }
    if (!validateEmail(email)) {
      setEmailError('E-mail inválido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiService.forgotPassword(email, tenantId ?? undefined);
      navigation.navigate('ResetPassword', { email });
    } catch {
      Alert.alert('Erro', 'Não foi possível processar a solicitação. Tente novamente.');
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>
              Esqueci minha senha
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Informe seu e-mail cadastrado e enviaremos um código para redefinir sua senha.
            </Text>

            <TextInput
              label="E-mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!emailError}
              disabled={loading}
              autoFocus
            />
            {!!emailError && (
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Enviar código
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              disabled={loading}
            >
              Voltar para o login
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#757575', textAlign: 'center', marginBottom: 32 },
  input: { marginBottom: 4 },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 8 },
  backButton: { marginTop: 12, alignSelf: 'center' },
});
