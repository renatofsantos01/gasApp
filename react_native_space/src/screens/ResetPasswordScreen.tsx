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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const { tenantId } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ code?: string; password?: string; confirm?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!code || code.length !== 6) newErrors.code = 'Digite o código de 6 dígitos';
    if (!newPassword || newPassword.length < 6) newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    if (newPassword !== confirmPassword) newErrors.confirm = 'As senhas não coincidem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiService.resetPassword(email, code, newPassword, tenantId ?? undefined);
      Alert.alert(
        'Senha redefinida!',
        'Sua senha foi atualizada com sucesso. Faça login com a nova senha.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Código inválido ou expirado.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiService.forgotPassword(email, tenantId ?? undefined);
      Alert.alert('Código reenviado', 'Verifique seu e-mail.');
    } catch {
      Alert.alert('Erro', 'Não foi possível reenviar o código.');
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
              Redefinir senha
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Digite o código enviado para{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <TextInput
              label="Código (6 dígitos)"
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/\D/g, '').slice(0, 6));
                setErrors((prev) => ({ ...prev, code: undefined }));
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              error={!!errors.code}
              disabled={loading}
              autoFocus
            />
            {!!errors.code && <HelperText type="error">{errors.code}</HelperText>}

            <TextInput
              label="Nova senha"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors.password}
              disabled={loading}
            />
            {!!errors.password && <HelperText type="error">{errors.password}</HelperText>}

            <TextInput
              label="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              error={!!errors.confirm}
              disabled={loading}
            />
            {!!errors.confirm && <HelperText type="error">{errors.confirm}</HelperText>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Redefinir senha
            </Button>

            <Button
              mode="text"
              onPress={handleResend}
              disabled={loading}
              style={styles.resendButton}
            >
              Reenviar código
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              style={styles.backButton}
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
  emailText: { color: theme.colors.primary, fontWeight: '600' },
  input: { marginBottom: 4 },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 8 },
  resendButton: { marginTop: 12, alignSelf: 'center' },
  backButton: { marginTop: 4, alignSelf: 'center' },
});
