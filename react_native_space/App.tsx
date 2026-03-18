import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { DynamicThemeProvider } from './src/components/DynamicThemeProvider';
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
        <AuthProvider>
          <DynamicThemeProvider>
            <CartProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </DynamicThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
