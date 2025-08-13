import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {Banner, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootState} from '@store/index';
import {useOfflineSync} from '@hooks/useOfflineSync';
import {useTheme} from '@contexts/ThemeContext';

export const OfflineIndicator: React.FC = () => {
  const theme = useTheme();
  const {isOffline} = useSelector((state: RootState) => state.network);
  const {syncStatus, triggerSync} = useOfflineSync();

  if (!isOffline && syncStatus.pendingActions === 0) {
    return null;
  }

  const handleSync = () => {
    if (!isOffline) {
      triggerSync();
    }
  };

  return (
    <Banner
      visible={isOffline || syncStatus.pendingActions > 0}
      actions={
        !isOffline && syncStatus.pendingActions > 0
          ? [
              {
                label: 'Sync Now',
                onPress: handleSync,
                loading: syncStatus.isLoading,
              },
            ]
          : []
      }
      icon={({size}) => (
        <Icon
          name={isOffline ? 'wifi-off' : 'sync'}
          size={size}
          color={theme.colors.onSurface}
        />
      )}
      style={[
        styles.banner,
        {
          backgroundColor: isOffline
            ? theme.colors.errorContainer
            : theme.colors.primaryContainer,
        },
      ]}>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isOffline
                ? theme.colors.onErrorContainer
                : theme.colors.onPrimaryContainer,
            },
          ]}>
          {isOffline ? 'You are offline' : 'Sync pending'}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: isOffline
                ? theme.colors.onErrorContainer
                : theme.colors.onPrimaryContainer,
            },
          ]}>
          {isOffline
            ? 'Some features may be limited'
            : `${syncStatus.pendingActions} action${
                syncStatus.pendingActions > 1 ? 's' : ''
              } waiting to sync`}
        </Text>
      </View>
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 0,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});