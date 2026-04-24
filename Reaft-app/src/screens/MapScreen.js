import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import * as RNLocalize from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { STORAGE_KEY, CONDITION_COLORS } from "../constants/buildings";
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE_URL,
} from "../constants/mapbox";

import BuildingIcon from "../components/BuildingIcon";
import ScreenWrapper from "../components/ScreenWrapper";
import CustomHeader from "../components/CustomHeader";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Clé de cache pour le géocodage inversé
const GEOCODE_CACHE_KEY = "@reaft/geocode_cache";
const GEOCODE_CACHE_VERSION_KEY = "@reaft/geocode_cache_version";
const GEOCODE_CACHE_VERSION = 2; // v2: locality prioritaire sur place

// Reverse geocoding Mapbox : récupère commune, département, région
// Utilise locality (commune précise) en priorité sur place (grande ville/métropole)
const reverseGeocode = async (lon, lat, language = "fr") => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=locality,place,district,region&language=${language}`;
    const response = await fetch(url);
    const data = await response.json();

    let locality = null;
    let place = null;
    let department = null;
    let region = null;

    for (const feature of data.features || []) {
      if (feature.place_type?.includes("locality")) locality = feature.text;
      if (feature.place_type?.includes("place")) place = feature.text;
      if (feature.place_type?.includes("district")) department = feature.text;
      if (feature.place_type?.includes("region")) region = feature.text;
    }

    // Prioriser locality (ex: Saint-Genis-Laval) sur place (ex: Lyon)
    const city = locality ?? place;

    return { city, department, region };
  } catch {
    return { city: null, department: null, region: null };
  }
};

// Calculer la distance de clustering en fonction du zoom
// Adapté aux différentes échelles géographiques
const getClusterDistance = (zoomLevel) => {
  // Zoom 0-3 : Vue monde/continent (~2000km = ~20 degrés)
  if (zoomLevel < 3) return 20;
  // Zoom 3-5 : Vue continent (~500km = ~5 degrés)
  if (zoomLevel < 5) return 5;
  // Zoom 5-7 : Vue pays (~200km = ~2 degrés)
  if (zoomLevel < 7) return 2;
  // Zoom 7-9 : Vue région (~50km = ~0.5 degré)
  if (zoomLevel < 9) return 0.5;
  // Zoom 9-11 : Vue département (~20km = ~0.2 degré)
  if (zoomLevel < 11) return 0.2;
  // Zoom 11-13 : Vue ville (~5km = ~0.05 degré)
  if (zoomLevel < 13) return 0.05;
  // Zoom 13-15 : Vue quartier (~1km = ~0.01 degré)
  if (zoomLevel < 15) return 0.01;
  // Zoom 15-16 : Vue rue (~200m = ~0.002 degré)
  if (zoomLevel < 16) return 0.002;
  // Zoom 16-17 : Vue proche (~50m = ~0.0005 degré)
  if (zoomLevel < 17) return 0.0005;
  // Zoom 17+ : Pas de clustering, bâtiments individuels
  return 0;
};

// Helper: dériver un label (ville/département/région) à partir d'un ensemble de bâtiments
const deriveLabelFromMembers = (members) => {
  if (!Array.isArray(members) || members.length === 0) return null;
  const keys = ["city", "department", "region"];
  for (const key of keys) {
    const names = members.map((b) => b[key]).filter(Boolean);
    if (names.length === 0) continue;
    const unique = [...new Set(names)];
    if (unique.length === 1) return unique[0];
    const freq = names.reduce((acc, n) => {
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }
  return null;
};

const CONDITION_LABEL_KEYS = {
  A: "mapScreen.conditions.A",
  B: "mapScreen.conditions.B",
  C: "mapScreen.conditions.C",
  D: "mapScreen.conditions.D",
  E: "mapScreen.conditions.E",
  F: "mapScreen.conditions.F",
};

export default function MapScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useState();
  const [isFollowing, setIsFollowing] = useState(false);
  const [locateClickCount, setLocateClickCount] = useState(0);
  const [pendingNorthReset, setPendingNorthReset] = useState(false);
  const [isInitializingMapCenter, setIsInitializingMapCenter] = useState(true);
  const [initialMapCenter, setInitialMapCenter] = useState(null);
  const [mapHeading, setMapHeading] = useState(0);
  const [buildings, setBuildings] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  // Seuil de clustering actuel — ne change que quand on franchit un palier
  const [clusterThreshold, setClusterThreshold] = useState(() =>
    getClusterDistance(15),
  );
  const cameraRef = useRef(null);
  const hasCenteredFromLocationRef = useRef(false);

  // Animations
  const popupAnimation = useRef(new Animated.Value(0)).current;
  const buildingAnimations = useRef({}).current;
  const clusterAnimations = useRef({}).current;
  const prevClusteredRef = useRef([]);

  const updateClusterThresholdFromZoom = useCallback((zoom) => {
    if (typeof zoom !== "number") return;
    const newThreshold = getClusterDistance(zoom);
    setClusterThreshold((prev) => (prev === newThreshold ? prev : newThreshold));
  }, []);

  const syncClusterThresholdWithCamera = useCallback(async () => {
    try {
      const zoom = await cameraRef.current?.getZoom?.();
      updateClusterThresholdFromZoom(zoom);
    } catch {
      // Ignore les erreurs silencieusement, la sync se fera au prochain événement caméra.
    }
  }, [updateClusterThresholdFromZoom]);

  // Regrouper les bâtiments par division administrative ou par distance
  const clusteredBuildings = useMemo(() => {
    if (!buildings || buildings.length === 0) return [];

    // Déterminer le niveau de clustering administratif selon le seuil
    // threshold >= 2 → région (zoom < 7)
    // threshold >= 0.2 → département (zoom 7-11)
    // threshold >= 0.01 → ville (zoom 11-15)
    // threshold < 0.01 → distance ou individuel
    let adminKey = null;
    if (clusterThreshold >= 2) {
      adminKey = "region";
    } else if (clusterThreshold >= 0.2) {
      adminKey = "department";
    } else if (clusterThreshold >= 0.01) {
      adminKey = "city";
    }

    // Clustering par division administrative
    if (adminKey) {
      const groups = {};
      const ungrouped = [];

      buildings.forEach((b) => {
        const key = b[adminKey];
        if (key) {
          if (!groups[key]) groups[key] = [];
          groups[key].push(b);
        } else {
          ungrouped.push(b);
        }
      });

      const clusters = [];

      Object.entries(groups).forEach(([name, members]) => {
        if (members.length > 1) {
          // Plusieurs bâtiments dans la même zone → cluster
          const avgLon =
            members.reduce((sum, b) => sum + b.coordinates[0], 0) /
            members.length;
          const avgLat =
            members.reduce((sum, b) => sum + b.coordinates[1], 0) /
            members.length;

          clusters.push({
            id: `cluster-${adminKey}-${name}`,
            isCluster: true,
            buildings: members,
            count: members.length,
            coordinates: [avgLon, avgLat],
            label: name,
          });
        } else {
          // Un seul bâtiment dans cette zone → vérifier s'il peut être
          // regroupé avec d'autres bâtiments proches par distance
          // pour éviter qu'un bâtiment isolé dans sa ville apparaisse
          // seul alors que le zoom est encore large
          const solo = members[0];
          const nearbyFromOtherGroups = buildings.filter((other) => {
            if (other.id === solo.id) return false;
            const latDiff = Math.abs(
              solo.coordinates[1] - other.coordinates[1],
            );
            const lonDiff = Math.abs(
              solo.coordinates[0] - other.coordinates[0],
            );
            return latDiff < clusterThreshold && lonDiff < clusterThreshold;
          });

          if (nearbyFromOtherGroups.length > 0) {
            // Il est proche d'autres bâtiments → former un cluster par proximité
            // (sera géré par le regroupement par distance ci-dessous)
            ungrouped.push(solo);
          } else {
            clusters.push({ ...solo, isCluster: false });
          }
        }
      });

      // Regrouper les bâtiments non-groupés par distance (bâtiments seuls dans
      // leur zone mais proches d'autres bâtiments d'une zone différente)
      if (ungrouped.length > 1) {
        const processed = new Set();
        ungrouped.forEach((building) => {
          if (processed.has(building.id)) return;

          const nearby = ungrouped.filter((other) => {
            if (processed.has(other.id)) return false;
            const latDiff = Math.abs(
              building.coordinates[1] - other.coordinates[1],
            );
            const lonDiff = Math.abs(
              building.coordinates[0] - other.coordinates[0],
            );
            return latDiff < clusterThreshold && lonDiff < clusterThreshold;
          });

          if (nearby.length > 1) {
            const avgLon =
              nearby.reduce((sum, b) => sum + b.coordinates[0], 0) /
              nearby.length;
            const avgLat =
              nearby.reduce((sum, b) => sum + b.coordinates[1], 0) /
              nearby.length;

            // Dériver un label depuis les infos administratives des membres
            const label = deriveLabelFromMembers(nearby);

            clusters.push({
              id: `cluster-dist-${building.id}`,
              isCluster: true,
              buildings: nearby,
              count: nearby.length,
              coordinates: [avgLon, avgLat],
              label,
            });
            nearby.forEach((b) => processed.add(b.id));
          } else {
            clusters.push({ ...building, isCluster: false });
            processed.add(building.id);
          }
        });
      } else {
        ungrouped.forEach((b) => {
          clusters.push({ ...b, isCluster: false });
        });
      }

      return clusters;
    }

    // Zoom proche : pas de clustering
    if (clusterThreshold === 0) {
      return buildings.map((b) => ({ ...b, isCluster: false }));
    }

    // Zoom intermédiaire (quartier/rue) : clustering par distance
    const clusterDistance = clusterThreshold;
    const clusters = [];
    const processed = new Set();

    buildings.forEach((building) => {
      if (processed.has(building.id)) return;

      const nearbyBuildings = buildings.filter((other) => {
        if (processed.has(other.id)) return false;
        const latDiff = Math.abs(
          building.coordinates[1] - other.coordinates[1],
        );
        const lonDiff = Math.abs(
          building.coordinates[0] - other.coordinates[0],
        );
        return latDiff < clusterDistance && lonDiff < clusterDistance;
      });

      if (nearbyBuildings.length > 1) {
        const avgLon =
          nearbyBuildings.reduce((sum, b) => sum + b.coordinates[0], 0) /
          nearbyBuildings.length;
        const avgLat =
          nearbyBuildings.reduce((sum, b) => sum + b.coordinates[1], 0) /
          nearbyBuildings.length;

        // Dériver un label depuis les infos géo des bâtiments
        const distLabel = deriveLabelFromMembers(nearbyBuildings);
        clusters.push({
          id: `cluster-${building.id}`,
          isCluster: true,
          buildings: nearbyBuildings,
          count: nearbyBuildings.length,
          coordinates: [avgLon, avgLat],
          label: distLabel,
        });

        nearbyBuildings.forEach((b) => processed.add(b.id));
      } else {
        clusters.push({
          ...building,
          isCluster: false,
        });
        processed.add(building.id);
      }
    });

    return clusters;
  }, [buildings, clusterThreshold]);

  // Animer les transitions entre clusters et bâtiments individuels
  useEffect(() => {
    if (!clusteredBuildings || clusteredBuildings.length === 0) return;

    const prevItems = prevClusteredRef.current;
    const prevIds = new Set(prevItems.map((item) => item.id));
    const currentIds = new Set(clusteredBuildings.map((item) => item.id));

    // Pré-initialiser les animated values pour les nouveaux éléments
    clusteredBuildings.forEach((item) => {
      const animKey = item.id;
      if (!prevIds.has(item.id)) {
        if (item.isCluster) {
          if (!clusterAnimations[animKey]) {
            clusterAnimations[animKey] = new Animated.Value(0);
          } else {
            clusterAnimations[animKey].setValue(0);
          }
        } else {
          if (!buildingAnimations[animKey]) {
            buildingAnimations[animKey] = new Animated.Value(0);
          } else {
            buildingAnimations[animKey].setValue(0);
          }
        }
      }
    });

    // Collecter toutes les animations d'apparition (spring pour un rebond naturel)
    const appearAnimations = clusteredBuildings
      .filter((item) => !prevIds.has(item.id))
      .map((item) => {
        const anim = item.isCluster
          ? clusterAnimations[item.id]
          : buildingAnimations[item.id];
        return Animated.spring(anim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        });
      });

    // Collecter toutes les animations de disparition (fade-out doux)
    const disappearAnimations = prevItems
      .filter((item) => !currentIds.has(item.id))
      .map((item) => {
        const anim = item.isCluster
          ? clusterAnimations[item.id]
          : buildingAnimations[item.id];
        if (!anim) return null;
        return Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        });
      })
      .filter(Boolean);

    // Séquence : disparitions rapides puis apparitions spring (cross-fade)
    if (disappearAnimations.length > 0 && appearAnimations.length > 0) {
      Animated.parallel(disappearAnimations).start(() => {
        Animated.parallel(appearAnimations).start();
      });
    } else if (disappearAnimations.length > 0) {
      Animated.parallel(disappearAnimations).start();
    } else if (appearAnimations.length > 0) {
      Animated.parallel(appearAnimations).start();
    }

    prevClusteredRef.current = clusteredBuildings;
  }, [clusteredBuildings, buildingAnimations, clusterAnimations]);

  // Gérer les changements de caméra (zoom + orientation)
  const handleCameraChanged = useCallback((state) => {
    const zoom = state?.properties?.zoom;
    const heading = state?.properties?.heading;

    updateClusterThresholdFromZoom(zoom);

    if (typeof heading === "number") {
      const normalizedHeading = ((heading % 360) + 360) % 360;
      setMapHeading(normalizedHeading);
    }
  }, [updateClusterThresholdFromZoom]);

  // Gérer le clic sur un cluster
  const handleClusterPress = (cluster) => {
    if (cameraRef.current && cluster.buildings?.length > 0) {
      // Calculer les bounds (limites) du cluster
      const lons = cluster.buildings.map((b) => b.coordinates[0]);
      const lats = cluster.buildings.map((b) => b.coordinates[1]);

      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      // Ajouter un padding pour ne pas coller les marqueurs aux bords
      const lonPadding = (maxLon - minLon) * 0.3 || 0.001;
      const latPadding = (maxLat - minLat) * 0.3 || 0.001;

      const bounds = {
        ne: [maxLon + lonPadding, maxLat + latPadding],
        sw: [minLon - lonPadding, minLat - latPadding],
      };

      // Déterminer le zoom minimum pour casser le palier de clustering actuel
      // région (threshold >= 2) → zoom 7+ pour passer au département
      // département (threshold >= 0.2) → zoom 11+ pour passer à la ville
      // ville (threshold >= 0.01) → zoom 15+ pour passer au quartier/individuel
      let minZoomToBreak = null;
      if (clusterThreshold >= 2) {
        minZoomToBreak = 8;
      } else if (clusterThreshold >= 0.2) {
        minZoomToBreak = 12;
      } else if (clusterThreshold >= 0.01) {
        minZoomToBreak = 15;
      }

      if (minZoomToBreak) {
        // Un seul mouvement de caméra : centrer sur les bâtiments au zoom requis
        cameraRef.current.setCamera({
          centerCoordinate: [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
          zoomLevel: minZoomToBreak,
          padding: {
            paddingTop: 80,
            paddingBottom: 80,
            paddingLeft: 80,
            paddingRight: 80,
          },
          animationDuration: 800,
        });
      } else {
        // Zoom par distance : fitBounds classique
        cameraRef.current.fitBounds(bounds.ne, bounds.sw, 50, 800);
      }

      setIsFollowing(false);
      setLocateClickCount(0);
    }
  };

  // Naviguer vers l'onglet Bâtiments avec le bâtiment sélectionné
  const handleConsultBuilding = () => {
    if (!selectedBuilding) return;
    setSelectedBuilding(null);
    navigation.navigate("building", {
      selectedBuildingId: selectedBuilding.id,
    });
  };

  const appLanguage = useMemo(() => {
    const i18nLanguage = (i18n.resolvedLanguage || i18n.language || "fr").split(
      "-",
    )[0];
    if (["fr", "en", "es"].includes(i18nLanguage)) {
      return i18nLanguage;
    }

    const systemLanguage = RNLocalize.getLocales()?.[0]?.languageCode;
    return ["fr", "en", "es"].includes(systemLanguage) ? systemLanguage : "fr";
  }, [i18n.language, i18n.resolvedLanguage]);

  const dateLocale = useMemo(() => {
    if (appLanguage === "en") return "en-US";
    if (appLanguage === "es") return "es-ES";
    return "fr-FR";
  }, [appLanguage]);

  const selectedBuildingRepairCost = useMemo(() => {
    const rawCost =
      selectedBuilding?.repairCost ?? selectedBuilding?.totalRepairCost ?? 0;
    const numericCost = Number(rawCost);
    return Number.isFinite(numericCost) ? numericCost : 0;
  }, [selectedBuilding]);

  const formattedSelectedBuildingRepairCost = useMemo(() => {
    try {
      return new Intl.NumberFormat(dateLocale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(selectedBuildingRepairCost);
    } catch {
      return `${selectedBuildingRepairCost} €`;
    }
  }, [dateLocale, selectedBuildingRepairCost]);

  // Résout le centre du pays du device avant le montage de la carte.
  const resolveDeviceCountryCenter = useCallback(async () => {
    const countryCode =
      RNLocalize.getCountry?.() ??
      RNLocalize.getLocales?.()?.[0]?.countryCode ??
      null;
    if (!countryCode) return null;

    try {
      const countryName =
        typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function"
          ? new Intl.DisplayNames([appLanguage], { type: "region" }).of(
              countryCode.toUpperCase(),
            )
          : null;
      const query = countryName ?? countryCode.toUpperCase();

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query,
      )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=country&autocomplete=false&language=${appLanguage}&country=${countryCode.toLowerCase()}`;
      const response = await fetch(url);
      const data = await response.json();
      const features = data?.features ?? [];

      const matchingFeature =
        features.find((feature) => {
          const shortCode = feature?.properties?.short_code;
          return (
            typeof shortCode === "string" &&
            shortCode.toUpperCase() === countryCode.toUpperCase()
          );
        }) ?? features[0];

      const center = matchingFeature?.center;
      if (!Array.isArray(center) || center.length < 2) return null;

      return [center[0], center[1]];
    } catch {
      // Fallback silencieux: on laisse un centre neutre.
      return null;
    }
  }, [appLanguage]);

  // Conditions considérées comme "good" (Set pour tests rapides)
  const GOOD_CONDITIONS = new Set(["A", "B", "C"]);

  const normalizeCondition = (condition) => {
    if (typeof condition !== "string") return null;
    const normalized = condition.trim().toUpperCase();
    return normalized.length > 0 ? normalized : null;
  };

  // Convertir la condition (A-F) en statut (good/bad)
  const conditionToStatus = (condition) => {
    const normalizedCondition = normalizeCondition(condition);
    if (!normalizedCondition) return "unknown";
    return GOOD_CONDITIONS.has(normalizedCondition) ? "good" : "bad";
  };

  // Récupérer les bâtiments depuis le local storage (créés via BuildingScreen)
  // + reverse geocoding pour obtenir ville/département/région
  const loadBuildingsFromStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setBuildings([]);
        return;
      }

      const storedBuildings = JSON.parse(stored);

      // Charger le cache de géocodage (invalider si version obsolète)
      let geocodeCache = {};
      try {
        const cachedVersion = await AsyncStorage.getItem(
          GEOCODE_CACHE_VERSION_KEY,
        );
        if (Number(cachedVersion) === GEOCODE_CACHE_VERSION) {
          const cachedRaw = await AsyncStorage.getItem(GEOCODE_CACHE_KEY);
          if (cachedRaw) geocodeCache = JSON.parse(cachedRaw);
        } else {
          // Cache obsolète → supprimer pour re-géocoder avec locality
          await AsyncStorage.removeItem(GEOCODE_CACHE_KEY);
          await AsyncStorage.setItem(
            GEOCODE_CACHE_VERSION_KEY,
            String(GEOCODE_CACHE_VERSION),
          );
        }
      } catch {
        geocodeCache = {};
      }

      // Filtrer les bâtiments avec des coordonnées valides et les transformer
      const validBuildings = storedBuildings
        .filter(
          (b) =>
            b.latitude !== null &&
            b.longitude !== null &&
            !Number.isNaN(Number(b.latitude)) &&
            !Number.isNaN(Number(b.longitude)),
        )
        .map((b) => {
          const normalizedCondition = normalizeCondition(b.condition);
          const rawRepairCost = b.repairCost ?? b.totalRepairCost ?? 0;
          const numericRepairCost = Number(rawRepairCost);
          return {
            id: b.id,
            name: b.name,
            coordinates: [Number(b.longitude), Number(b.latitude)],
            status: conditionToStatus(normalizedCondition),
            condition: normalizedCondition,
            defectCount: b.defectCount ?? 0,
            repairCost: Number.isFinite(numericRepairCost) ? numericRepairCost : 0,
            icon: b.icon,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
            // Infos géo depuis le cache (sera enrichi ci-dessous)
            city: geocodeCache[b.id]?.city ?? null,
            department: geocodeCache[b.id]?.department ?? null,
            region: geocodeCache[b.id]?.region ?? null,
          };
        });

      // Géocoder les bâtiments sans info cached
      let cacheUpdated = false;
      const geocodePromises = validBuildings
        .filter((b) => !b.city && !b.department && !b.region)
        .map(async (b) => {
          const geo = await reverseGeocode(
            b.coordinates[0],
            b.coordinates[1],
            appLanguage,
          );
          b.city = geo.city;
          b.department = geo.department;
          b.region = geo.region;
          geocodeCache[b.id] = geo;
          cacheUpdated = true;
        });

      if (geocodePromises.length > 0) {
        await Promise.all(geocodePromises);
      }

      // Sauvegarder le cache mis à jour
      if (cacheUpdated) {
        AsyncStorage.setItem(
          GEOCODE_CACHE_KEY,
          JSON.stringify(geocodeCache),
        ).catch(() => {});
      }

      setBuildings(validBuildings);

      // Animer l'apparition des bâtiments
      validBuildings.forEach((building, index) => {
        if (!buildingAnimations[building.id]) {
          buildingAnimations[building.id] = new Animated.Value(0);
        }
        Animated.timing(buildingAnimations[building.id], {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    } catch (error) {
      console.log("Erreur lors du chargement des bâtiments:", error);
      setBuildings([]);
    }
  }, [appLanguage, buildingAnimations]);

  // Recharger les bâtiments à chaque focus sur l'écran
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadBuildingsFromStorage();

      // Resynchronise le seuil de cluster au focus même si aucun mouvement caméra
      // n'a encore déclenché onCameraChanged.
      const focusSyncTimeout = setTimeout(() => {
        if (!isActive) return;
        syncClusterThresholdWithCamera();
      }, 150);

      return () => {
        isActive = false;
        clearTimeout(focusSyncTimeout);
      };
    }, [loadBuildingsFromStorage, syncClusterThresholdWithCamera]),
  );

  useEffect(() => {
    async function requestLocationPermission() {
      if (Platform.OS === "android") {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: t("mapScreen.locationPermission.title"),
              message: t("mapScreen.locationPermission.message"),
              buttonNeutral: t("mapScreen.locationPermission.later"),
              buttonNegative: t("mapScreen.locationPermission.cancel"),
              buttonPositive: t("mapScreen.locationPermission.ok"),
            },
          );
        } catch (err) {
          console.warn(err);
        }
      }
    }

    requestLocationPermission();
  }, [t]);

  useEffect(() => {
    let isCancelled = false;
    const fallbackTimeout = setTimeout(() => {
      if (isCancelled) return;
      setInitialMapCenter((prev) => prev ?? [0, 20]);
      setIsInitializingMapCenter(false);
    }, 2500);

    const prepareInitialCenter = async () => {
      const center = await resolveDeviceCountryCenter();
      if (isCancelled) return;

      if (Array.isArray(center) && center.length === 2) {
        setInitialMapCenter(center);
        if (cameraRef.current && !hasCenteredFromLocationRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: center,
            heading: 0,
            pitch: 0,
            animationDuration: 0,
          });
        }
      } else {
        setInitialMapCenter((prev) => prev ?? [0, 20]);
      }
      setIsInitializingMapCenter(false);
      clearTimeout(fallbackTimeout);
    };

    prepareInitialCenter();

    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimeout);
    };
  }, [resolveDeviceCountryCenter]);

  // Première synchro dès que la map est affichée.
  useEffect(() => {
    if (isInitializingMapCenter) return undefined;

    const initialSyncTimeout = setTimeout(() => {
      syncClusterThresholdWithCamera();
    }, 0);

    return () => {
      clearTimeout(initialSyncTimeout);
    };
  }, [isInitializingMapCenter, syncClusterThresholdWithCamera]);

  // Animer le popup quand il s'ouvre/ferme
  useEffect(() => {
    if (selectedBuilding) {
      Animated.spring(popupAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(popupAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedBuilding]);

  // Appliquer la remise au nord seulement après désactivation effective du follow mode.
  useEffect(() => {
    if (!pendingNorthReset || isFollowing) return;

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        heading: 0,
        pitch: 0,
        animationDuration: 500,
      });
    }

    setPendingNorthReset(false);
  }, [pendingNorthReset, isFollowing]);

  const handleLocatePress = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setLocateClickCount(1);
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          heading: 0,
          pitch: 0,
          animationDuration: 500,
        });
      }
    } else if (locateClickCount === 1) {
      // Deuxième clic : recentre et zoom (garder la vue du dessus)
      setLocateClickCount(2);
      if (location && cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [
            location.coords.longitude,
            location.coords.latitude,
          ],
          zoomLevel: 17,
          pitch: 0,
          heading: 0,
          animationDuration: 1000,
        });
      }
    } else if (locateClickCount === 2) {
      // Troisième clic : revient à l'état du premier clic (désactive le suivi, icône "locate" bleue, vue initiale)
      setLocateClickCount(1);
      setIsFollowing(false);
      if (location && cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [
            location.coords.longitude,
            location.coords.latitude,
          ],
          zoomLevel: 15,
          pitch: 0,
          heading: 0,
          animationDuration: 1000,
        });
      }
    } else {
      // État après un clic cluster ou autre : réactive le suivi utilisateur
      setIsFollowing(true);
      setLocateClickCount(0);
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          heading: 0,
          pitch: 0,
          animationDuration: 500,
        });
      }
    }
  };

  // Détermine l'icône et la couleur selon l'état
  let iconName = "locate-outline";
  let iconColor = "#000";
  if (!isFollowing && locateClickCount === 1) {
    iconName = "locate";
    iconColor = "#007AFF";
  } else if (!isFollowing && locateClickCount >= 2) {
    iconName = "navigate-circle";
    iconColor = "#007AFF";
  }

  const selectedConditionKey = normalizeCondition(selectedBuilding?.condition);
  const selectedConditionColors =
    CONDITION_COLORS[selectedConditionKey] ?? CONDITION_COLORS.DEFAULT;
  const selectedConditionLabel =
    t(CONDITION_LABEL_KEYS[selectedConditionKey] ?? "mapScreen.conditions.unknown");

  return (
    <ScreenWrapper scrollable={false}>
      <CustomHeader title={t("mapScreen.title")} />
      <View className="flex-1">
        {isInitializingMapCenter ? (
          <View className="flex-1" />
        ) : (
          <Mapbox.MapView
            className="flex-1"
            styleURL={MAPBOX_STYLE_URL}
            surfaceView={false}
            styleExaggeration={1.5}
            localizeLabels={{
              locale: appLanguage,
            }}
            onCameraChanged={handleCameraChanged}
            onMapIdle={handleCameraChanged}
            logoEnabled={false}
            attributionEnabled={false}
            scaleBarEnabled={false}
          >
            <Mapbox.UserLocation
              onUpdate={(newLocation) => {
                setLocation(newLocation);

                // Ajustement final: au premier fix GPS, centrer une fois sans zoom.
                const lon = newLocation?.coords?.longitude;
                const lat = newLocation?.coords?.latitude;
                if (
                  !hasCenteredFromLocationRef.current &&
                  typeof lon === "number" &&
                  typeof lat === "number" &&
                  cameraRef.current &&
                  !isFollowing
                ) {
                  cameraRef.current.setCamera({
                    centerCoordinate: [lon, lat],
                    heading: 0,
                    pitch: 0,
                    animationDuration: 0,
                  });
                  hasCenteredFromLocationRef.current = true;
                }
              }}
            />
            <Mapbox.Camera
              ref={cameraRef}
              defaultSettings={
                initialMapCenter
                  ? {
                      centerCoordinate: initialMapCenter,
                      heading: 0,
                      pitch: 0,
                    }
                  : undefined
              }
              followZoomLevel={15}
              followPitch={0}
              followUserLocation={isFollowing}
            />
            <Mapbox.VectorSource
              id="composite"
              url="mapbox://mapbox.mapbox-streets-v8"
            >
              <Mapbox.FillExtrusionLayer
                id="3d-buildings"
                sourceLayerID="building"
                style={{
                  fillExtrusionColor: "#aaa",
                  fillExtrusionHeight: [
                    "interpolate",
                    ["linear"],
                    ["get", "height"],
                    0,
                    0,
                    100,
                    100,
                  ],
                  fillExtrusionBase: [
                    "interpolate",
                    ["linear"],
                    ["get", "min_height"],
                    0,
                    0,
                    100,
                    100,
                  ],
                  fillExtrusionOpacity: 0.7,
                }}
                minZoomLevel={15}
              />
            </Mapbox.VectorSource>

            {/* Affichage des marqueurs de bâtiments avec MarkerView */}
            {clusteredBuildings?.map((item) => {
              if (item.isCluster) {
                // Animation du cluster (réutiliser la valeur existante)
                if (!clusterAnimations[item.id]) {
                  clusterAnimations[item.id] = new Animated.Value(1);
                }
                const clusterAnim = clusterAnimations[item.id];

                // Rendu d'un cluster
                return (
                  <Mapbox.MarkerView
                    key={item.id}
                    id={item.id}
                    coordinate={item.coordinates}
                  >
                    <Animated.View
                      style={{
                        opacity: clusterAnim,
                        transform: [
                          {
                            scale: clusterAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.3, 0.8, 1],
                            }),
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleClusterPress(item)}
                        className="items-center"
                      >
                        <View className="bg-blue-600 rounded-full p-2 shadow flex-row items-center">
                          <Ionicons name="business" size={20} color="#fff" />
                          <View className="bg-white rounded-full ml-1 px-1.5 py-0.5 min-w-[20px] items-center">
                            <Text className="text-xs font-bold text-blue-600">
                              +{item.count}
                            </Text>
                          </View>
                        </View>
                        <View className="bg-blue-600/90 rounded-lg px-2 py-1 mt-1">
                          <Text
                            className="text-xs font-semibold text-white"
                            numberOfLines={1}
                          >
                            {t("mapScreen.cluster.multipleBuildings")}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  </Mapbox.MarkerView>
                );
              }

              // Rendu d'un bâtiment individuel
              const building = item;
              // Couleurs liées directement à la condition (A-F)
              const conditionKey = normalizeCondition(building.condition);
              const conditionColors =
                CONDITION_COLORS[conditionKey] ?? CONDITION_COLORS.DEFAULT;

              return (
                <Mapbox.MarkerView
                  key={building.id}
                  id={`building-${building.id}`}
                  coordinate={building.coordinates}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedBuilding(building)}
                    activeOpacity={0.85}
                    className="items-center"
                  >
                    <View
                      style={{ backgroundColor: conditionColors.bg }}
                      className="rounded-full p-2 shadow"
                    >
                      <BuildingIcon
                        iconName={building.icon}
                        size={24}
                        color={conditionColors.color}
                      />
                    </View>
                    <View className="bg-white/90 rounded-lg px-2 py-1 mt-1">
                      <Text className="text-xs font-semibold">
                        {building.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Mapbox.MarkerView>
              );
            })}
          </Mapbox.MapView>
        )}

        {/* Popup d'informations du bâtiment sélectionné - Design amélioré */}
        {selectedBuilding && (
          <TouchableWithoutFeedback onPress={() => setSelectedBuilding(null)}>
            <Animated.View
              style={{
                opacity: popupAnimation,
              }}
              className="absolute top-0 left-0 right-0 bottom-0 bg-black/40"
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <Animated.View
                  style={{
                    opacity: popupAnimation,
                    transform: [
                      {
                        translateY: popupAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [100, 0],
                        }),
                      },
                      {
                        scale: popupAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                  }}
                  className="absolute bottom-28 left-4 right-4 bg-white rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* En-tête avec couleur de condition */}
                  <View
                    style={{
                      backgroundColor: selectedConditionColors.color,
                    }}
                    className="px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="bg-white/20 rounded-full p-2 mr-3">
                        <BuildingIcon
                          iconName={selectedBuilding?.icon}
                          size={22}
                          color="#fff"
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-white font-bold text-lg"
                          numberOfLines={1}
                        >
                          {selectedBuilding?.name}
                        </Text>
                        <Text className="text-white/80 text-xs">
                          {selectedConditionLabel}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedBuilding(null)}
                      className="bg-white/20 rounded-full p-1"
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Corps du popup */}
                  <View className="p-4">
                    {/* Badge de condition */}
                    <View className="flex-row items-center mb-4">
                      <View
                        style={{
                          backgroundColor:
                            CONDITION_COLORS[
                              normalizeCondition(selectedBuilding?.condition)
                            ]?.bg ??
                            "#f3f4f6",
                        }}
                        className="rounded-full px-3 py-1 mr-2"
                      >
                        <Text
                          style={{
                            color:
                              CONDITION_COLORS[
                                normalizeCondition(selectedBuilding?.condition)
                              ]?.color ?? "#374151",
                          }}
                          className="font-bold text-sm"
                        >
                          {t("mapScreen.popup.conditionBadge", {
                            condition:
                              selectedBuilding?.condition ??
                              t("mapScreen.popup.notAvailable"),
                          })}
                        </Text>
                      </View>
                      <View className="bg-gray-100 rounded-full px-3 py-1">
                        <Text className="text-gray-600 text-sm">
                          {t("mapScreen.popup.defectCount", {
                            count: selectedBuilding?.defectCount ?? 0,
                          })}
                        </Text>
                      </View>
                    </View>

                    {/* Informations */}
                    <View className="space-y-3 mb-4">
                      <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                        <View className="bg-emerald-100 rounded-full p-2 mr-3">
                          <Ionicons
                            name="cash-outline"
                            size={16}
                            color="#10B981"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-400 text-xs uppercase">
                            {t("mapScreen.popup.globalRepairCostLabel")}
                          </Text>
                          <Text className="text-gray-700 text-sm font-medium">
                            {formattedSelectedBuildingRepairCost}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                        <View className="bg-blue-100 rounded-full p-2 mr-3">
                          <Ionicons name="location" size={16} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-400 text-xs uppercase">
                            {t("mapScreen.popup.coordinatesLabel")}
                          </Text>
                          <Text className="text-gray-700 text-sm font-medium">
                            {selectedBuilding?.coordinates?.[1]?.toFixed(4) ??
                              t("mapScreen.popup.notAvailable")}
                            ,{" "}
                            {selectedBuilding?.coordinates?.[0]?.toFixed(4) ??
                              t("mapScreen.popup.notAvailable")}
                          </Text>
                        </View>
                      </View>

                      {selectedBuilding?.createdAt && (
                        <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                          <View className="bg-purple-100 rounded-full p-2 mr-3">
                            <Ionicons
                              name="calendar"
                              size={16}
                              color="#8B5CF6"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-400 text-xs uppercase">
                              {t("mapScreen.popup.addedDateLabel")}
                            </Text>
                            <Text className="text-gray-700 text-sm font-medium">
                              {new Date(
                                selectedBuilding.createdAt,
                              ).toLocaleDateString(dateLocale, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Bouton Consulter */}
                    <TouchableOpacity
                      onPress={handleConsultBuilding}
                      className="bg-blue-600 rounded-xl py-3 flex-row items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye" size={20} color="#fff" />
                      <Text className="text-white font-semibold text-base ml-2">
                        {t("mapScreen.popup.viewBuilding")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        )}

        {/* Compas (bas gauche) */}
        <TouchableOpacity
          onPress={() => {
            setLocateClickCount(1);
            if (isFollowing) {
              setPendingNorthReset(true);
              setIsFollowing(false);
              return;
            }

            if (cameraRef.current) {
              cameraRef.current.setCamera({
                heading: 0,
                pitch: 0,
                animationDuration: 500,
              });
            }
          }}
          className="absolute bottom-6 left-5 bg-white rounded-full w-12 h-12 justify-center items-center shadow"
          activeOpacity={0.8}
        >
          <Animated.View
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
          </Animated.View>
        </TouchableOpacity>

        {/* Bouton pour recentrer sur la position utilisateur */}
        <TouchableOpacity
          onPress={handleLocatePress}
          className="absolute bottom-6 right-5 bg-white rounded-full w-12 h-12 justify-center items-center shadow"
        >
          <Ionicons name={iconName} size={30} color={iconColor} />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
