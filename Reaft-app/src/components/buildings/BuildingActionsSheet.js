import PropTypes from "prop-types";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import BottomSheet from "./BottomSheet";

export default function BuildingActionsSheet({
  visible,
  onClose,
  onEdit,
  onDelete,
  onReorder,
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-base font-semibold text-gray-900 mb-4 text-center">
        {t("buildingActions.title")}
      </Text>

      <TouchableOpacity className="flex-row items-center py-3" onPress={onReorder}>
        <Ionicons name="swap-vertical" size={20} color="#0ea5e9" />
        <Text className="ml-3 text-base text-gray-800">
          {t("buildingActions.reorder")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="flex-row items-center py-3" onPress={onEdit}>
        <Ionicons name="create-outline" size={20} color="#2563eb" />
        <Text className="ml-3 text-base text-gray-800">
          {t("buildingActions.edit")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="flex-row items-center py-3" onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
        <Text className="ml-3 text-base text-red-500">
          {t("buildingActions.delete")}
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

BuildingActionsSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onReorder: PropTypes.func,
};

BuildingActionsSheet.defaultProps = {
  onEdit: undefined,
  onDelete: undefined,
  onReorder: undefined,
};
