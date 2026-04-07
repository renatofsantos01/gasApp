import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export const HomeButton: React.FC = () => {
  const navigation = useNavigation<any>();
  const { tenantConfig, user } = useAuth();

  const handlePress = () => {
    if (user?.role === 'entregador') {
      navigation.navigate('DelivererTabs', { screen: 'Entregas' });
    } else if (user?.role === 'admin' || user?.role === 'superadmin') {
      navigation.navigate('Tabs', { screen: 'Dashboard' });
    } else {
      navigation.navigate('Tabs', { screen: 'ClientHome' });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      {tenantConfig?.logoUrl ? (
        <Image source={{ uri: tenantConfig.logoUrl }} style={styles.logo} resizeMode="contain" />
      ) : (
        <Ionicons name="home-outline" size={26} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
});
