module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-firebase|react-native-vector-icons|@react-native-async-storage|react-native-gesture-handler|@react-native-google-signin|react-native-linear-gradient|react-native-date-picker|react-native-image-picker|@react-native-ml-kit|react-native-gifted-chat|react-native-parsed-text|react-native-lightbox-v2)/)',
  ],
};
