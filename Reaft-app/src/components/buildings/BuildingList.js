import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { CONDITION_COLORS, ICON_OPTIONS } from "../../constants/buildings";
import BuildingIcon from "../BuildingIcon";

function BuildingCard({ building, onSelect, onOpenActions }) {
  const { t, i18n } = useTranslation();
  const badgeColors =
    CONDITION_COLORS[building.condition] ?? CONDITION_COLORS.DEFAULT;
  const metricAccentColor = badgeColors.color;
  const metricBgColor = badgeColors.bg;

  const formatCoordinate = (value) =>
    typeof value === "number" ? value.toFixed(4) : "—";

  const rawRepairCost = building.repairCost ?? building.totalRepairCost ?? 0;
  const numericRepairCost = Number(rawRepairCost);
  const repairCost = Number.isFinite(numericRepairCost) ? numericRepairCost : 0;

  let formattedRepairCost = `${repairCost} €`;
  try {
    formattedRepairCost = new Intl.NumberFormat(
      i18n.resolvedLanguage || i18n.language || "fr",
      {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      },
    ).format(repairCost);
  } catch {
    // Keep fallback when Intl cannot format in the active locale.
  }

  return (
    <View className="relative mb-4">
      <TouchableOpacity
        className="rounded-3xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
        onPress={() => onSelect(building)}
        activeOpacity={0.92}
      >
        <View>
          <View className="flex-row items-start pr-12">
            <View className="h-12 w-12 rounded-2xl bg-blue-100 items-center justify-center mr-3 border border-blue-200">
              <BuildingIcon
                iconName={building.icon ?? ICON_OPTIONS[0].icon}
                size={22}
                color="#1d4ed8"
              />
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                {building.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={13} color="#6b7280" />
                <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                  {t("buildingList.coordinates", {
                    latitude: formatCoordinate(building.latitude),
                    longitude: formatCoordinate(building.longitude),
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 flex-row -mx-0.5">
            <View
              className="flex-1 rounded-2xl border px-2 py-3 mx-0.5 items-center justify-center"
              style={{ backgroundColor: metricBgColor, borderColor: metricAccentColor }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={15} color={metricAccentColor} />
                <Text
                  className="text-xs font-medium ml-1 text-center"
                  style={{ color: metricAccentColor }}
                >
                  {t("buildingList.stateShort")}
                </Text>
              </View>
              <Text
                className="text-base font-bold mt-1 text-center"
                style={{ color: metricAccentColor }}
                numberOfLines={1}
              >
                {building.condition ?? "—"}
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl border px-2 py-3 mx-0.5 items-center justify-center"
              style={{ backgroundColor: metricBgColor, borderColor: metricAccentColor }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons
                  name="alert-circle-outline"
                  size={15}
                  color={metricAccentColor}
                />
                <Text
                  className="text-xs font-medium ml-1 text-center"
                  style={{ color: metricAccentColor }}
                >
                  {t("buildingDetail.defectsTitle")}
                </Text>
              </View>
              <Text
                className="text-base font-bold mt-1 text-center"
                style={{ color: metricAccentColor }}
              >
                {building.defectCount ?? 0}
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl border px-2 py-3 mx-0.5 items-center justify-center"
              style={{ backgroundColor: metricBgColor, borderColor: metricAccentColor }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="cash-outline" size={15} color={metricAccentColor} />
                <Text
                  className="text-xs font-medium ml-1 text-center"
                  style={{ color: metricAccentColor }}
                >
                  {t("buildingList.priceShort")}
                </Text>
              </View>
              <Text
                className="text-base font-bold mt-1 text-center"
                style={{ color: metricAccentColor }}
                numberOfLines={1}
              >
                {formattedRepairCost}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={(event) => {
          event?.stopPropagation?.();
          onOpenActions(building);
        }}
        className="absolute top-3 right-3 rounded-full bg-gray-100 border border-gray-200 w-10 h-10 items-center justify-center"
      >
        <Ionicons name="ellipsis-vertical" size={18} color="#4b5563" />
      </TouchableOpacity>
    </View>
  );
}

export default function BuildingList({
  buildings,
  onSelect,
  onOpenActions,
  header,
  contentPadding = 16,
  scrollToId,
  onScrolledTo,
}) {
  const { t } = useTranslation();
  const flatListRef = useRef(null);

  // Scroll vers le bâtiment sélectionné
  useEffect(() => {
    if (scrollToId && flatListRef.current && buildings.length > 0) {
      const index = buildings.findIndex((b) => b.id === scrollToId);
      if (index !== -1) {
        // Petit délai pour s'assurer que la liste est rendue
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.3, // Position le bâtiment à ~30% du haut
          });
          // Après le scroll, appeler le callback pour ouvrir la fiche détaillée
          setTimeout(() => {
            onScrolledTo?.(buildings[index]);
          }, 450);
        }, 100);
      }
    }
  }, [scrollToId, buildings, onScrolledTo]);

  const handleScrollToIndexFailed = (info) => {
    // Fallback si l'index n'est pas encore rendu
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.3,
      });
      setTimeout(() => {
        onScrolledTo?.(buildings[info.index]);
      }, 450);
    }, 500);
  };

  return (
    <FlatList
      ref={flatListRef}
      data={buildings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BuildingCard
          building={item}
          onSelect={onSelect}
          onOpenActions={onOpenActions}
        />
      )}
      contentContainerStyle={{ padding: contentPadding, paddingBottom: 140 }}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      ListHeaderComponent={
        header ?? (
          <View className="mb-4 px-1">
            <Text className="text-sm text-gray-500 text-center">
              {t("buildingList.description")}
            </Text>
          </View>
        )
      }
    />
  );
}

// PropTypes
BuildingCard.propTypes = {
  building: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    latitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    longitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    condition: PropTypes.string,
    defectCount: PropTypes.number,
    repairCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalRepairCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    icon: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onOpenActions: PropTypes.func.isRequired,
};

BuildingList.propTypes = {
  buildings: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func.isRequired,
  onOpenActions: PropTypes.func.isRequired,
  header: PropTypes.node,
  contentPadding: PropTypes.number,
  scrollToId: PropTypes.string,
  onScrolledTo: PropTypes.func,
};

BuildingList.defaultProps = {
  header: undefined,
  contentPadding: 16,
  scrollToId: undefined,
  onScrolledTo: undefined,
};
