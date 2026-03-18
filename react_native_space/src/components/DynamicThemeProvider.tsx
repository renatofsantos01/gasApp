import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export const DynamicThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantConfig } = useAuth();

  const dynamicTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: tenantConfig?.primaryColor ?? theme.colors.primary,
      secondary: tenantConfig?.secondaryColor ?? theme.colors.secondary,
    },
  };

  return <PaperProvider theme={dynamicTheme}>{children}</PaperProvider>;
};
