import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { clearTenant } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={styles.title}>
            Distribuidora de Gás
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Pedidos rápidos e entrega garantida
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Entrar
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
          >
            Criar Conta
          </Button>

          <Button
            mode="text"
            onPress={clearTenant}
            style={styles.registerButton}
            textColor="#9E9E9E"
          >
            Trocar distribuidora
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
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#757575',
    textAlign: 'center',
  },
  buttonsContainer: {
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
  adminButton: {
    marginBottom: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  registerButton: {
    alignSelf: 'center',
  },
});
