"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const theme_1 = require("@/utils/theme");
const LoadingSpinner = ({ size = 'large', color = theme_1.theme.colors.primary, style, }) => {
    return (<react_native_1.View style={[styles.container, style]}>
      <react_native_paper_1.ActivityIndicator animating={true} size={size} color={color}/>
    </react_native_1.View>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
exports.default = LoadingSpinner;
