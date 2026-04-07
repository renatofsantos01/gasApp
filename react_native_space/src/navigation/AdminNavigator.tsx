import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeButton } from '../components/HomeButton';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminProductsScreen } from '../screens/admin/AdminProductsScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { AdminCustomersScreen } from '../screens/admin/AdminCustomersScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { AdminCouponsScreen } from '../screens/admin/AdminCouponsScreen';
import { AdminDeliverersScreen } from '../screens/admin/AdminDeliverersScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { theme } from '../theme';

export type AdminTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Customers: undefined;
  Deliverers: undefined;
  Coupons: undefined;
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
      tabBarInactiveTintColor: '#64748B',
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: '#334155',
      },
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
      name="Deliverers"
      component={AdminDeliverersScreen}
      options={{
        tabBarLabel: 'Entregadores',
        tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Coupons"
      component={AdminCouponsScreen}
      options={{
        tabBarLabel: 'Cupons',
        tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" size={size} color={color} />,
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
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitle: 'Voltar',
      headerLeft: () => <HomeButton />,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.onSurface,
    }}
  >
    <Stack.Screen name="Tabs" component={AdminTabs} options={{ title: '', headerLeft: () => <HomeButton /> }} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Detalhes do Pedido' }} />
  </Stack.Navigator>
);
