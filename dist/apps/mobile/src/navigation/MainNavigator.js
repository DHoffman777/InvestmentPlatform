"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const native_stack_1 = require("@react-navigation/native-stack");
const MaterialCommunityIcons_1 = __importDefault(require("react-native-vector-icons/MaterialCommunityIcons"));
const DashboardScreen_1 = __importDefault(require("@/screens/main/DashboardScreen"));
const PortfoliosScreen_1 = __importDefault(require("@/screens/main/PortfoliosScreen"));
const PortfolioDetailsScreen_1 = __importDefault(require("@/screens/main/PortfolioDetailsScreen"));
const TransactionsScreen_1 = __importDefault(require("@/screens/main/TransactionsScreen"));
const DocumentsScreen_1 = __importDefault(require("@/screens/main/DocumentsScreen"));
const MessagesScreen_1 = __importDefault(require("@/screens/main/MessagesScreen"));
const SettingsScreen_1 = __importDefault(require("@/screens/main/SettingsScreen"));
const ProfileScreen_1 = __importDefault(require("@/screens/main/ProfileScreen"));
const theme_1 = require("@/utils/theme");
const Tab = (0, bottom_tabs_1.createBottomTabNavigator)();
const Stack = (0, native_stack_1.createNativeStackNavigator)();
const MainTabs = () => {
    return (<Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
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
                return (<MaterialCommunityIcons_1.default name={iconName} size={size} color={color}/>);
            },
            tabBarActiveTintColor: theme_1.theme.colors.primary,
            tabBarInactiveTintColor: theme_1.theme.colors.onSurfaceVariant,
            tabBarStyle: {
                backgroundColor: theme_1.theme.colors.surface,
                borderTopColor: theme_1.theme.colors.outline,
                paddingBottom: 5,
                paddingTop: 5,
                height: 60,
            },
            headerStyle: {
                backgroundColor: theme_1.theme.colors.surface,
            },
            headerTintColor: theme_1.theme.colors.onSurface,
        })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen_1.default} options={{ title: 'Dashboard' }}/>
      <Tab.Screen name="Portfolios" component={PortfoliosScreen_1.default} options={{ title: 'Portfolios' }}/>
      <Tab.Screen name="Transactions" component={TransactionsScreen_1.default} options={{ title: 'Transactions' }}/>
      <Tab.Screen name="Documents" component={DocumentsScreen_1.default} options={{ title: 'Documents' }}/>
      <Tab.Screen name="Messages" component={MessagesScreen_1.default} options={{ title: 'Messages' }}/>
    </Tab.Navigator>);
};
const MainNavigator = () => {
    return (<Stack.Navigator screenOptions={{
            headerStyle: {
                backgroundColor: theme_1.theme.colors.surface,
            },
            headerTintColor: theme_1.theme.colors.onSurface,
        }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }}/>
      <Stack.Screen name="PortfolioDetails" component={PortfolioDetailsScreen_1.default} options={{ title: 'Portfolio Details' }}/>
      <Stack.Screen name="Settings" component={SettingsScreen_1.default} options={{ title: 'Settings' }}/>
      <Stack.Screen name="Profile" component={ProfileScreen_1.default} options={{ title: 'Profile' }}/>
    </Stack.Navigator>);
};
exports.default = MainNavigator;
