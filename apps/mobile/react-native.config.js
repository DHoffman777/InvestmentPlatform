module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: {
          sourceDir: '../node_modules/react-native-vector-icons/Fonts',
          fontFiles: ['*.ttf'],
        },
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/Fonts',
          fontFiles: ['*.ttf'],
        },
      },
    },
  },
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
    android: {
      sourceDir: './android',
      appName: 'InvestmentPlatform',
      packageName: 'com.investmentplatform.mobile',
    },
  },
};