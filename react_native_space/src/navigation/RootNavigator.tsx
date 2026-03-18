import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PhoneVerificationScreen } from '../screens/PhoneVerificationScreen';
import { AppErrorScreen } from '../screens/AppErrorScreen';
import { ClientNavigator } from './ClientNavigator';
import { AdminNavigator } from './AdminNavigator';
import { Loading } from '../components/Loading';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  PhoneVerification: undefined;
  ClientApp: undefined;
  AdminApp: undefined;
  EditProfile: undefined;
  AddressesList: undefined;
  AddEditAddress: { addressId?: string };
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user, tenantError } = useAuth();

  if (isLoading) return <Loading />;
  if (tenantError) return <AppErrorScreen />;

  const needsPhoneVerification =
    isAuthenticated && !!user?.phone && user?.phoneVerified === false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : needsPhoneVerification ? (
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      ) : user?.role === 'admin' || user?.role === 'superadmin' ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="ClientApp" component={ClientNavigator} />
      )}
    </Stack.Navigator>
  );
};
