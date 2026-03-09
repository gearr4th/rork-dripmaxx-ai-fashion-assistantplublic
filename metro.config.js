const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    "react-native/src/private/inspector/getInspectorDataForViewAtPoint": path.resolve(
      __dirname,
      "shims/getInspectorDataForViewAtPoint.js"
    ),
    "react-native/src/private/inspector/InspectorOverlay": path.resolve(
      __dirname,
      "shims/InspectorOverlay.js"
    ),
  },
};

module.exports = withRorkMetro(config);
