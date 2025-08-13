import {Dimensions, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Breakpoints for different screen sizes
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

// Check if device is a tablet
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  // Consider it a tablet if the smaller dimension is at least 7 inches (roughly 1000 pixels)
  const smallerDimension = Math.min(adjustedWidth, adjustedHeight);
  return smallerDimension >= 1000;
};

// Check if device is in landscape mode
export const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT;

// Get responsive value based on screen width
export const getResponsiveValue = (
  mobileValue: number,
  tabletValue: number,
  desktopValue?: number,
) => {
  if (SCREEN_WIDTH >= BREAKPOINTS.desktop && desktopValue) {
    return desktopValue;
  }
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) {
    return tabletValue;
  }
  return mobileValue;
};

// Get responsive spacing
export const getResponsiveSpacing = () => ({
  xs: getResponsiveValue(4, 6, 8),
  sm: getResponsiveValue(8, 12, 16),
  md: getResponsiveValue(16, 20, 24),
  lg: getResponsiveValue(24, 32, 40),
  xl: getResponsiveValue(32, 40, 48),
  xxl: getResponsiveValue(48, 64, 80),
});

// Get responsive font sizes
export const getResponsiveFontSizes = () => ({
  small: getResponsiveValue(12, 14, 16),
  medium: getResponsiveValue(14, 16, 18),
  large: getResponsiveValue(16, 18, 20),
  xlarge: getResponsiveValue(20, 24, 28),
  xxlarge: getResponsiveValue(24, 28, 32),
  title: getResponsiveValue(28, 32, 36),
  display: getResponsiveValue(32, 40, 48),
});

// Get number of columns for grid layouts
export const getGridColumns = (itemWidth: number, spacing: number = 16) => {
  const availableWidth = SCREEN_WIDTH - spacing * 2;
  const itemWidthWithSpacing = itemWidth + spacing;
  return Math.floor(availableWidth / itemWidthWithSpacing);
};

// Get adaptive layout props for tablets
export const getTabletLayoutProps = () => {
  if (!isTablet()) {
    return {
      numColumns: 1,
      contentContainerStyle: {paddingHorizontal: 16},
    };
  }

  return {
    numColumns: isLandscape() ? 3 : 2,
    contentContainerStyle: {
      paddingHorizontal: 32,
      paddingVertical: 24,
    },
  };
};

// Get responsive card width
export const getCardWidth = () => {
  if (!isTablet()) {
    return SCREEN_WIDTH - 32; // Mobile: full width minus padding
  }
  
  const padding = 64; // Tablet padding
  const spacing = 16; // Spacing between cards
  const columns = isLandscape() ? 2 : 1;
  
  return (SCREEN_WIDTH - padding - spacing * (columns - 1)) / columns;
};

// Get responsive modal props
export const getModalProps = () => {
  if (!isTablet()) {
    return {
      style: {margin: 0},
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

// Get responsive navigation props
export const getNavigationProps = () => {
  if (!isTablet()) {
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

// Utility to get screen dimensions
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet: isTablet(),
  isLandscape: isLandscape(),
});

// Hook to listen to orientation changes
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: isLandscape(),
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
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