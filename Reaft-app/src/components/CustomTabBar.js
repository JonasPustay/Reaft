import { useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { View, Text, Animated, TouchableWithoutFeedback } from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import { Ionicons } from "@expo/vector-icons";

export default function TabBar({ state, navigation }) {
  const { t } = useTranslation();
  const tabs = useMemo(
    () => [
      { key: "building", label: t("tabs.building"), icon: "home-outline" },
      { key: "map", label: t("tabs.map"), icon: "map-outline" },
      { key: "settings", label: t("tabs.settings"), icon: "settings-outline" },
    ],
    [t],
  );

  // Currently selected tab
  const activeTab = state.routes[state.index].name;

  // Create individual animated scale values for each tab
  const bounceRefs = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = new Animated.Value(1);
      return acc;
    }, {})
  );

  // When activeTab changes, animate the selected tab and reset others
  useEffect(() => {
    tabs.forEach((tab) => {
      const ref = bounceRefs.current[tab.key];

      if (tab.key === activeTab) {
        // Bounce animation for the selected tab
        Animated.sequence([
          Animated.timing(ref, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(ref, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Instantly reset scale of other tabs
        ref.setValue(1);
      }
    });
  }, [activeTab]);

  return (
    <View className="flex-row bg-white border-t border-gray-200 py-3">
      {/* Render each tab button */}
      {tabs.map((tab) => {
        const isFocused = activeTab === tab.key;
        const bounceValue = bounceRefs.current[tab.key];

        return (
          <TouchableWithoutFeedback
            key={tab.key}
            onPress={() => {
              if (activeTab !== tab.key) {
                Haptics.selectionAsync();
                navigation.navigate(tab.key);
              }
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                transform: [{ scale: bounceValue }],
              }}
            >
              <Ionicons
                name={tab.icon}
                size={24}
                color={isFocused ? "#2563eb" : "#9ca3af"}
              />
              <Text
                className={`text-xs ${
                  isFocused ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {tab.label}
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        );
      })}
    </View>
  );
}

TabBar.propTypes = {
  state: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

TabBar.defaultProps = {};
