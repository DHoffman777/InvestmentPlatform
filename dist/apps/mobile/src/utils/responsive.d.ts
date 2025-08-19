export declare const BREAKPOINTS: {
    mobile: number;
    tablet: number;
    desktop: number;
};
export declare const isTablet: () => boolean;
export declare const isLandscape: () => boolean;
export declare const getResponsiveValue: (mobileValue: number, tabletValue: number, desktopValue?: number) => number;
export declare const getResponsiveSpacing: () => {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
};
export declare const getResponsiveFontSizes: () => {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
    title: number;
    display: number;
};
export declare const getGridColumns: (itemWidth: number, spacing?: number) => number;
export declare const getTabletLayoutProps: () => {
    numColumns: number;
    contentContainerStyle: {
        paddingHorizontal: number;
        paddingVertical?: undefined;
    };
} | {
    numColumns: number;
    contentContainerStyle: {
        paddingHorizontal: number;
        paddingVertical: number;
    };
};
export declare const getCardWidth: () => number;
export declare const getModalProps: () => {
    style: {
        margin: number;
        justifyContent?: undefined;
        alignItems?: undefined;
    };
    backdropTransitionOutTiming: number;
} | {
    style: {
        justifyContent: string;
        alignItems: string;
        margin: number;
    };
    backdropTransitionOutTiming: number;
};
export declare const getNavigationProps: () => {
    tabBarStyle: {
        height: number;
        paddingBottom: number;
        paddingTop: number;
    };
    tabBarLabelStyle?: undefined;
    tabBarIconStyle?: undefined;
} | {
    tabBarStyle: {
        height: number;
        paddingBottom: number;
        paddingTop: number;
    };
    tabBarLabelStyle: {
        fontSize: number;
        fontWeight: string;
    };
    tabBarIconStyle: {
        marginBottom: number;
    };
};
export declare const getScreenDimensions: () => {
    width: number;
    height: number;
    isTablet: boolean;
    isLandscape: boolean;
};
export declare const useOrientation: () => {
    width: number;
    height: number;
    isLandscape: boolean;
};
