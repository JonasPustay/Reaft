// screens/SettingsScreen.js
import React, { useState } from "react";
import {
  View,
  FlatList,
  Modal,
  TouchableOpacity,
  Text,
  Linking,
  Platform,
  Alert,
} from "react-native";
import * as RNLocalize from "react-native-localize";
import * as StoreReview from "expo-store-review";
import ScreenWrapper from "../components/ScreenWrapper";
import CustomHeader from "../components/CustomHeader";
import SettingOption from "../components/settings/SettingOption";
import { settingsOptions } from "../constants/settingsOptions";
import { useTranslation } from "react-i18next";
import RevenueCat from "../services/RevenueCat";

// Importation des composants modaux
import {
  ManageDataModal,
  ChangeLanguageModal,
} from "../components/settings/SettingModals";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [activeAction, setActiveAction] = useState(null);

  const subscriptionManagementUrl = Platform.select({
    ios: "https://apps.apple.com/account/subscriptions",
    android: "https://play.google.com/store/account/subscriptions",
    default: null,
  });

  const openMail = async ({ email, subject, body }) => {
    const params = [`subject=${encodeURIComponent(subject)}`];
    if (body) {
      params.push(`body=${encodeURIComponent(body)}`);
    }
    const mailUrl = `mailto:${email}?${params.join("&")}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
        return;
      }

      Alert.alert(
        t("settingsScreen.alerts.mailUnavailable.title"),
        t("settingsScreen.alerts.mailUnavailable.message"),
      );
    } catch (err) {
      Alert.alert(
        t("settingsScreen.alerts.mailOpenFailed.title"),
        t("settingsScreen.alerts.mailOpenFailed.message"),
      );
    }
  };

  const buildFeedbackBody = () => {
    const locale = RNLocalize.getLocales()?.[0];
    const dataLines = [
      "",
      "",
      "",
      "System Information",
      "--------------------",
      `Platform: ${Platform.OS}`,
      `OS Version: ${String(Platform.Version)}`,
      `Device Language: ${locale?.languageTag ?? "Unknown"}`,
      `Country: ${RNLocalize.getCountry?.() ?? "Unknown"}`,
      `Timezone: ${RNLocalize.getTimeZone?.() ?? "Unknown"}`,
      `Uses 24-Hour Clock: ${RNLocalize.uses24HourClock?.() ? "Yes" : "No"}`,
      `Uses Metric System: ${RNLocalize.usesMetricSystem?.() ? "Yes" : "No"}`,
      `App Language: ${(i18n.resolvedLanguage || i18n.language || "fr").split("-")[0]}`,
      "--------------------",
    ];

    return dataLines.join("\n");
  };

  const requestNativeReview = async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          t("settingsScreen.alerts.reviewUnavailable.title"),
          t("settingsScreen.alerts.reviewUnavailable.message"),
        );
        return;
      }

      await StoreReview.requestReview();
    } catch (error) {
      Alert.alert(
        t("settingsScreen.alerts.reviewFailed.title"),
        t("settingsScreen.alerts.reviewFailed.message"),
      );
    }
  };

  const openSubscriptionManagementFallback = async () => {
    if (!subscriptionManagementUrl) {
      return false;
    }

    const canOpen = await Linking.canOpenURL(subscriptionManagementUrl);
    if (!canOpen) {
      return false;
    }

    await Linking.openURL(subscriptionManagementUrl);
    return true;
  };

  const openManageSubscription = async () => {
    try {
      const result = await RevenueCat.manageSubscriptions();
      if (result?.opened) {
        return;
      }

      const openedFallback = await openSubscriptionManagementFallback();
      if (openedFallback) {
        return;
      }

      Alert.alert(
        t("settingsScreen.alerts.manageSubscriptionUnavailable.title"),
        t("settingsScreen.alerts.manageSubscriptionUnavailable.message"),
      );
    } catch (error) {
      try {
        const openedFallback = await openSubscriptionManagementFallback();
        if (openedFallback) {
          return;
        }
      } catch {
        // no-op
      }

      Alert.alert(
        t("settingsScreen.alerts.manageSubscriptionFailed.title"),
        t("settingsScreen.alerts.manageSubscriptionFailed.message"),
      );
    }
  };

  const handleOptionPress = async (action) => {
    switch (action) {
      case "contact":
        const email = "mtt200102@gmail.com";
        const subject = t("settingsScreen.emailSubject");
        await openMail({ email, subject });
        break;

      case "sendFeedback":
        await openMail({
          email: "mtt200102@gmail.com",
          subject: "Feedback",
          body: buildFeedbackBody(),
        });
        break;

      case "privacyPolicy":
        Linking.openURL("https://reaft-esp.vercel.app/PrivacyPolicy");
        break;

      case "termsOfUse":
        Linking.openURL("https://reaft-esp.vercel.app/CGU");
        break;

      case "rateApp":
        await requestNativeReview();
        break;

      case "manageSubscription":
        await openManageSubscription();
        break;

      // Actions internes (Modals)
      case "manageData":
      case "changeLanguage":
        setActiveAction(action);
        break;

      default:
        break;
    }
  };

  const handleCloseModal = () => setActiveAction(null);

  const renderModalContent = () => {
    switch (activeAction) {
      case "manageData":
        return <ManageDataModal onClose={handleCloseModal} />;
      case "changeLanguage":
        return <ChangeLanguageModal onClose={handleCloseModal} />;
      default:
        return null;
    }
  };

  return (
    <ScreenWrapper>
      <CustomHeader title={t("settingsScreen.title")} />
      <View className="flex-1 bg-white p-4">
        <FlatList
          data={settingsOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SettingOption
              title={t(item.titleKey)}
              icon={item.icon}
              onPress={() => handleOptionPress(item.action)}
            />
          )}
        />
      </View>

      <Modal
        visible={activeAction !== null}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        {/* Overlay du Modal */}
        <View className="flex-1 bg-white pt-12 relative">
          {/* Bouton de fermeture en haut à droite */}
          <TouchableOpacity
            className="absolute top-12 right-6 z-50 p-2 rounded-full bg-gray-100"
            onPress={handleCloseModal}
          >
            <Text className="text-gray-800 text-xl font-bold">✕</Text>
          </TouchableOpacity>

          {/* Contenu du Modal */}
          {renderModalContent()}
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
