import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DelivererHomeScreen } from '../screens/deliverer/DelivererHomeScreen';
import { DelivererOrderDetailsScreen } from '../screens/deliverer/DelivererOrderDetailsScreen';
import { DelivererProfileScreen } from '../screens/deliverer/DelivererProfileScreen';
import { HomeButton } from '../components/HomeButton';
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
      tabBarInactiveTintColor: '#64748B',
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: '#334155',
      },
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
  <Stack.Navigator screenOptions={{
    headerShown: true,
    headerBackTitle: 'Voltar',
    headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.onSurface,
    headerLeft: () => <HomeButton />,
  }}>
    <Stack.Screen name="DelivererTabs" component={DelivererTabs} options={{ title: '', headerLeft: () => <HomeButton /> }} />
    <Stack.Screen
      name="DelivererOrderDetails"
      component={DelivererOrderDetailsScreen}
      options={{ title: 'Detalhes da Entrega' }}
    />
  </Stack.Navigator>
);
