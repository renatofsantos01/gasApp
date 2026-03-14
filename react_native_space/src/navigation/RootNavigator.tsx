import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { TenantSelectionScreen } from '../screens/TenantSelectionScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ClientNavigator } from './ClientNavigator';
import { AdminNavigator } from './AdminNavigator';
import { Loading } from '../components/Loading';

export type RootStackParamList = {
  TenantSelection: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ClientApp: undefined;
  AdminApp: undefined;
  EditProfile: undefined;
  AddressesList: undefined;
  AddEditAddress: { addressId?: string };
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user, tenantId } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  // Se não tem tenant selecionado e não está autenticado, mostra seleção de tenant
  const hasTenant = !!tenantId;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          {!hasTenant ? (
            <Stack.Screen name="TenantSelection" component={TenantSelectionScreen} />
          ) : (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </>
      ) : user?.role === 'admin' || user?.role === 'superadmin' ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="ClientApp" component={ClientNavigator} />
      )}
    </Stack.Navigator>
  );
};
