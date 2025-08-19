"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const native_stack_1 = require("@react-navigation/native-stack");
const LoginScreen_1 = __importDefault(require("@/screens/auth/LoginScreen"));
const BiometricSetupScreen_1 = __importDefault(require("@/screens/auth/BiometricSetupScreen"));
const ForgotPasswordScreen_1 = __importDefault(require("@/screens/auth/ForgotPasswordScreen"));
const Stack = (0, native_stack_1.createNativeStackNavigator)();
const AuthNavigator = () => {
    return (<Stack.Navigator screenOptions={{
            headerShown: false,
            gestureEnabled: false,
        }}>
      <Stack.Screen name="Login" component={LoginScreen_1.default}/>
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen_1.default} options={{ gestureEnabled: true }}/>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen_1.default} options={{ gestureEnabled: true }}/>
    </Stack.Navigator>);
};
exports.default = AuthNavigator;
