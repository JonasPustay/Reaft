import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

import { REVENUECAT_API_KEY_IOS } from "@env";

const isIos = Platform.OS === "ios";
let isConfigured = false;

const configure = ({ userId, debug = __DEV__ } = {}) => {
  if (!isIos) {
    return { configured: false, reason: "unsupported_platform" };
  }
  if (!REVENUECAT_API_KEY_IOS) {
    console.warn("[RevenueCat] Missing REVENUECAT_API_KEY_IOS in .env");
    return { configured: false, reason: "missing_api_key" };
  }
  if (isConfigured) {
    return { configured: true, alreadyConfigured: true };
  }
  if (debug) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({
    apiKey: REVENUECAT_API_KEY_IOS,
    appUserID: userId || undefined,
  });
  isConfigured = true;
  return { configured: true };
};

const initRevenueCat = (options) => configure(options);

const getOfferings = async () => {
  if (!isIos) return null;
  return Purchases.getOfferings();
};

const getCustomerInfo = async () => {
  if (!isIos) return null;
  return Purchases.getCustomerInfo();
};

const purchasePackage = async (rcPackage) => {
  if (!isIos) return null;
  return Purchases.purchasePackage(rcPackage);
};

const restore = async () => {
  if (!isIos) return null;
  return Purchases.restorePurchases();
};

const manageSubscriptions = async () => {
  if (!isIos) {
    return { opened: false, reason: "unsupported_platform" };
  }

  const initResult = configure();
  if (!initResult?.configured) {
    return { opened: false, reason: initResult?.reason ?? "not_configured" };
  }

  await Purchases.showManageSubscriptions();
  return { opened: true };
};

const logIn = async (userId) => {
  if (!isIos) return null;
  return Purchases.logIn(userId);
};

const logOut = async () => {
  if (!isIos) return null;
  return Purchases.logOut();
};

export default {
  initRevenueCat,
  configure,
  getOfferings,
  getCustomerInfo,
  purchasePackage,
  restore,
  manageSubscriptions,
  logIn,
  logOut,
};
