import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button, Surface} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {theme, spacing} from '@/utils/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  icon?: string;
  style?: any;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  icon = 'alert-circle',
  style,
}) => {
  return (
    <Surface style={[styles.container, style]} elevation={1}>
      <MaterialCommunityIcons
        name={icon}
        size={48}
        color={theme.colors.error}
        style={styles.icon}
      />
      <Text variant="titleMedium" style={styles.title}>
        Something went wrong
      </Text>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.retryButton}
          icon="refresh">
          Try Again
        </Button>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    color: theme.colors.error,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
});

export default ErrorMessage;