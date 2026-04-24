import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Text, TouchableOpacity, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE_URL,
} from "../../constants/mapbox";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const DEFAULT_WORLD_CENTER = [0, 20];
const DEFAULT_WORLD_ZOOM = 1.2;
const SELECTED_POINT_ZOOM = 14;

const isValidLatitude = (value) =>
  typeof value === "number" && value >= -90 && value <= 90;

const isValidLongitude = (value) =>
  typeof value === "number" && value >= -180 && value <= 180;

const parseCoordinateValue = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/,/g, ".");
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getInitialCoordinate = (latitudeValue, longitudeValue) => {
  const latitude = parseCoordinateValue(latitudeValue);
  const longitude = parseCoordinateValue(longitudeValue);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }
  return [longitude, latitude];
};

export default function BuildingLocationPicker({
  latitudeValue,
  longitudeValue,
  onCancel,
  onConfirm,
}) {
  const { t, i18n } = useTranslation();
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [mapHeading, setMapHeading] = useState(0);
  const cameraRef = useRef(null);

  useEffect(() => {
    setSelectedCoordinate(getInitialCoordinate(latitudeValue, longitudeValue));
  }, [latitudeValue, longitudeValue]);

  const initialCameraSettings = useMemo(() => {
    const initialCoordinate = getInitialCoordinate(latitudeValue, longitudeValue);
    if (initialCoordinate) {
      return {
        centerCoordinate: initialCoordinate,
        zoomLevel: SELECTED_POINT_ZOOM,
      };
    }

    return {
      centerCoordinate: DEFAULT_WORLD_CENTER,
      zoomLevel: DEFAULT_WORLD_ZOOM,
    };
  }, [latitudeValue, longitudeValue]);

  const handleMapPress = (event) => {
    const coordinates = event?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;

    const [longitude, latitude] = coordinates;
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return;
    setSelectedCoordinate([longitude, latitude]);
  };

  const handleCameraChanged = (state) => {
    const heading = state?.properties?.heading;
    if (typeof heading !== "number") return;
    const normalizedHeading = ((heading % 360) + 360) % 360;
    setMapHeading(normalizedHeading);
  };

  const handleResetNorth = () => {
    if (!cameraRef.current) return;
    cameraRef.current.setCamera({
      heading: 0,
      pitch: 0,
      animationDuration: 500,
    });
  };

  const handleConfirm = () => {
    if (!selectedCoordinate || typeof onConfirm !== "function") return;
    const [longitude, latitude] = selectedCoordinate;
    onConfirm({ latitude, longitude });
  };

  const selectedLatitude = selectedCoordinate?.[1];
  const selectedLongitude = selectedCoordinate?.[0];

  return (
    <>
      <View className="h-80 rounded-2xl overflow-hidden border border-slate-200">
        <Mapbox.MapView
          className="flex-1"
          styleURL={MAPBOX_STYLE_URL}
          onPress={handleMapPress}
          onCameraChanged={handleCameraChanged}
          onMapIdle={handleCameraChanged}
          localizeLabels={{
            locale: i18n?.language ?? "fr",
          }}
          surfaceView={false}
          logoEnabled={false}
          attributionEnabled={false}
          scaleBarEnabled={false}
        >
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={initialCameraSettings}
            animationDuration={0}
          />

          {selectedCoordinate ? (
            <Mapbox.MarkerView
              id="building-location-selection"
              coordinate={selectedCoordinate}
            >
              <View className="items-center">
                <View className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center border-2 border-white">
                  <Ionicons name="location" size={19} color="#fff" />
                </View>
              </View>
            </Mapbox.MarkerView>
          ) : null}
        </Mapbox.MapView>

        <TouchableOpacity
          onPress={handleResetNorth}
          className="absolute bottom-3 left-3 bg-white rounded-full w-11 h-11 justify-center items-center shadow"
          activeOpacity={0.8}
        >
          <View
            style={{
              transform: [{ rotate: `${-mapHeading}deg` }],
            }}
            className="items-center justify-center"
          >
            <Text className="text-[9px] font-extrabold text-red-600 leading-none">
              N
            </Text>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderBottomWidth: 11,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: "#DC2626",
                marginTop: 1,
              }}
            />
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 5,
                borderRightWidth: 5,
                borderTopWidth: 9,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#9CA3AF",
                marginTop: 1,
              }}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View className="mt-3 px-1">
        {selectedCoordinate ? (
          <Text className="text-xs text-slate-600 text-center">
            {t("buildingList.coordinates", {
              latitude: selectedLatitude.toFixed(6),
              longitude: selectedLongitude.toFixed(6),
            })}
          </Text>
        ) : (
          <Text className="text-xs text-slate-500 text-center">
            {t("buildingForm.mapNoSelection")}
          </Text>
        )}
      </View>

      <View className="flex-row mt-2 mb-2">
        <TouchableOpacity
          className="flex-1 mr-2 border border-slate-200 rounded-2xl py-3 items-center"
          onPress={onCancel}
        >
          <Text className="font-semibold text-slate-600">
            {t("buildingForm.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 ml-2 rounded-2xl py-3 items-center ${
            selectedCoordinate ? "bg-blue-600" : "bg-blue-200"
          }`}
          onPress={handleConfirm}
          disabled={!selectedCoordinate}
        >
          <Text className="font-semibold text-white">
            {t("buildingForm.mapConfirm")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

BuildingLocationPicker.propTypes = {
  latitudeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  longitudeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

BuildingLocationPicker.defaultProps = {
  latitudeValue: "",
  longitudeValue: "",
};
