import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { Ionicons } from "@expo/vector-icons";

import BottomSheet from "../buildings/BottomSheet";
import { CONDITION_COLORS } from "../../constants/buildings";

function formatDate(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString();
}

function asDisplayText(value, fallback, maxLength = 120) {
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length === 0) return fallback;
    return normalized.slice(0, maxLength);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function normalizeCondition(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : null;
}

function AiMetricRow({ icon, iconColor, text, style }) {
  return (
    <View style={[styles.metricRow, style]}>
      <View style={[styles.metricIconWrapper, { backgroundColor: `${iconColor}1a` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text className="flex-1 text-sm text-gray-700 leading-5">{text}</Text>
    </View>
  );
}

export default function DefectDetailSheet({
  visible,
  defect,
  onClose,
  onDelete,
}) {
  const { t, i18n } = useTranslation();
  if (!defect) return null;

  const createdAtLabel = formatDate(
    defect.createdAt,
    t("defectDetail.createdAtUnknown"),
  );

  let formattedRepairCost = t("defectDetail.unknownValue");
  const numericCost = Number(defect.estimatedRepairCost);
  if (Number.isFinite(numericCost) && numericCost >= 0) {
    try {
      formattedRepairCost = new Intl.NumberFormat(
        i18n.resolvedLanguage || i18n.language || "fr",
        {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        },
      ).format(numericCost);
    } catch {
      formattedRepairCost = `${Math.round(numericCost)} €`;
    }
  }

  let confidenceLabel = t("defectDetail.unknownValue");
  const confidence = Number(defect.aiConfidence);
  if (Number.isFinite(confidence)) {
    const percent = Math.round(Math.min(1, Math.max(0, confidence)) * 100);
    confidenceLabel = `${percent}%`;
  }

  const unknownValueLabel = t("defectDetail.unknownValue");
  const damageStateLabel = asDisplayText(
    defect.damageState,
    unknownValueLabel,
    20,
  );
  const damageTypeLabel = asDisplayText(
    defect.damageType,
    unknownValueLabel,
    40,
  );
  const summaryLabel = asDisplayText(defect.aiSummary, "", 240);
  const normalizedState = normalizeCondition(defect.damageState);
  const stateBadgeColors =
    CONDITION_COLORS[normalizedState] ?? CONDITION_COLORS.DEFAULT;

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.56}>
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerCard}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-semibold text-gray-900">
                  {t("defectDetail.title", { index: defect.index })}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {t("defectDetail.createdAt", { date: createdAtLabel })}
                </Text>
              </View>

              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: stateBadgeColors.bg }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: stateBadgeColors.color }}
                >
                  {damageStateLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.photoCard}>
            {defect.photoUri ? (
              <>
                <Image
                  source={{ uri: defect.photoUri }}
                  className="w-full h-64 bg-gray-100"
                />
                <View style={styles.photoTag}>
                  <Ionicons name="sparkles-outline" size={14} color="#0f766e" />
                  <Text className="text-xs font-semibold text-teal-800 ml-1.5">
                    IA
                  </Text>
                </View>
              </>
            ) : (
              <View className="w-full h-44 items-center justify-center bg-gray-100">
                <Ionicons name="image-outline" size={28} color="#94a3b8" />
                <Text className="text-sm text-gray-500 mt-2">
                  {t("defectDetail.noPhoto")}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.aiCard}>
            <Text className="text-sm font-semibold text-gray-900 mb-3">
              {t("defectDetail.aiSectionTitle")}
            </Text>
            <AiMetricRow
              icon="shield-checkmark-outline"
              iconColor="#0284c7"
              text={t("defectDetail.damageState", {
                value: damageStateLabel,
              })}
            />
            <AiMetricRow
              icon="hammer-outline"
              iconColor="#7c3aed"
              text={t("defectDetail.damageType", {
                value: damageTypeLabel,
              })}
            />
            <AiMetricRow
              icon="cash-outline"
              iconColor="#16a34a"
              text={t("defectDetail.estimatedRepairCost", {
                amount: formattedRepairCost,
              })}
            />
            <AiMetricRow
              icon="analytics-outline"
              iconColor="#f59e0b"
              text={t("defectDetail.confidence", { value: confidenceLabel })}
              style={{ marginBottom: 0 }}
            />

            {summaryLabel.length > 0 ? (
              <View style={styles.summaryCard}>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4f46e5" />
                  <Text className="text-xs font-semibold uppercase tracking-wide text-indigo-700 ml-2">
                    {t("defectDetail.aiSectionTitle")}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 leading-5" numberOfLines={6}>
                  {summaryLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={16} color="#475569" />
          <Text className="font-semibold text-slate-600 ml-2">
            {t("defectDetail.back")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text className="font-semibold text-white ml-2">
            {t("defectDetail.delete")}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

AiMetricRow.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

AiMetricRow.defaultProps = {
  style: null,
};

DefectDetailSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  defect: PropTypes.shape({
    id: PropTypes.string,
    index: PropTypes.number,
    photoUri: PropTypes.string,
    createdAt: PropTypes.string,
    damageState: PropTypes.string,
    damageType: PropTypes.string,
    estimatedRepairCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    aiConfidence: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    aiSummary: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

DefectDetailSheet.defaultProps = {
  defect: null,
};

const styles = StyleSheet.create({
  contentWrapper: {
    maxHeight: 380,
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
  photoCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: 12,
  },
  photoTag: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#99f6e4",
    flexDirection: "row",
    alignItems: "center",
  },
  aiCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 22,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  metricIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  summaryCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0e7ff",
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footerActions: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 2,
  },
  backButton: {
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
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#dc2626",
    marginLeft: 5,
  },
});
