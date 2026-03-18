import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export const AppErrorScreen: React.FC = () => {
  const { retryTenant } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    await retryTenant();
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text variant="headlineSmall" style={styles.title}>
          App não configurado
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Não foi possível conectar ao servidor da distribuidora. Verifique sua conexão e tente novamente.
        </Text>
        <Button
          mode="contained"
          onPress={handleRetry}
          loading={loading}
          style={styles.button}
        >
          Tentar novamente
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: '#757575', textAlign: 'center', marginBottom: 32 },
  button: { width: '100%' },
});
