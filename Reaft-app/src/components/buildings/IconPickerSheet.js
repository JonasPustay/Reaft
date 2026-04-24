import { Text, TouchableOpacity, View } from "react-native";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { ICON_OPTIONS } from "../../constants/buildings";
import BuildingIcon from "../BuildingIcon";

export default function IconPickerSheet({ onClose, onSelect, value }) {
  const { t } = useTranslation();

  return (
    <View>
      <View className="flex-row flex-wrap -mx-1 mb-2">
        {ICON_OPTIONS.map((option) => {
          const selected = option.icon === value;
          return (
            <TouchableOpacity
              key={option.icon}
              className="w-1/3 px-1 mb-3"
              onPress={() => onSelect(option.icon)}
            >
              <View
                className={`rounded-2xl border px-3 py-4 items-center ${
                  selected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <BuildingIcon
                  iconName={option.icon}
                  size={24}
                  color={selected ? "#2563eb" : "#6b7280"}
                />
                <Text
                  className={`mt-2 text-sm ${
                    selected ? "text-blue-700 font-semibold" : "text-gray-600"
                  }`}
                >
                  {t(option.labelKey)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        className="border border-gray-200 rounded-2xl py-3 items-center mb-2"
        onPress={onClose}
      >
        <Text className="font-semibold text-gray-600">{t("iconPicker.back")}</Text>
      </TouchableOpacity>
    </View>
  );
}

IconPickerSheet.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  value: PropTypes.string,
};

IconPickerSheet.defaultProps = {
  value: undefined,
};
