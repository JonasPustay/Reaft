import { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import PropTypes from "prop-types";
import BottomSheet from "./BottomSheet";
import { CONDITION_COLORS } from "../../constants/buildings";

const normalizeCondition = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : null;

const asDisplayText = (value, fallback, maxLength = 40) => {
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length === 0) return fallback;
    return normalized.slice(0, maxLength);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
};

export default function BuildingDetailSheet({
  visible,
  building,
  onClose,
  onAddDefect,
  onSelectDefect,
}) {
  const { t, i18n } = useTranslation();

  const badgeColors =
    CONDITION_COLORS[normalizeCondition(building?.condition)] ??
    CONDITION_COLORS.DEFAULT;

  const defects = useMemo(() => {
    if (!building) {
      return [];
    }

    if (Array.isArray(building.defects) && building.defects.length > 0) {
      return building.defects.map((defect, index) => ({
        id: defect.id ?? `${building.id ?? "building"}-defect-${index}`,
        photoUri: defect.photoUri ?? null,
        createdAt: defect.createdAt ?? null,
        damageState: defect.damageState ?? null,
        damageType: defect.damageType ?? null,
        estimatedRepairCost: defect.estimatedRepairCost ?? null,
        aiConfidence: defect.aiConfidence ?? null,
        aiSummary: defect.aiSummary ?? null,
      }));
    }

    return Array.from({ length: building.defectCount ?? 0 }, (_, index) => ({
      id: `${building.id ?? "building"}-legacy-defect-${index}`,
      photoUri: null,
      createdAt: building.updatedAt ?? building.createdAt ?? null,
      damageState: null,
      damageType: null,
      estimatedRepairCost: null,
      aiConfidence: null,
      aiSummary: null,
    }));
  }, [building]);

  const repairCostValue = useMemo(() => {
    const rawCost = building?.repairCost ?? building?.totalRepairCost ?? 0;
    const numericCost = Number(rawCost);
    return Number.isFinite(numericCost) ? numericCost : 0;
  }, [building]);

  const formattedRepairCost = useMemo(() => {
    const locale = i18n.resolvedLanguage || i18n.language || "fr";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(repairCostValue);
    } catch {
      return `${repairCostValue} €`;
    }
  }, [i18n.language, i18n.resolvedLanguage, repairCostValue]);

  const formatDefectCost = (value) => {
    const numericCost = Number(value);
    if (!Number.isFinite(numericCost) || numericCost < 0) {
      return t("buildingDetail.unknownValue");
    }
    try {
      return new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language || "fr", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(numericCost);
    } catch {
      return `${Math.round(numericCost)} €`;
    }
  };

  if (!building) return null;

  const unknownValueLabel = t("buildingDetail.unknownValue");
  const conditionLabel = asDisplayText(building.condition, unknownValueLabel, 10);

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.68}>
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerCard}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-semibold text-gray-900">
                  {building.name}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {t("buildingDetail.coordinates", {
                    latitude:
                      typeof building.latitude === "number"
                        ? building.latitude.toFixed(5)
                        : "-",
                    longitude:
                      typeof building.longitude === "number"
                        ? building.longitude.toFixed(5)
                        : "-",
                  })}
                </Text>
              </View>

              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: badgeColors.bg }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: badgeColors.color }}
                >
                  {t("buildingDetail.stateLabel", { condition: conditionLabel })}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardRightSpacing]}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="cash-outline" size={16} color="#0f766e" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">{t("buildingList.priceShort")}</Text>
                  <Text className="text-sm font-semibold text-gray-800 mt-0.5" numberOfLines={1}>
                    {formattedRepairCost}
                  </Text>
                </View>
              </View>

              <View style={[styles.statCard, styles.statCardLeftSpacing]}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="warning-outline" size={16} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">{t("buildingDetail.defectsTitle")}</Text>
                  <Text className="text-sm font-semibold text-gray-800 mt-0.5">
                    {defects.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.defectsSectionCard}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-900">
                {t("buildingDetail.defectsTitle")}
              </Text>
              <View style={styles.countPill}>
                <Text className="text-xs font-semibold text-blue-700">
                  {defects.length}
                </Text>
              </View>
            </View>

            <View style={styles.listWrapper}>
              {defects.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={24}
                      color="#10b981"
                    />
                  </View>
                  <Text className="text-sm text-gray-500 mt-2 text-center">
                    {t("buildingDetail.noDefects")}
                  </Text>
                </View>
              ) : (
                defects.map((defect, index) => {
                  const defectConditionKey = normalizeCondition(defect.damageState);
                  const defectConditionColors =
                    CONDITION_COLORS[defectConditionKey] ?? CONDITION_COLORS.DEFAULT;

                  return (
                    <TouchableOpacity
                      key={defect.id}
                      style={styles.defectCard}
                      activeOpacity={0.82}
                      onPress={() =>
                        onSelectDefect?.({
                          ...defect,
                          index: index + 1,
                        })
                      }
                    >
                      <View style={styles.defectLeft}>
                        <View
                          style={[
                            styles.defectIndexBadge,
                            { backgroundColor: defectConditionColors.bg },
                          ]}
                        >
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: defectConditionColors.color }}
                          >
                            {index + 1}
                          </Text>
                        </View>

                        <View className="flex-1 min-w-0">
                          <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                            {t("buildingDetail.defectLabel", { index: index + 1 })}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                            {t("buildingDetail.defectStateType", {
                              state: asDisplayText(defect.damageState, unknownValueLabel, 18),
                              type: asDisplayText(defect.damageType, unknownValueLabel, 26),
                            })}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                            {t("buildingDetail.defectRepairPrice", {
                              amount: formatDefectCost(defect.estimatedRepairCost),
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.defectRight}>
                        {defect.photoUri ? (
                          <Image
                            source={{ uri: defect.photoUri }}
                            style={styles.defectPhoto}
                          />
                        ) : (
                          <View style={styles.defectPhotoPlaceholder}>
                            <Ionicons name="image-outline" size={17} color="#94a3b8" />
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close-outline" size={16} color="#475569" />
          <Text className="font-semibold text-slate-600 ml-2" numberOfLines={1}>
            {t("buildingDetail.close")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddDefect}
        >
          <Ionicons name="add-outline" size={16} color="#fff" />
          <Text className="font-semibold text-white ml-2" numberOfLines={1}>
            {t("buildingDetail.addDefect")}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

BuildingDetailSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  building: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    condition: PropTypes.string,
    defectCount: PropTypes.number,
    repairCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalRepairCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    defects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        photoUri: PropTypes.string,
        createdAt: PropTypes.string,
        damageState: PropTypes.string,
        damageType: PropTypes.string,
        estimatedRepairCost: PropTypes.oneOfType([
          PropTypes.number,
          PropTypes.string,
        ]),
        aiConfidence: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        aiSummary: PropTypes.string,
      }),
    ),
  }),
  onClose: PropTypes.func.isRequired,
  onAddDefect: PropTypes.func,
  onSelectDefect: PropTypes.func,
};

BuildingDetailSheet.defaultProps = {
  building: null,
  onAddDefect: undefined,
  onSelectDefect: undefined,
};

const styles = StyleSheet.create({
  contentWrapper: {
    maxHeight: 420,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  headerCard: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 22,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  statCardRightSpacing: {
    marginRight: 5,
  },
  statCardLeftSpacing: {
    marginLeft: 5,
  },
  statIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#ecfeff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  defectsSectionCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexShrink: 1,
  },
  countPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
  },
  listWrapper: {
    paddingBottom: 6,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyStateIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  defectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  defectLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  defectIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  defectRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },
  defectPhoto: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
  },
  defectPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  footerActions: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: -14,
  },
  closeButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    marginRight: 5,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    marginLeft: 5,
  },
});
