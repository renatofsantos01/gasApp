import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'file-tray-outline', title, message }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color={theme.colors.disabled} />
      <Text variant="titleLarge" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  message: {
    color: '#757575',
    textAlign: 'center',
  },
});
