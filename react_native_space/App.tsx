import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { theme } from './src/theme';
import { apiService } from './src/services/api';

export default function App() {
  React.useEffect(() => {
    apiService.setUnauthorizedHandler(() => {
      console.log('Unauthorized - token expired');
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <CartProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </PaperProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
