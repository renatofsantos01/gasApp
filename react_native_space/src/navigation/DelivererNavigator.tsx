import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DelivererHomeScreen } from '../screens/deliverer/DelivererHomeScreen';
import { DelivererOrderDetailsScreen } from '../screens/deliverer/DelivererOrderDetailsScreen';
import { HomeButton } from '../components/HomeButton';
import { Order } from '../types';

export type DelivererStackParamList = {
  DelivererHome: undefined;
  DelivererOrderDetails: { order: Order };
};

const Stack = createNativeStackNavigator<DelivererStackParamList>();

export const DelivererNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerLeft: () => <HomeButton />,
    }}
  >
    <Stack.Screen
      name="DelivererHome"
      component={DelivererHomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="DelivererOrderDetails"
      component={DelivererOrderDetailsScreen}
      options={{ title: 'Detalhes da Entrega', headerBackTitle: 'Voltar' }}
    />
  </Stack.Navigator>
);
