"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const MaterialCommunityIcons_1 = __importDefault(require("react-native-vector-icons/MaterialCommunityIcons"));
const theme_1 = require("@/utils/theme");
const ErrorMessage = ({ message, onRetry, icon = 'alert-circle', style, }) => {
    return (<react_native_paper_1.Surface style={[styles.container, style]} elevation={1}>
      <MaterialCommunityIcons_1.default name={icon} size={48} color={theme_1.theme.colors.error} style={styles.icon}/>
      <react_native_paper_1.Text variant="titleMedium" style={styles.title}>
        Something went wrong
      </react_native_paper_1.Text>
      <react_native_paper_1.Text variant="bodyMedium" style={styles.message}>
        {message}
      </react_native_paper_1.Text>
      {onRetry && (<react_native_paper_1.Button mode="contained" onPress={onRetry} style={styles.retryButton} icon="refresh">
          Try Again
        </react_native_paper_1.Button>)}
    </react_native_paper_1.Surface>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        padding: theme_1.spacing.lg,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: theme_1.theme.colors.surface,
    },
    icon: {
        marginBottom: theme_1.spacing.md,
    },
    title: {
        color: theme_1.theme.colors.error,
        fontWeight: '600',
        marginBottom: theme_1.spacing.sm,
        textAlign: 'center',
    },
    message: {
        color: theme_1.theme.colors.onSurfaceVariant,
        textAlign: 'center',
        marginBottom: theme_1.spacing.lg,
    },
    retryButton: {
        marginTop: theme_1.spacing.sm,
    },
});
exports.default = ErrorMessage;
