import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import TabNavigator from "./src/navigation/TabNavigator";
import OnboardingFlow from "./src/onboarding/OnboardingFlow";
import Paywall from "./src/paywall/Paywall";

import RevenueCat from "./src/services/RevenueCat";

import "./src/translations/i18n";

const ONBOARDING_STORAGE_KEY = "@reaft/onboarding";

const hasPremiumAccess = (customerInfo) => {
  const activeEntitlements = customerInfo?.entitlements?.active;
  if (
    activeEntitlements &&
    typeof activeEntitlements === "object" &&
    Object.keys(activeEntitlements).length > 0
  ) {
    return true;
  }

  if (
    Array.isArray(customerInfo?.activeSubscriptions) &&
    customerInfo.activeSubscriptions.length > 0
  ) {
    return true;
  }

  if (
    Array.isArray(customerInfo?.nonSubscriptionTransactions) &&
    customerInfo.nonSubscriptionTransactions.length > 0
  ) {
    return true;
  }

  return false;
};

export default function App() {
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  useEffect(() => {
    // Supprime l'affichage des warnings (LogBox / YellowBox) dans l'app
    LogBox.ignoreAllLogs(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadOnboarding = async () => {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!isMounted) return;

        if (!stored) {
          setIsOnboardingComplete(false);
          return;
        }

        const parsed = JSON.parse(stored);
        setIsOnboardingComplete(Boolean(parsed?.completedAt));
      } catch {
        if (isMounted) {
          setIsOnboardingComplete(false);
        }
      } finally {
        if (isMounted) {
          setIsOnboardingLoading(false);
        }
      }
    };

    loadOnboarding();

    return () => {
      isMounted = false;
    };
  }, []);

  const checkPremiumStatus = useCallback(async () => {
    try {
      const customerInfo = await RevenueCat.getCustomerInfo();
      const hasPremium = hasPremiumAccess(customerInfo);
      setIsPaywallVisible(!hasPremium);
      return hasPremium;
    } catch {
      setIsPaywallVisible(true);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initPaywall = async () => {
      const initResult = RevenueCat.initRevenueCat();
      if (!isMounted) return;

      if (!initResult?.configured) {
        setIsPaywallVisible(false);
        return;
      }

      try {
        const customerInfo = await RevenueCat.getCustomerInfo();
        if (!isMounted) return;
        setIsPaywallVisible(!hasPremiumAccess(customerInfo));
      } catch {
        if (isMounted) {
          setIsPaywallVisible(true);
        }
      }
    };

    initPaywall();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOnboardingComplete = useCallback(
    async ({ profileType, discoverySource, reviewRequested }) => {
      const payload = {
        profileType: profileType ?? null,
        discoverySource: discoverySource ?? null,
        reviewRequested: Boolean(reviewRequested),
        completedAt: new Date().toISOString(),
      };

      try {
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // no-op: l'app continue même si la persistance échoue
      }

      const hasPremium = await checkPremiumStatus();
      setIsPaywallVisible(!hasPremium);
      setIsOnboardingComplete(true);
    },
    [checkPremiumStatus],
  );

  const handleDevShowOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // no-op: l'app continue même si la suppression échoue
    }
    setIsOnboardingComplete(false);
  }, []);

  if (isOnboardingLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-white">
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          <TabNavigator onDevShowOnboarding={handleDevShowOnboarding} />
          <Paywall
            visible={isPaywallVisible}
            onClose={() => setIsPaywallVisible(false)}
            onPremiumStatusCheck={checkPremiumStatus}
            onDevSkip={() => setIsPaywallVisible(false)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
