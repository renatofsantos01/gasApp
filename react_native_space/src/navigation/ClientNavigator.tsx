import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ClientHomeScreen } from '../screens/client/ClientHomeScreen';
import { CartScreen } from '../screens/client/CartScreen';
import { CheckoutScreen } from '../screens/client/CheckoutScreen';
import { MyOrdersScreen } from '../screens/client/MyOrdersScreen';
import { ClientProfileScreen } from '../screens/client/ClientProfileScreen';
import { EditProfileScreen } from '../screens/client/EditProfileScreen';
import { AddressesListScreen } from '../screens/client/AddressesListScreen';
import { AddAddressScreen } from '../screens/client/AddAddressScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { HomeButton } from '../components/HomeButton';
import { theme } from '../theme';

export type ClientTabParamList = {
  ClientHome: undefined;
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  Profile: undefined;
  EditProfile: undefined;
  AddressesList: undefined;
  AddAddress: { address?: any };
  OrderDetails: { orderId: string };
};

const Tab = createBottomTabNavigator<ClientTabParamList>();
const Stack = createNativeStackNavigator();

const ClientTabs = () => (
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
      name="ClientHome"
      component={ClientHomeScreen}
      options={{
        tabBarLabel: 'Início',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="MyOrders"
      component={MyOrdersScreen}
      options={{
        tabBarLabel: 'Pedidos',
        tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ClientProfileScreen}
      options={{
        tabBarLabel: 'Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export const ClientNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitle: 'Voltar',
      headerLeft: () => <HomeButton />,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.onSurface,
    }}
  >
    <Stack.Screen name="Tabs" component={ClientTabs} options={{ title: '', headerLeft: () => <HomeButton /> }} />
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finalizar Pedido' }} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Detalhes do Pedido' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
    <Stack.Screen name="AddressesList" component={AddressesListScreen} options={{ title: 'Meus Endereços' }} />
    <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Adicionar Endereço' }} />
  </Stack.Navigator>
);
