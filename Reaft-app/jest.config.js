module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test/setup.js"],
  testMatch: ["<rootDir>/test/**/*.test.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "^@env$": "<rootDir>/test/__mocks__/@env.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(expo|@expo|react-native|@react-native|nativewind|react-native-purchases|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-vector-icons|react-native-draggable-flatlist|react-native-localize|expo-modules-core)/)",
  ],
};
