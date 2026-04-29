import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PhoneVerificationScreen } from '../screens/PhoneVerificationScreen';
import { AppErrorScreen } from '../screens/AppErrorScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { ClientNavigator } from './ClientNavigator';
import { AdminNavigator } from './AdminNavigator';
import { DelivererNavigator } from './DelivererNavigator';
import { Loading } from '../components/Loading';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  PhoneVerification: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  ClientApp: undefined;
  AdminApp: undefined;
  DelivererApp: undefined;
  EditProfile: undefined;
  AddressesList: undefined;
  AddEditAddress: { addressId?: string };
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user, justRegistered, tenantError } = useAuth();

  if (isLoading) return <Loading />;
  if (tenantError) return <AppErrorScreen />;

  const needsPhoneVerification =
    isAuthenticated && justRegistered && !!user?.phone && user?.phoneVerified === false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : needsPhoneVerification ? (
        <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      ) : user?.role === 'admin' || user?.role === 'superadmin' ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : user?.role === 'entregador' ? (
        <Stack.Screen name="DelivererApp" component={DelivererNavigator} />
      ) : (
        <Stack.Screen name="ClientApp" component={ClientNavigator} />
      )}
    </Stack.Navigator>
  );
};
