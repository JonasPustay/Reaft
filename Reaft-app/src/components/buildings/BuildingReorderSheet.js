import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { CONDITION_COLORS, ICON_OPTIONS } from "../../constants/buildings";
import BuildingIcon from "../BuildingIcon";
import BottomSheet from "./BottomSheet";

const DEFAULT_ICON = ICON_OPTIONS[0].icon;
const LIST_HEIGHT = Math.round(Dimensions.get("window").height * 0.44);

export default function BuildingReorderSheet({
  visible,
  onClose,
  buildings = [],
  onApply,
}) {
  const { t } = useTranslation();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (visible) {
      setData(Array.isArray(buildings) ? [...buildings] : []);
    }
  }, [visible, buildings]);

  const handleDragEnd = ({ data: reordered }) => {
    setData(reordered);
  };

  const handleSave = async () => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    if (typeof onApply === "function") {
      await onApply(data);
    }
  };

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const headerComponent = (
    <View className="rounded-3xl bg-slate-50 border border-slate-200 px-4 py-4">
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-200 items-center justify-center mr-3">
          <Ionicons name="swap-vertical" size={20} color="#1d4ed8" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">
            {t("buildingActions.reorder")}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            {t("buildingReorder.helper")}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item, drag, isActive, getIndex }) => {
    const colors = CONDITION_COLORS[item.condition] ?? CONDITION_COLORS.DEFAULT;
    const resolvedIndex =
      typeof getIndex === "function"
        ? getIndex()
        : data.findIndex((building) => building.id === item.id);
    const displayIndex =
      typeof resolvedIndex === "number" && resolvedIndex >= 0
        ? resolvedIndex + 1
        : null;

    return (
      <View
        className={`flex-row items-center rounded-2xl border px-3.5 py-3 mb-3 ${
          isActive
            ? "bg-blue-50 border-blue-300 shadow-sm"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <View
          className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${
            isActive ? "bg-blue-600" : "bg-slate-200"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isActive ? "text-white" : "text-slate-700"
            }`}
          >
            {displayIndex ?? "•"}
          </Text>
        </View>

        <View className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-200 items-center justify-center mr-3">
          <BuildingIcon
            iconName={item.icon ?? DEFAULT_ICON}
            size={19}
            color="#1d4ed8"
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-900">
            {item.name || t("buildingReorder.defaultName")}
          </Text>
          <View className="flex-row items-center mt-1">
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.bg }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.color }}
              >
                {t("buildingReorder.stateLabel", {
                  condition: item.condition ?? "—",
                })}
              </Text>
            </View>
            <View className="flex-row items-center ml-3">
              <Ionicons name="alert-circle-outline" size={12} color="#f97316" />
              <Text className="text-xs text-slate-500 ml-1">
                {t("buildingReorder.defectCount", {
                  count: item.defectCount ?? 0,
                })}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPressIn={drag}
          className={`ml-2 w-10 h-10 rounded-xl items-center justify-center border active:opacity-70 ${
            isActive
              ? "bg-blue-100 border-blue-300"
              : "bg-white border-slate-200"
          }`}
          accessibilityRole="button"
        >
          <FontAwesome5
            name="grip-vertical"
            size={16}
            color={isActive ? "#1d4ed8" : "#64748b"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      maxHeight={0.88}
      headerComponent={headerComponent}
    >
      <View style={{ height: LIST_HEIGHT }}>
        {data.length === 0 ? (
          <View className="flex-1 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center">
              <Ionicons name="business-outline" size={32} color="#94a3b8" />
            </View>
            <Text className="mt-4 text-sm text-slate-500 text-center">
              {t("buildingReorder.emptyState")}
            </Text>
          </View>
        ) : (
          <View className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-3 pt-3">
            <DraggableFlatList
              data={data}
              keyExtractor={(item) => String(item.id)}
              onDragEnd={handleDragEnd}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              activationDistance={8}
            />
          </View>
        )}
      </View>

      <View className="flex-row mt-4">
        <TouchableOpacity
          className="flex-1 mr-2 border border-slate-200 bg-white rounded-2xl py-3 items-center"
          onPress={handleClose}
        >
          <View className="flex-row items-center">
            <Ionicons name="close-outline" size={18} color="#475569" />
            <Text className="font-semibold text-slate-600 ml-1.5">
              {t("buildingReorder.cancel")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 ml-2 rounded-2xl py-3 items-center ${
            data.length === 0 ? "bg-blue-200" : "bg-blue-600"
          }`}
          activeOpacity={0.9}
          onPress={handleSave}
          disabled={data.length === 0}
        >
          <View className="flex-row items-center">
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text className="font-semibold text-white ml-1.5">
              {t("buildingReorder.save")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

BuildingReorderSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  buildings: PropTypes.array,
  onApply: PropTypes.func.isRequired,
};

BuildingReorderSheet.defaultProps = {
  buildings: [],
};
