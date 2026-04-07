import { MD3DarkTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B35',
    secondary: '#60A5FA',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#1E293B',
    text: '#F1F5F9',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#F1F5F9',
    onBackground: '#F1F5F9',
    disabled: '#475569',
    backdrop: 'rgba(0, 0, 0, 0.7)',
    outline: '#334155',
    elevation: {
      level0: 'transparent',
      level1: '#1E293B',
      level2: '#243247',
      level3: '#2A3A54',
      level4: '#2E3F5C',
      level5: '#334461',
    },
  },
};

export const statusColors = {
  Pendente: '#FFC107',
  'Em Preparo': '#2196F3',
  'Saiu para Entrega': '#9C27B0',
  Entregue: '#4CAF50',
  Cancelado: '#F44336',
};
