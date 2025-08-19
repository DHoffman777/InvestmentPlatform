"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const native_stack_1 = require("@react-navigation/native-stack");
const react_redux_1 = require("react-redux");
const AuthNavigator_1 = __importDefault(require("./AuthNavigator"));
const MainNavigator_1 = __importDefault(require("./MainNavigator"));
const LoadingScreen_1 = __importDefault(require("@/components/common/LoadingScreen"));
const Stack = (0, native_stack_1.createNativeStackNavigator)();
const AppNavigator = () => {
    const { isAuthenticated, isLoading } = (0, react_redux_1.useSelector)((state) => state.auth);
    if (isLoading) {
        return <LoadingScreen_1.default />;
    }
    return (<Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (<Stack.Screen name="Main" component={MainNavigator_1.default}/>) : (<Stack.Screen name="Auth" component={AuthNavigator_1.default}/>)}
    </Stack.Navigator>);
};
exports.default = AppNavigator;
