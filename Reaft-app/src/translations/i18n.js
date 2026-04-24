import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
};

const normalizeLanguage = (language) => {
  if (!language) {
    return "fr";
  }

  const baseLanguage = language.split("-")[0];
  return resources[baseLanguage] ? baseLanguage : "fr";
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fr",
  fallbackLng: "fr",
  compatibilityJSON: "v3",
  interpolation: {
    escapeValue: false,
  },
});

const initLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem("appLanguage");
    if (storedLanguage && resources[storedLanguage]) {
      i18n.changeLanguage(storedLanguage);
      return;
    }

    const locale = Localization.getLocales()?.[0];
    const deviceLanguage = normalizeLanguage(
      locale?.languageCode ?? locale?.languageTag,
    );
    i18n.changeLanguage(deviceLanguage);
  } catch (error) {
    i18n.changeLanguage("fr");
  }
};

initLanguage();

export default i18n;
