import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B35',
    secondary: '#004E89',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    disabled: '#BDBDBD',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export const statusColors = {
  Pendente: '#FFC107',
  'Em Preparo': '#2196F3',
  'Saiu para Entrega': '#9C27B0',
  Entregue: '#4CAF50',
  Cancelado: '#F44336',
};
