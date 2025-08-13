import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import LoginScreen from '@/screens/auth/LoginScreen';
import BiometricSetupScreen from '@/screens/auth/BiometricSetupScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  BiometricSetup: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="BiometricSetup"
        component={BiometricSetupScreen}
        options={{gestureEnabled: true}}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{gestureEnabled: true}}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;