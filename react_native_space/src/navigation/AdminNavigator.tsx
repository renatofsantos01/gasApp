import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminProductsScreen } from '../screens/admin/AdminProductsScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { AdminCustomersScreen } from '../screens/admin/AdminCustomersScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { theme } from '../theme';

export type AdminTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Customers: undefined;
  Reports: undefined;
  Settings: undefined;
  OrderDetails: { orderId: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={AdminDashboardScreen}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Products"
      component={AdminProductsScreen}
      options={{
        tabBarLabel: 'Produtos',
        tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Orders"
      component={AdminOrdersScreen}
      options={{
        tabBarLabel: 'Pedidos',
        tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Customers"
      component={AdminCustomersScreen}
      options={{
        tabBarLabel: 'Clientes',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Reports"
      component={AdminReportsScreen}
      options={{
        tabBarLabel: 'Relatórios',
        tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={AdminSettingsScreen}
      options={{
        tabBarLabel: 'Configurações',
        tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export const AdminNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitle: 'Voltar' }}>
    <Stack.Screen name="Tabs" component={AdminTabs} options={{ headerShown: false }} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Detalhes do Pedido' }} />
  </Stack.Navigator>
);
