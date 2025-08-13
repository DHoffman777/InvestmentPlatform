import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '@/screens/main/DashboardScreen';
import PortfoliosScreen from '@/screens/main/PortfoliosScreen';
import PortfolioDetailsScreen from '@/screens/main/PortfolioDetailsScreen';
import TransactionsScreen from '@/screens/main/TransactionsScreen';
import DocumentsScreen from '@/screens/main/DocumentsScreen';
import MessagesScreen from '@/screens/main/MessagesScreen';
import SettingsScreen from '@/screens/main/SettingsScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import {theme} from '@/utils/theme';

export type MainTabParamList = {
  Dashboard: undefined;
  Portfolios: undefined;
  Transactions: undefined;
  Documents: undefined;
  Messages: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  PortfolioDetails: {portfolioId: string};
  Settings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Portfolios':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-variant';
              break;
            case 'Documents':
              iconName = focused ? 'file-document' : 'file-document-outline';
              break;
            case 'Messages':
              iconName = focused ? 'message' : 'message-outline';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      })}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{title: 'Dashboard'}}
      />
      <Tab.Screen
        name="Portfolios"
        component={PortfoliosScreen}
        options={{title: 'Portfolios'}}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{title: 'Transactions'}}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{title: 'Documents'}}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{title: 'Messages'}}
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="PortfolioDetails"
        component={PortfolioDetailsScreen}
        options={{title: 'Portfolio Details'}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: 'Profile'}}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;