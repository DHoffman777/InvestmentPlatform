import React, {useEffect} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as ReduxProvider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {NavigationContainer} from '@react-navigation/native';

import {store, persistor} from '@store/index';
import AppNavigator from '@navigation/AppNavigator';
import {theme} from '@utils/theme';
import SplashScreen from '@components/common/SplashScreen';
import ErrorBoundary from '@components/common/ErrorBoundary';
import NetworkStatusProvider from '@components/providers/NetworkStatusProvider';
import BiometricsProvider from '@components/providers/BiometricsProvider';

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
  }, [isDarkMode]);

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <PersistGate loading={<SplashScreen />} persistor={persistor}>
          <SafeAreaProvider>
            <PaperProvider theme={theme}>
              <NetworkStatusProvider>
                <BiometricsProvider>
                  <NavigationContainer>
                    <StatusBar
                      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                      backgroundColor={theme.colors.surface}
                    />
                    <AppNavigator />
                  </NavigationContainer>
                </BiometricsProvider>
              </NetworkStatusProvider>
            </PaperProvider>
          </SafeAreaProvider>
        </PersistGate>
      </ReduxProvider>
    </ErrorBoundary>
  );
};

export default App;