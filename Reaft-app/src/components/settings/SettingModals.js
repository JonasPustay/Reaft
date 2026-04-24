import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";

import { STORAGE_KEY } from "../../constants/buildings";

const APP_LANGUAGE_KEY = "appLanguage";
const LANGUAGE_OPTIONS = ["fr", "en", "es"];
const DATA_EXPORT_SCHEMA_VERSION = 1;
const EXPORT_FILE_PREFIX = "reaft-buildings";

const extractBuildingsFromImportedPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray(payload.buildings)
  ) {
    return payload.buildings;
  }

  return null;
};

const normalizeImportedBuildings = (buildings) => {
  const fallbackIdPrefix = String(Date.now());

  return buildings
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      ...item,
      id: item.id ? String(item.id) : `${fallbackIdPrefix}-${index}`,
    }));
};

const readStoredBuildings = async () => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  const parsed = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed : [];
};

const buildExportFileUri = () => {
  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDirectory) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${baseDirectory}${EXPORT_FILE_PREFIX}-${timestamp}.json`;
};

export const ManageDataModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeleteData = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      await AsyncStorage.removeItem(STORAGE_KEY);

      Alert.alert(
        t("settingModals.deleteData.successTitle"),
        t("settingModals.deleteData.successMessage"),
        [
          {
            text: t("settingModals.deleteData.successButton"),
            onPress: onClose,
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        t("settingModals.deleteData.errorTitle"),
        t("settingModals.deleteData.errorMessage"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDeleteData = () => {
    if (isProcessing) return;

    Alert.alert(
      t("settingModals.deleteData.title"),
      t("settingModals.deleteData.description"),
      [
        {
          text: t("settingModals.deleteData.cancel"),
          style: "cancel",
        },
        {
          text: t("settingModals.deleteData.confirm"),
          style: "destructive",
          onPress: handleDeleteData,
        },
      ],
    );
  };

  const handleExportData = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const buildings = await readStoredBuildings();
      const fileUri = buildExportFileUri();

      if (!fileUri) {
        throw new Error("EXPORT_DIRECTORY_UNAVAILABLE");
      }

      const payload = {
        app: "Reaft",
        schemaVersion: DATA_EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        buildings,
      };

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(payload, null, 2),
        {
          encoding: FileSystem.EncodingType.UTF8,
        },
      );

      await Share.share({
        title: t("settingModals.manageData.export.shareTitle"),
        url: fileUri,
      });

      Alert.alert(
        t("settingModals.manageData.export.successTitle"),
        t("settingModals.manageData.export.successMessage", {
          count: buildings.length,
        }),
      );
    } catch (error) {
      Alert.alert(
        t("settingModals.manageData.export.errorTitle"),
        t("settingModals.manageData.export.errorMessage"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportData = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/json", "text/plain"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedAsset = result.assets?.[0];
      if (!selectedAsset?.uri) {
        throw new Error("IMPORT_FILE_UNAVAILABLE");
      }

      const fileContent = await FileSystem.readAsStringAsync(selectedAsset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsed = JSON.parse(fileContent);
      const importedBuildings = extractBuildingsFromImportedPayload(parsed);

      if (!importedBuildings) {
        Alert.alert(
          t("settingModals.manageData.import.invalidTitle"),
          t("settingModals.manageData.import.invalidMessage"),
        );
        return;
      }

      const normalizedBuildings = normalizeImportedBuildings(importedBuildings);

      if (importedBuildings.length > 0 && normalizedBuildings.length === 0) {
        Alert.alert(
          t("settingModals.manageData.import.invalidTitle"),
          t("settingModals.manageData.import.invalidMessage"),
        );
        return;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedBuildings));

      Alert.alert(
        t("settingModals.manageData.import.successTitle"),
        t("settingModals.manageData.import.successMessage", {
          count: normalizedBuildings.length,
        }),
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        Alert.alert(
          t("settingModals.manageData.import.invalidTitle"),
          t("settingModals.manageData.import.invalidMessage"),
        );
        return;
      }

      Alert.alert(
        t("settingModals.manageData.import.errorTitle"),
        t("settingModals.manageData.import.errorMessage"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 py-10 justify-center">
      <View className="w-full rounded-3xl bg-white border border-slate-100 px-5 py-6 shadow-sm">
        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
          {t("settingModals.manageData.title")}
        </Text>
        <Text className="text-center text-slate-500 leading-6 mb-6">
          {t("settingModals.manageData.description")}
        </Text>

        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className={`flex-1 rounded-2xl border px-3 py-4 items-center ${
              isProcessing
                ? "bg-blue-100 border-blue-200"
                : "bg-blue-50 border-blue-200"
            }`}
            onPress={handleExportData}
            disabled={isProcessing}
          >
            <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mb-3">
              <FontAwesome5 name="file-export" size={16} color="#1d4ed8" solid />
            </View>
            <Text className="text-center font-semibold text-blue-800 text-sm">
              {t("settingModals.manageData.actions.export")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 rounded-2xl border px-3 py-4 items-center ${
              isProcessing
                ? "bg-emerald-100 border-emerald-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
            onPress={handleImportData}
            disabled={isProcessing}
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center mb-3">
              <FontAwesome5 name="file-import" size={16} color="#047857" solid />
            </View>
            <Text className="text-center font-semibold text-emerald-800 text-sm">
              {t("settingModals.manageData.actions.import")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-px bg-slate-100 mb-4" />

        <TouchableOpacity
          className={`w-full py-3.5 rounded-xl border items-center justify-center ${
            isProcessing
              ? "bg-red-50 border-red-100"
              : "bg-red-50 border-red-200"
          }`}
          onPress={handleConfirmDeleteData}
          disabled={isProcessing}
        >
          <Text className="font-semibold text-red-700">
            {t("settingModals.manageData.actions.delete")}
          </Text>
        </TouchableOpacity>

        {isProcessing && (
          <View className="mt-4 flex-row items-center justify-center bg-slate-50 py-2.5 rounded-xl">
            <ActivityIndicator size="small" color="#334155" />
            <Text className="ml-2 text-sm text-slate-600">
              {t("settingModals.manageData.processing")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export const ChangeLanguageModal = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "fr"
  ).split("-")[0];

  const handleLanguageChange = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, languageCode);
    } catch (error) {
      // On garde l'app fonctionnelle même en cas d'échec du stockage.
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-4 text-gray-900 text-center">
        {t("settingModals.changeLanguage.title")}
      </Text>
      <Text className="text-center text-gray-500 mb-6">
        {t("settingModals.changeLanguage.subtitle")}
      </Text>

      <View className="w-full mb-6 gap-3">
        {LANGUAGE_OPTIONS.map((languageCode) => {
          const isSelected = currentLanguage === languageCode;
          return (
            <TouchableOpacity
              key={languageCode}
              className={`w-full py-3.5 rounded-xl items-center justify-center ${
                isSelected ? "bg-blue-600" : "bg-gray-100"
              }`}
              onPress={() => handleLanguageChange(languageCode)}
            >
              <Text
                className={`font-semibold ${
                  isSelected ? "text-white" : "text-gray-700"
                }`}
              >
                {t(`settingModals.changeLanguage.options.${languageCode}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        className="w-full py-3.5 rounded-xl bg-gray-200 items-center justify-center"
        onPress={onClose}
      >
        <Text className="font-semibold text-gray-700">
          {t("settingModals.changeLanguage.close")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const PlaceholderModal = ({ title, onClose }) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-4 text-gray-900 text-center">
        {title}
      </Text>
      <Text className="text-center text-gray-500 mb-6">
        {t("settingModals.placeholder.soon")}
      </Text>
      <TouchableOpacity
        className="w-full py-3.5 rounded-xl bg-gray-200 items-center justify-center"
        onPress={onClose}
      >
        <Text className="font-semibold text-gray-700">
          {t("settingModals.placeholder.close")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
