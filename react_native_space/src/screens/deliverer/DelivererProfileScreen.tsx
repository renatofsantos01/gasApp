import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';

export const DelivererProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
          <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.info}>
          <View style={styles.row}>
            <Text variant="bodySmall" style={styles.label}>Telefone</Text>
            <Text variant="bodyMedium">{user?.phone ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodySmall" style={styles.label}>Função</Text>
            <Text variant="bodyMedium">Entregador</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          onPress={handleLogout}
          textColor={theme.colors.error}
          style={styles.logoutButton}
          icon="logout"
        >
          Sair
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: 24 },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#757575' },
  divider: { marginVertical: 16 },
  info: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#888' },
  logoutButton: { marginTop: 24, borderColor: theme.colors.error },
});
