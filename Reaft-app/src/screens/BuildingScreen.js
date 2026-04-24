import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import ScreenWrapper from "../components/ScreenWrapper";
import CustomHeader from "../components/CustomHeader";
import BuildingEmptyState from "../components/buildings/BuildingEmptyState";
import BuildingList from "../components/buildings/BuildingList";
import BuildingFormSheet from "../components/buildings/BuildingFormSheet";
import BuildingActionsSheet from "../components/buildings/BuildingActionsSheet";
import BuildingDetailSheet from "../components/buildings/BuildingDetailSheet";
import BuildingReorderSheet from "../components/buildings/BuildingReorderSheet";
import AddDefectPhotoPicker from "../components/defects/AddDefectPhotoPicker";
import DefectDetailSheet from "../components/defects/DefectDetailSheet";
import DefectAnalysisLoadingModal from "../components/defects/DefectAnalysisLoadingModal";
import { analyzeDefectPhotoWithGemini } from "../services/defectAiService";

import { ICON_OPTIONS, STORAGE_KEY } from "../constants/buildings";

const defaultForm = {
  name: "",
  latitude: "",
  longitude: "",
  icon: ICON_OPTIONS[0].icon,
};

const CONDITION_VALUES = ["A", "B", "C", "D", "E", "F"];
const SHEET_CLOSE_WAIT_MS = 260;
const CONDITION_INDEX = CONDITION_VALUES.reduce((acc, value, index) => {
  acc[value] = index;
  return acc;
}, {});

const ACTION_SHEET_TRANSITION_DELAY = 280;
const waitForNextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

const normalizeCoordinateInput = (value) =>
  typeof value === "string" ? value.trim().replace(/,/g, ".") : "";

const parseCoordinateInput = (value) => {
  const normalized = normalizeCoordinateInput(value);
  if (normalized === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return Number.NaN;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const normalizeCondition = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return CONDITION_VALUES.includes(normalized) ? normalized : null;
};

const normalizeRepairCost = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
};

const normalizeBuildingDefects = (building, fallbackTimestamp) => {
  const existingDefects = Array.isArray(building?.defects) ? building.defects : [];
  if (existingDefects.length > 0) return existingDefects;

  return Array.from({ length: building?.defectCount ?? 0 }, (_, index) => ({
    id: `${building?.id}-legacy-defect-${index}`,
    createdAt:
      building?.updatedAt ?? building?.createdAt ?? fallbackTimestamp ?? null,
    photoUri: null,
    damageState: null,
    damageType: null,
    estimatedRepairCost: null,
  }));
};

const deriveBuildingCondition = (defects, fallbackCondition) => {
  if (!Array.isArray(defects) || defects.length === 0) {
    return "A";
  }

  let worstState = null;
  defects.forEach((defect) => {
    const state = normalizeCondition(defect?.damageState);
    if (!state) return;
    if (!worstState || CONDITION_INDEX[state] > CONDITION_INDEX[worstState]) {
      worstState = state;
    }
  });

  return worstState ?? normalizeCondition(fallbackCondition) ?? "A";
};

const deriveBuildingRepairCost = (defects) => {
  const total = defects.reduce((sum, defect) => {
    const parsed = Number(defect?.estimatedRepairCost);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return sum;
    }
    return sum + parsed;
  }, 0);

  return Math.round(total);
};

const withUpdatedBuildingMetrics = (building, defects, updatedAt) => {
  const repairCost = deriveBuildingRepairCost(defects);
  const condition = deriveBuildingCondition(defects, building?.condition);

  return {
    ...building,
    defects,
    defectCount: defects.length,
    condition,
    repairCost,
    totalRepairCost: repairCost,
    updatedAt,
  };
};

export default function BuildingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationFetched, setLocationFetched] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [actionSheet, setActionSheet] = useState({
    visible: false,
    building: null,
  });
  const [detailBuilding, setDetailBuilding] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [defectDetailVisible, setDefectDetailVisible] = useState(false);
  const [reorderVisible, setReorderVisible] = useState(false);
  const [isAnalyzingDefect, setIsAnalyzingDefect] = useState(false);
  const [scrollToId, setScrollToId] = useState(null);
  const deferredActionRef = useRef(null);
  const detailTransitionRef = useRef(null);
  const addDefectPhotoPickerRef = useRef(null);

  const closeActionSheet = useCallback(() => {
    setActionSheet({ visible: false, building: null });
  }, []);

  const clearDeferredAction = useCallback(() => {
    if (deferredActionRef.current) {
      clearTimeout(deferredActionRef.current);
      deferredActionRef.current = null;
    }
  }, []);

  const clearDetailTransition = useCallback(() => {
    if (detailTransitionRef.current) {
      clearTimeout(detailTransitionRef.current);
      detailTransitionRef.current = null;
    }
  }, []);

  const runAfterActionSheetClose = useCallback(
    (callback) => {
      closeActionSheet();
      clearDeferredAction();
      deferredActionRef.current = setTimeout(() => {
        if (typeof callback === "function") {
          callback();
        }
        deferredActionRef.current = null;
      }, ACTION_SHEET_TRANSITION_DELAY);
    },
    [clearDeferredAction, closeActionSheet],
  );

  const runAfterDetailSheetTransition = useCallback(
    (callback) => {
      clearDetailTransition();
      detailTransitionRef.current = setTimeout(() => {
        if (typeof callback === "function") {
          callback();
        }
        detailTransitionRef.current = null;
      }, ACTION_SHEET_TRANSITION_DELAY);
    },
    [clearDetailTransition],
  );

  const timestampFor = (value) => {
    const parsed = Date.parse(value ?? "");
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortedBuildings = useMemo(() => {
    const list = [...buildings];
    const hasCompleteOrder =
      list.length > 0 && list.every((item) => typeof item.order === "number");

    if (hasCompleteOrder) {
      return list.sort((a, b) => {
        const orderA =
          typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB =
          typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) return orderA - orderB;

        return (
          timestampFor(b.updatedAt ?? b.createdAt) -
          timestampFor(a.updatedAt ?? a.createdAt)
        );
      });
    }

    return list.sort(
      (a, b) =>
        timestampFor(b.updatedAt ?? b.createdAt) -
        timestampFor(a.updatedAt ?? a.createdAt),
    );
  }, [buildings]);

  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setBuildings(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.log("Unable to load buildings", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBuildings();
    }, [loadBuildings]),
  );

  // Gérer le scroll vers un bâtiment sélectionné depuis la carte
  useEffect(() => {
    const selectedId = route.params?.selectedBuildingId;
    if (selectedId && !loading && sortedBuildings.length > 0) {
      setScrollToId(selectedId);
      // Réinitialiser après un court délai pour permettre le scroll
      const timer = setTimeout(() => setScrollToId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [route.params?.selectedBuildingId, loading, sortedBuildings]);

  const resetFormState = (overrides = {}) => {
    setForm({ ...defaultForm, ...overrides });
    setFormError("");
    setRequestingLocation(false);
    setLocationMessage("");
    setLocationFetched(false);
    setEditingBuilding(null);
  };

  const closeForm = () => {
    setFormVisible(false);
    setTimeout(() => {
      resetFormState();
    }, 300); // Durée de l'animation de fermeture
  };

  const openCreateModal = () => {
    resetFormState();
    setFormVisible(true);
  };

  const openEditModal = useCallback((building) => {
    if (!building) return;
    setEditingBuilding(building);
    setForm({
      name: building.name ?? "",
      latitude:
        typeof building.latitude === "number"
          ? building.latitude.toString()
          : (building.latitude ?? ""),
      longitude:
        typeof building.longitude === "number"
          ? building.longitude.toString()
          : (building.longitude ?? ""),
      icon: building.icon ?? ICON_OPTIONS[0].icon,
    });
    setFormError("");
    setLocationMessage("");
    setRequestingLocation(false);
    setLocationFetched(false);
    setFormVisible(true);
  }, []);

  const persistBuildings = async (next) => {
    setBuildings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const getNextOrder = () => {
    const existingOrders = buildings
      .map((item) => (typeof item.order === "number" ? item.order : null))
      .filter((value) => value !== null);
    if (existingOrders.length === 0) {
      return buildings.length;
    }
    return Math.max(...existingOrders) + 1;
  };

  const saveDisabled = useMemo(() => {
    const hasName = form.name.trim() !== "";
    const hasLatitudeInput = form.latitude.trim() !== "";
    const hasLongitudeInput = form.longitude.trim() !== "";
    if (!hasName || !hasLatitudeInput || !hasLongitudeInput) {
      return true;
    }

    const latitude = parseCoordinateInput(form.latitude);
    const longitude = parseCoordinateInput(form.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return true;
    }

    return false;
  }, [form.latitude, form.longitude, form.name]);

  const handleSaveBuilding = async () => {
    if (saveDisabled) return;

    const shouldAssignOrder =
      buildings.length > 0 &&
      buildings.every((item) => typeof item.order === "number");

    const latitude = parseCoordinateInput(form.latitude);
    const longitude = parseCoordinateInput(form.longitude);

    if (form.latitude.trim() !== "" && Number.isNaN(latitude)) {
      setFormError(t("buildingScreen.errors.invalidLatitude"));
      return;
    }

    if (form.longitude.trim() !== "" && Number.isNaN(longitude)) {
      setFormError(t("buildingScreen.errors.invalidLongitude"));
      return;
    }

    try {
      setSaving(true);
      const existingDefects = Array.isArray(editingBuilding?.defects)
        ? editingBuilding.defects
        : [];
      const existingDefectCount =
        typeof editingBuilding?.defectCount === "number"
          ? editingBuilding.defectCount
          : existingDefects.length;

      const payload = {
        ...editingBuilding,
        id: editingBuilding?.id ?? `${Date.now()}`,
        name: form.name.trim(),
        latitude,
        longitude,
        condition: normalizeCondition(editingBuilding?.condition) ?? "A",
        defects: existingDefects,
        defectCount: existingDefectCount,
        repairCost: normalizeRepairCost(
          editingBuilding?.repairCost ?? editingBuilding?.totalRepairCost ?? 0,
        ),
        totalRepairCost: normalizeRepairCost(
          editingBuilding?.repairCost ?? editingBuilding?.totalRepairCost ?? 0,
        ),
        icon: form.icon,
        order:
          editingBuilding?.order ??
          (shouldAssignOrder ? getNextOrder() : undefined),
        createdAt: editingBuilding?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const next = editingBuilding
        ? buildings.map((item) =>
            item.id === editingBuilding.id ? payload : item,
          )
        : [...buildings, payload];

      await persistBuildings(next);
      closeForm();
    } catch (error) {
      console.log("Unable to save building", error);
      setFormError(t("buildingScreen.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletion = (building) => {
    Alert.alert(
      t("buildingScreen.delete.title"),
      t("buildingScreen.delete.message", { name: building.name }),
      [
        { text: t("buildingScreen.delete.cancel"), style: "cancel" },
        {
          text: t("buildingScreen.delete.confirm"),
          style: "destructive",
          onPress: () => {
            const filtered = buildings.filter(
              (item) => item.id !== building.id,
            );
            persistBuildings(filtered);
          },
        },
      ],
    );
  };

  const handleUseMyLocation = async () => {
    if (locationFetched || requestingLocation) {
      return;
    }

    setLocationMessage("");
    setRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationMessage(t("buildingScreen.location.permissionRequired"));
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setForm((prev) => ({
        ...prev,
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      }));
      setLocationMessage("");
      Alert.alert(t("buildingScreen.location.success"));
      setLocationFetched(true);
    } catch (error) {
      console.log("Unable to get location", error);
      setLocationMessage(t("buildingScreen.location.failed"));
    } finally {
      setRequestingLocation(false);
    }
  };

  const openReorderSheet = () => {
    runAfterActionSheetClose(() => setReorderVisible(true));
  };

  const handleCloseReorder = () => {
    setReorderVisible(false);
  };

  const handleApplyReorder = async (orderedItems) => {
    if (!Array.isArray(orderedItems)) return;

    const withOrder = orderedItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    await persistBuildings(withOrder);
    setReorderVisible(false);
  };

  useEffect(() => {
    return () => {
      clearDeferredAction();
      clearDetailTransition();
    };
  }, [clearDeferredAction, clearDetailTransition]);

  const handleEditFromActions = () => {
    const target = actionSheet.building;
    if (!target) {
      closeActionSheet();
      return;
    }

    runAfterActionSheetClose(() => openEditModal(target));
  };

  const handleSelectBuilding = (building) => {
    setDetailBuilding(building);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    clearDetailTransition();
    setDetailVisible(false);
    setDefectDetailVisible(false);
    setSelectedDefect(null);
  };

  const handleSelectDefect = useCallback((defect) => {
    if (!defect?.id) return;
    setSelectedDefect(defect);
    setDetailVisible(false);
    runAfterDetailSheetTransition(() => {
      setDefectDetailVisible(true);
    });
  }, [runAfterDetailSheetTransition]);

  const handleCloseDefectDetail = useCallback(() => {
    setDefectDetailVisible(false);
    if (!detailBuilding) return;
    runAfterDetailSheetTransition(() => {
      setDetailVisible(true);
    });
  }, [detailBuilding, runAfterDetailSheetTransition]);

  const executeDeleteSelectedDefect = useCallback(async () => {
    const targetBuildingId = detailBuilding?.id;
    const targetDefectId = selectedDefect?.id;
    if (!targetBuildingId || !targetDefectId) return;

    // Fermer immédiatement la fiche défaut pour éviter les clignotements
    // pendant le persist asynchrone.
    setDefectDetailVisible(false);
    setSelectedDefect(null);
    setDetailVisible(true);

    const updatedAt = new Date().toISOString();
    let hasUpdatedTarget = false;
    const next = buildings.map((item) => {
      if (item.id !== targetBuildingId) return item;
      hasUpdatedTarget = true;

      const existingDefects = Array.isArray(item.defects) ? item.defects : [];
      const normalizedDefects =
        existingDefects.length > 0
          ? existingDefects
          : normalizeBuildingDefects(item, updatedAt);
      const defects = normalizedDefects.filter(
        (defect) => defect.id !== targetDefectId,
      );

      return withUpdatedBuildingMetrics(item, defects, updatedAt);
    });

    if (!hasUpdatedTarget) return;
    await persistBuildings(next);
    const updatedDetailBuilding =
      next.find((item) => item.id === targetBuildingId) ?? null;
    setDetailBuilding(updatedDetailBuilding);
  }, [
    buildings,
    detailBuilding?.id,
    selectedDefect?.id,
  ]);

  const handleDeleteSelectedDefect = useCallback(() => {
    Alert.alert(
      t("defectDetail.deleteTitle"),
      t("defectDetail.deleteMessage"),
      [
        {
          text: t("defectDetail.deleteCancel"),
          style: "cancel",
        },
        {
          text: t("defectDetail.deleteConfirm"),
          style: "destructive",
          onPress: () => {
            executeDeleteSelectedDefect();
          },
        },
      ],
    );
  }, [executeDeleteSelectedDefect, t]);

  const handleDefectPhotoSelected = useCallback(
    async (photoPayload) => {
      const targetBuildingId = detailBuilding?.id;
      const photoUri = photoPayload?.uri;
      if (!photoUri || !targetBuildingId) return;
      if (!photoPayload?.base64) {
        Alert.alert(
          t("buildingDetail.photoDataErrorTitle"),
          t("buildingDetail.photoDataErrorMessage"),
        );
        return;
      }

      if (isAnalyzingDefect) return;

      const shouldRestoreDetailAfterAnalysis = detailVisible;
      if (shouldRestoreDetailAfterAnalysis) {
        setDetailVisible(false);
        await new Promise((resolve) => {
          setTimeout(resolve, SHEET_CLOSE_WAIT_MS);
        });
      }

      setIsAnalyzingDefect(true);
      // Laisse l'UI peindre l'overlay de chargement avant l'appel réseau.
      await waitForNextFrame();
      const createdAt = new Date().toISOString();
      try {
        const aiAnalysis = await analyzeDefectPhotoWithGemini({
          photoBase64: photoPayload.base64,
          mimeType: photoPayload.mimeType,
          building: detailBuilding,
        });

        if (!aiAnalysis.hasDefect) {
          Alert.alert(
            t("buildingDetail.noDefectDetectedTitle"),
            t("buildingDetail.noDefectDetectedMessage"),
          );
          return;
        }

        let hasUpdatedTarget = false;
        const next = buildings.map((item) => {
          if (item.id !== targetBuildingId) return item;
          hasUpdatedTarget = true;

          const normalizedDefects = normalizeBuildingDefects(item, createdAt);
          const newDefect = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            photoUri,
            createdAt,
            damageState: aiAnalysis.damageState,
            damageType: aiAnalysis.damageType,
            estimatedRepairCost: aiAnalysis.estimatedRepairCostEur,
            aiConfidence: aiAnalysis.confidence,
            aiModel: aiAnalysis.model,
            aiSummary: aiAnalysis.summary,
          };

          const defects = [newDefect, ...normalizedDefects];
          return withUpdatedBuildingMetrics(item, defects, createdAt);
        });

        if (!hasUpdatedTarget) return;
        await persistBuildings(next);
        const updatedDetailBuilding =
          next.find((item) => item.id === targetBuildingId) ?? null;
        setDetailBuilding(updatedDetailBuilding);

        Alert.alert(
          t("buildingDetail.photoSelectedTitle"),
          t("buildingDetail.photoSelectedMessage"),
        );
      } catch (error) {
        console.log("Unable to analyze defect photo", error);
        if (`${error?.message}`.includes("missing_ai_proxy_url")) {
          Alert.alert(
            t("buildingDetail.geminiNotConfiguredTitle"),
            t("buildingDetail.geminiNotConfiguredMessage"),
          );
          return;
        }

        Alert.alert(
          t("buildingDetail.analysisFailedTitle"),
          t("buildingDetail.analysisFailedMessage"),
        );
      } finally {
        setIsAnalyzingDefect(false);
        if (shouldRestoreDetailAfterAnalysis) {
          setDetailVisible(true);
        }
      }
    },
    [buildings, detailBuilding, detailVisible, isAnalyzingDefect, t],
  );

  const handleAddDefect = useCallback(() => {
    if (!detailBuilding?.id || isAnalyzingDefect) return;
    addDefectPhotoPickerRef.current?.open();
  }, [detailBuilding?.id, isAnalyzingDefect]);

  const handleFormChange = (key, value) => {
    setFormError("");
    if (key === "latitude" || key === "longitude") {
      setLocationFetched(false);
      setLocationMessage("");
      setForm((prev) => ({
        ...prev,
        [key]: typeof value === "string" ? value.replace(/,/g, ".") : value,
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Contenu principal : évite les ternaires imbriqués pour la lisibilité
  const content = (() => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-gray-500">{t("buildingScreen.loading")}</Text>
        </View>
      );
    }

    if (sortedBuildings.length === 0) {
      return <BuildingEmptyState onCreatePress={openCreateModal} />;
    }

    return (
      <BuildingList
        buildings={sortedBuildings}
        onSelect={handleSelectBuilding}
        onOpenActions={(building) => setActionSheet({ visible: true, building })}
        scrollToId={scrollToId}
        onScrolledTo={(building) => {
          // Ouvrir automatiquement la fiche détaillée si la navigation demandait
          if (
            route.params?.selectedBuildingId &&
            building?.id === route.params.selectedBuildingId
          ) {
            setDetailBuilding(building);
            setDetailVisible(true);
            // Effacer le param pour éviter réouvertures non voulues
            navigation.setParams({ selectedBuildingId: undefined });
          }
        }}
      />
    );
  })();

  return (
    <ScreenWrapper scrollable={false}>
      <CustomHeader title={t("buildingScreen.title")} />
      <View className="flex-1 bg-gray-50">{content}

        {sortedBuildings.length > 0 && (
          <TouchableOpacity
            className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-16 h-16 items-center justify-center shadow-lg shadow-blue-300"
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <BuildingFormSheet
        visible={formVisible}
        onClose={closeForm}
        form={form}
        onChange={handleFormChange}
        onSave={handleSaveBuilding}
        saving={saving}
        formError={formError}
        onUseLocation={handleUseMyLocation}
        requestingLocation={requestingLocation}
        locationLocked={locationFetched}
        locationMessage={locationMessage}
        saveDisabled={saveDisabled}
        editing={Boolean(editingBuilding)}
      />

      <BuildingActionsSheet
        visible={actionSheet.visible}
        onClose={closeActionSheet}
        onEdit={handleEditFromActions}
        onDelete={() => {
          const target = actionSheet.building;
          closeActionSheet();
          if (target) confirmDeletion(target);
        }}
        onReorder={openReorderSheet}
      />

      <AddDefectPhotoPicker
        ref={addDefectPhotoPickerRef}
        onPhotoSelected={handleDefectPhotoSelected}
      />

      <BuildingDetailSheet
        visible={detailVisible}
        building={detailBuilding}
        onClose={handleCloseDetail}
        onAddDefect={handleAddDefect}
        onSelectDefect={handleSelectDefect}
      />

      <DefectDetailSheet
        visible={defectDetailVisible}
        defect={selectedDefect}
        onClose={handleCloseDefectDetail}
        onDelete={handleDeleteSelectedDefect}
      />

      <BuildingReorderSheet
        visible={reorderVisible}
        buildings={sortedBuildings}
        onClose={handleCloseReorder}
        onApply={handleApplyReorder}
      />

      <DefectAnalysisLoadingModal visible={isAnalyzingDefect} />
    </ScreenWrapper>
  );
}
