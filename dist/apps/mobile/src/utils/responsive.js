"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOrientation = exports.getScreenDimensions = exports.getNavigationProps = exports.getModalProps = exports.getCardWidth = exports.getTabletLayoutProps = exports.getGridColumns = exports.getResponsiveFontSizes = exports.getResponsiveSpacing = exports.getResponsiveValue = exports.isLandscape = exports.isTablet = exports.BREAKPOINTS = void 0;
const react_native_1 = require("react-native");
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = react_native_1.Dimensions.get('window');
// Breakpoints for different screen sizes
exports.BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
};
// Check if device is a tablet
const isTablet = () => {
    const pixelDensity = react_native_1.PixelRatio.get();
    const adjustedWidth = SCREEN_WIDTH * pixelDensity;
    const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
    // Consider it a tablet if the smaller dimension is at least 7 inches (roughly 1000 pixels)
    const smallerDimension = Math.min(adjustedWidth, adjustedHeight);
    return smallerDimension >= 1000;
};
exports.isTablet = isTablet;
// Check if device is in landscape mode
const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT;
exports.isLandscape = isLandscape;
// Get responsive value based on screen width
const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
    if (SCREEN_WIDTH >= exports.BREAKPOINTS.desktop && desktopValue) {
        return desktopValue;
    }
    if (SCREEN_WIDTH >= exports.BREAKPOINTS.tablet) {
        return tabletValue;
    }
    return mobileValue;
};
exports.getResponsiveValue = getResponsiveValue;
// Get responsive spacing
const getResponsiveSpacing = () => ({
    xs: (0, exports.getResponsiveValue)(4, 6, 8),
    sm: (0, exports.getResponsiveValue)(8, 12, 16),
    md: (0, exports.getResponsiveValue)(16, 20, 24),
    lg: (0, exports.getResponsiveValue)(24, 32, 40),
    xl: (0, exports.getResponsiveValue)(32, 40, 48),
    xxl: (0, exports.getResponsiveValue)(48, 64, 80),
});
exports.getResponsiveSpacing = getResponsiveSpacing;
// Get responsive font sizes
const getResponsiveFontSizes = () => ({
    small: (0, exports.getResponsiveValue)(12, 14, 16),
    medium: (0, exports.getResponsiveValue)(14, 16, 18),
    large: (0, exports.getResponsiveValue)(16, 18, 20),
    xlarge: (0, exports.getResponsiveValue)(20, 24, 28),
    xxlarge: (0, exports.getResponsiveValue)(24, 28, 32),
    title: (0, exports.getResponsiveValue)(28, 32, 36),
    display: (0, exports.getResponsiveValue)(32, 40, 48),
});
exports.getResponsiveFontSizes = getResponsiveFontSizes;
// Get number of columns for grid layouts
const getGridColumns = (itemWidth, spacing = 16) => {
    const availableWidth = SCREEN_WIDTH - spacing * 2;
    const itemWidthWithSpacing = itemWidth + spacing;
    return Math.floor(availableWidth / itemWidthWithSpacing);
};
exports.getGridColumns = getGridColumns;
// Get adaptive layout props for tablets
const getTabletLayoutProps = () => {
    if (!(0, exports.isTablet)()) {
        return {
            numColumns: 1,
            contentContainerStyle: { paddingHorizontal: 16 },
        };
    }
    return {
        numColumns: (0, exports.isLandscape)() ? 3 : 2,
        contentContainerStyle: {
            paddingHorizontal: 32,
            paddingVertical: 24,
        },
    };
};
exports.getTabletLayoutProps = getTabletLayoutProps;
// Get responsive card width
const getCardWidth = () => {
    if (!(0, exports.isTablet)()) {
        return SCREEN_WIDTH - 32; // Mobile: full width minus padding
    }
    const padding = 64; // Tablet padding
    const spacing = 16; // Spacing between cards
    const columns = (0, exports.isLandscape)() ? 2 : 1;
    return (SCREEN_WIDTH - padding - spacing * (columns - 1)) / columns;
};
exports.getCardWidth = getCardWidth;
// Get responsive modal props
const getModalProps = () => {
    if (!(0, exports.isTablet)()) {
        return {
            style: { margin: 0 },
            backdropTransitionOutTiming: 0,
        };
    }
    return {
        style: {
            justifyContent: 'center',
            alignItems: 'center',
            margin: 40,
        },
        backdropTransitionOutTiming: 300,
    };
};
exports.getModalProps = getModalProps;
// Get responsive navigation props
const getNavigationProps = () => {
    if (!(0, exports.isTablet)()) {
        return {
            tabBarStyle: {
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
            },
        };
    }
    return {
        tabBarStyle: {
            height: 80,
            paddingBottom: 16,
            paddingTop: 16,
        },
        tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '500',
        },
        tabBarIconStyle: {
            marginBottom: 4,
        },
    };
};
exports.getNavigationProps = getNavigationProps;
// Utility to get screen dimensions
const getScreenDimensions = () => ({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isTablet: (0, exports.isTablet)(),
    isLandscape: (0, exports.isLandscape)(),
});
exports.getScreenDimensions = getScreenDimensions;
// Hook to listen to orientation changes
const useOrientation = () => {
    const [orientation, setOrientation] = React.useState({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        isLandscape: (0, exports.isLandscape)(),
    });
    React.useEffect(() => {
        const subscription = react_native_1.Dimensions.addEventListener('change', ({ window }) => {
            setOrientation({
                width: window.width,
                height: window.height,
                isLandscape: window.width > window.height,
            });
        });
        return () => subscription?.remove();
    }, []);
    return orientation;
};
exports.useOrientation = useOrientation;
