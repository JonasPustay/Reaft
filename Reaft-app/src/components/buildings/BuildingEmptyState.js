import PropTypes from "prop-types";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function BuildingEmptyState({ onCreatePress }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 px-6 items-center justify-center">
      <View className="items-center">
        <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6">
          <FontAwesome5 name="building" size={38} color="#2563eb" solid />
        </View>
        <Text className="text-xl font-semibold text-center text-gray-900 mb-2">
          {t("buildingEmptyState.title")}
        </Text>
        <Text className="text-center text-gray-500 mb-6">
          {t("buildingEmptyState.description")}
        </Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-full px-6 py-3"
          onPress={onCreatePress}
        >
          <Text className="text-white font-semibold">
            {t("buildingEmptyState.cta")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

BuildingEmptyState.propTypes = {
  onCreatePress: PropTypes.func.isRequired,
};

BuildingEmptyState.defaultProps = {}; 
