import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ClientTabParamList } from '../../navigation/ClientNavigator';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';

type ProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ClientProfileScreenProps = { navigation: ProfileNavigationProp };

export const ClientProfileScreen: React.FC<ClientProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: async () => await logout(), style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Avatar.Text size={80} label={user?.name?.substring(0, 2)?.toUpperCase() ?? 'US'} />
          <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
          <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text variant="bodyMedium" style={styles.phone}>{user?.phone}</Text>}
        </View>

        <Card style={styles.card}>
          <List.Item
            title="Editar Perfil"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <List.Item
            title="Meus Endereços"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('AddressesList')}
          />
        </Card>

        <View style={styles.footer}>
          <Button mode="contained" onPress={handleLogout} buttonColor={theme.colors.error} style={styles.logoutButton}>
            Sair
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', padding: 24, backgroundColor: theme.colors.surface },
  name: { fontWeight: 'bold', marginTop: 16 },
  email: { color: '#757575', marginTop: 4 },
  phone: { color: '#757575', marginTop: 2 },
  card: { margin: 16 },
  footer: { padding: 16 },
  logoutButton: { marginTop: 24 },
});
