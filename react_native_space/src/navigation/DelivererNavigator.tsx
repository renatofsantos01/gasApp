import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DelivererHomeScreen } from '../screens/deliverer/DelivererHomeScreen';
import { DelivererOrderDetailsScreen } from '../screens/deliverer/DelivererOrderDetailsScreen';
import { DelivererProfileScreen } from '../screens/deliverer/DelivererProfileScreen';
import { Order } from '../types';
import { theme } from '../theme';

export type DelivererStackParamList = {
  DelivererTabs: undefined;
  DelivererOrderDetails: { order: Order };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<DelivererStackParamList>();

const DelivererTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Entregas"
      component={DelivererHomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Perfil"
      component={DelivererProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export const DelivererNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitle: 'Voltar' }}>
    <Stack.Screen name="DelivererTabs" component={DelivererTabs} options={{ headerShown: false }} />
    <Stack.Screen
      name="DelivererOrderDetails"
      component={DelivererOrderDetailsScreen}
      options={{ title: 'Detalhes da Entrega' }}
    />
  </Stack.Navigator>
);
