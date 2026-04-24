import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import BottomSheet from "./BottomSheet";
import IconPickerSheet from "./IconPickerSheet";
import BuildingIcon from "../BuildingIcon";
import BuildingLocationPicker from "./BuildingLocationPicker";

export default function BuildingFormSheet({
  visible,
  onClose,
  form,
  onChange,
  onSave,
  saving,
  formError,
  onUseLocation,
  requestingLocation,
  locationLocked,
  locationMessage,
  saveDisabled,
  editing,
}) {
  const { t } = useTranslation();
  const [pickingIcon, setPickingIcon] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      setPickingIcon(false);
      setPickingLocation(false);
    }
  }, [visible]);

  const formHeader = (
    <>
      <Text className="text-xl font-semibold text-center text-gray-900 mb-1">
        {editing ? t("buildingForm.titleEdit") : t("buildingForm.titleCreate")}
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        {t("buildingForm.subtitle")}
      </Text>
    </>
  );

  const pickerHeader = (
    <>
      <Text className="text-xl font-semibold text-center text-gray-900 mb-1">
        {t("buildingForm.iconTitle")}
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-4">
        {t("buildingForm.iconSubtitle")}
      </Text>
    </>
  );

  const locationHeader = (
    <>
      <Text className="text-xl font-semibold text-center text-gray-900 mb-1">
        {t("buildingForm.mapTitle")}
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-4">
        {t("buildingForm.mapSubtitle")}
      </Text>
    </>
  );

  const headerComponent = pickingIcon
    ? pickerHeader
    : pickingLocation
      ? locationHeader
      : formHeader;

  const renderFormContent = () => (
    <>
      <View className="flex-row items-stretch mb-6">
        <TouchableOpacity
          className="items-center justify-center mr-4"
          onPress={() => setPickingIcon(true)}
          activeOpacity={0.8}
          style={{ width: 76 }}
        >
          <View className="w-full flex-1 rounded-2xl bg-blue-50 items-center justify-center border border-blue-100">
            <BuildingIcon iconName={form.icon} size={32} color="#2563eb" />
          </View>
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-xs uppercase text-gray-400 mb-2">
            {t("buildingForm.nameLabel")}
          </Text>
          <TextInput
            placeholder={t("buildingForm.namePlaceholder")}
            value={form.name}
            onChangeText={(text) => onChange("name", text)}
            className="border border-gray-200 rounded-2xl px-4 py-3 text-md text-gray-900"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs uppercase text-gray-400 mb-2">
          {t("buildingForm.positionLabel")}
        </Text>

        <View className="flex-row">
          <View className="flex-1 mr-2">
            <TextInput
              placeholder={t("buildingForm.latitudePlaceholder")}
              keyboardType="decimal-pad"
              value={form.latitude}
              onChangeText={(text) => onChange("latitude", text)}
              className="border border-gray-200 rounded-2xl px-4 py-3 text-md text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View className="flex-1 ml-2">
            <TextInput
              placeholder={t("buildingForm.longitudePlaceholder")}
              keyboardType="decimal-pad"
              value={form.longitude}
              onChangeText={(text) => onChange("longitude", text)}
              className="border border-gray-200 rounded-2xl px-4 py-3 text-md text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setPickingLocation(true)}
          disabled={requestingLocation}
          className="mt-3 flex-row items-center justify-center bg-blue-600 border border-blue-600 rounded-2xl px-4 py-3"
        >
          <Ionicons name="map-outline" size={18} color="#fff" />
          <Text className="ml-2 text-sm font-semibold text-white">
            {t("buildingForm.selectOnMap")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onUseLocation}
          disabled={requestingLocation || locationLocked}
          className="mt-2 flex-row items-center justify-center border border-blue-100 rounded-2xl px-4 py-3"
        >
          {requestingLocation ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <Ionicons name="navigate-outline" size={18} color="#2563eb" />
              <Text className="ml-2 text-sm font-semibold text-blue-600">
                {t("buildingForm.useCurrentLocation")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!!locationMessage && (
          <Text className="text-xs text-blue-500 mt-2 text-center">
            {locationMessage}
          </Text>
        )}
      </View>

      {!!formError && (
        <Text className="text-sm text-red-500 mb-2">{formError}</Text>
      )}

      <View className="flex-row mt-2 mb-2">
        <TouchableOpacity
          className="flex-1 mr-2 border border-gray-200 rounded-2xl py-3 items-center"
          onPress={onClose}
          disabled={saving}
        >
          <Text className="font-semibold text-gray-600">
            {t("buildingForm.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 ml-2 rounded-2xl py-3 items-center ${
            saveDisabled ? "bg-blue-200" : "bg-blue-600"
          }`}
          onPress={onSave}
          disabled={saving || saveDisabled}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">
              {editing ? t("buildingForm.update") : t("buildingForm.save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      headerComponent={headerComponent}
    >
      {pickingIcon ? (
        <IconPickerSheet
          value={form.icon}
          onSelect={(icon) => {
            onChange("icon", icon);
            setPickingIcon(false);
          }}
          onClose={() => setPickingIcon(false)}
        />
      ) : pickingLocation ? (
        <BuildingLocationPicker
          latitudeValue={form.latitude}
          longitudeValue={form.longitude}
          onCancel={() => setPickingLocation(false)}
          onConfirm={({ latitude, longitude }) => {
            onChange("latitude", latitude.toFixed(6));
            onChange("longitude", longitude.toFixed(6));
            setPickingLocation(false);
          }}
        />
      ) : (
        renderFormContent()
      )}
    </BottomSheet>
  );
}

BuildingFormSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  formError: PropTypes.string,
  onUseLocation: PropTypes.func,
  requestingLocation: PropTypes.bool,
  locationLocked: PropTypes.bool,
  locationMessage: PropTypes.string,
  saveDisabled: PropTypes.bool,
  editing: PropTypes.bool,
};

BuildingFormSheet.defaultProps = {
  saving: false,
  formError: undefined,
  onUseLocation: undefined,
  requestingLocation: false,
  locationLocked: false,
  locationMessage: undefined,
  saveDisabled: false,
  editing: false,
};
