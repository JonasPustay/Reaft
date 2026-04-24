module.exports = function babel (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ],
      "nativewind/babel",
      "react-native-reanimated/plugin",
    ],
  };
};
