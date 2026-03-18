import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

type PhoneVerificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhoneVerification'>;
};

const RESEND_COOLDOWN = 60;

export const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sendCode();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    setSending(true);
    setError('');
    try {
      await apiService.sendPhoneVerification();
      startCooldown();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao enviar código';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiService.verifyPhone(code);
      await refreshUser();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Código inválido ou expirado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = user?.phone
    ? user.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3').replace(/\d(?=\d{4})/g, '*')
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Verificar Telefone
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enviamos um código de 6 dígitos para
          </Text>
          <Text variant="bodyLarge" style={styles.phone}>
            {maskedPhone}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Código de verificação"
            value={code}
            onChangeText={(text) => {
              setCode(text.replace(/\D/g, '').slice(0, 6));
              setError('');
            }}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            error={!!error}
            disabled={loading}
          />
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleVerify}
            loading={loading}
            disabled={loading || code.length !== 6}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Verificar
          </Button>

          <Button
            mode="text"
            onPress={sendCode}
            disabled={sending || cooldown > 0}
            style={styles.resendButton}
          >
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#757575',
    textAlign: 'center',
  },
  phone: {
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    gap: 8,
  },
  input: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendButton: {
    alignSelf: 'center',
  },
});
