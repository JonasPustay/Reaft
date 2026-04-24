module.exports = function babel (api) {
  const isTest = api.env("test");
  api.cache.using(() => process.env.NODE_ENV);

  const plugins = [
    !isTest && [
      "module:react-native-dotenv",
      {
        moduleName: "@env",
        path: ".env",
      },
    ],
    "nativewind/babel",
    "react-native-reanimated/plugin",
  ].filter(Boolean);

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
