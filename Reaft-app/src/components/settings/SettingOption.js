// components/SettingOption.js
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons"; // Utilise la même bibliothèque que dans BuildingList

export default function SettingOption({ title, icon, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 px-4 py-5"
    >
      <View className="flex-row items-center">
        {icon && (
          <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3">
            <FontAwesome5
              name={icon}
              size={20}
              color="#2563eb" // Bleu identique à BuildingList
              solid
            />
          </View>
        )}
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
      </View>

      <FontAwesome5 name="chevron-right" size={18} color="#2563eb" solid />
    </TouchableOpacity>
  );
}
