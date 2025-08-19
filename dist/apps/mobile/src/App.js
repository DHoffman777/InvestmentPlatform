"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_redux_1 = require("react-redux");
const react_2 = require("redux-persist/integration/react");
const native_1 = require("@react-navigation/native");
const index_1 = require("@store/index");
const AppNavigator_1 = __importDefault(require("@navigation/AppNavigator"));
const theme_1 = require("@utils/theme");
const SplashScreen_1 = __importDefault(require("@components/common/SplashScreen"));
const ErrorBoundary_1 = __importDefault(require("@components/common/ErrorBoundary"));
const NetworkStatusProvider_1 = __importDefault(require("@components/providers/NetworkStatusProvider"));
const BiometricsProvider_1 = __importDefault(require("@components/providers/BiometricsProvider"));
const App = () => {
    const isDarkMode = (0, react_native_1.useColorScheme)() === 'dark';
    (0, react_1.useEffect)(() => {
        react_native_1.StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    }, [isDarkMode]);
    return (<ErrorBoundary_1.default>
      <react_redux_1.Provider store={index_1.store}>
        <react_2.PersistGate loading={<SplashScreen_1.default />} persistor={index_1.persistor}>
          <react_native_safe_area_context_1.SafeAreaProvider>
            <react_native_paper_1.Provider theme={theme_1.theme}>
              <NetworkStatusProvider_1.default>
                <BiometricsProvider_1.default>
                  <native_1.NavigationContainer>
                    <react_native_1.StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme_1.theme.colors.surface}/>
                    <AppNavigator_1.default />
                  </native_1.NavigationContainer>
                </BiometricsProvider_1.default>
              </NetworkStatusProvider_1.default>
            </react_native_paper_1.Provider>
          </react_native_safe_area_context_1.SafeAreaProvider>
        </react_2.PersistGate>
      </react_redux_1.Provider>
    </ErrorBoundary_1.default>);
};
exports.default = App;
