import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';

export const AdminSettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da conta de administrador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout?.(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Icon
              size={80}
              icon="account"
              style={styles.avatar}
            />
            <Text variant="headlineSmall" style={styles.name}>
              {user?.name ?? 'Administrador'}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email ?? ''}
            </Text>
            <Text variant="bodySmall" style={styles.role}>
              Administrador do Sistema
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informações da Conta
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Nome:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {user?.name ?? '-'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Email:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {user?.email ?? '-'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Telefone:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {user?.phone ?? 'Não informado'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Tipo de Conta:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              Administrador
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Sobre o Sistema
          </Text>

          <Divider style={styles.divider} />

          <Text variant="bodyMedium" style={styles.aboutText}>
            Sistema de Gestão para Distribuidora de Gás
          </Text>
          <Text variant="bodySmall" style={styles.versionText}>
            Versão 1.0.0
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#EF5350"
        icon="logout"
      >
        Sair da Conta
      </Button>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  email: {
    color: '#666',
    marginTop: 4,
  },
  role: {
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    color: '#333',
  },
  aboutText: {
    marginBottom: 8,
    color: '#666',
  },
  versionText: {
    color: '#999',
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
  },
  bottomSpace: {
    height: 32,
  },
});
