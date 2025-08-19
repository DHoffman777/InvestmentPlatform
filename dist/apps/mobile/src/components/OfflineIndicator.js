"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineIndicator = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_redux_1 = require("react-redux");
const react_native_paper_1 = require("react-native-paper");
const MaterialCommunityIcons_1 = __importDefault(require("react-native-vector-icons/MaterialCommunityIcons"));
const useOfflineSync_1 = require("@hooks/useOfflineSync");
const ThemeContext_1 = require("@contexts/ThemeContext");
const OfflineIndicator = () => {
    const theme = (0, ThemeContext_1.useTheme)();
    const { isOffline } = (0, react_redux_1.useSelector)((state) => state.network);
    const { syncStatus, triggerSync } = (0, useOfflineSync_1.useOfflineSync)();
    if (!isOffline && syncStatus.pendingActions === 0) {
        return null;
    }
    const handleSync = () => {
        if (!isOffline) {
            triggerSync();
        }
    };
    return (<react_native_paper_1.Banner visible={isOffline || syncStatus.pendingActions > 0} actions={!isOffline && syncStatus.pendingActions > 0
            ? [
                {
                    label: 'Sync Now',
                    onPress: handleSync,
                    loading: syncStatus.isLoading,
                },
            ]
            : []} icon={({ size }) => (<MaterialCommunityIcons_1.default name={isOffline ? 'wifi-off' : 'sync'} size={size} color={theme.colors.onSurface}/>)} style={[
            styles.banner,
            {
                backgroundColor: isOffline
                    ? theme.colors.errorContainer
                    : theme.colors.primaryContainer,
            },
        ]}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={[
            styles.title,
            {
                color: isOffline
                    ? theme.colors.onErrorContainer
                    : theme.colors.onPrimaryContainer,
            },
        ]}>
          {isOffline ? 'You are offline' : 'Sync pending'}
        </react_native_1.Text>
        <react_native_1.Text style={[
            styles.subtitle,
            {
                color: isOffline
                    ? theme.colors.onErrorContainer
                    : theme.colors.onPrimaryContainer,
            },
        ]}>
          {isOffline
            ? 'Some features may be limited'
            : `${syncStatus.pendingActions} action${syncStatus.pendingActions > 1 ? 's' : ''} waiting to sync`}
        </react_native_1.Text>
      </react_native_1.View>
    </react_native_paper_1.Banner>);
};
exports.OfflineIndicator = OfflineIndicator;
const styles = react_native_1.StyleSheet.create({
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
