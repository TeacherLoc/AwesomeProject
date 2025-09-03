const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    resetCache: true,
    resolver: {
      // Suppress warnings from specific packages
      blacklistRE: /(node_modules\/.*\/package\.json$)/,
    },
    server: {
      // Suppress server warnings
      verbose: false,
    },
  };

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
