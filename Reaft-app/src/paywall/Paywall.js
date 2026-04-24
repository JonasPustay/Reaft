import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import RevenueCat from "../services/RevenueCat";

const PLAN_PRODUCT_IDS = {
  weekly: "reaft_abonnement_hebdomadaire",
  monthly: "reaft_abonnement_mensuel",
  annual: "reaft_abonnement_annuel",
};

const PLAN_FROM_PACKAGE_IDENTIFIER = {
  $rc_weekly: "weekly",
  $rc_monthly: "monthly",
  $rc_annual: "annual",
};

const PLAN_ORDER = ["weekly", "monthly", "annual"];

const getBadgePalette = (planId) => {
  if (planId === "weekly") {
    return {
      icon: "gift-outline",
      backgroundColor: "#F0F9FF",
      borderColor: "#7DD3FC",
      textColor: "#0369A1",
    };
  }

  if (planId === "monthly") {
    return {
      icon: "flame-outline",
      backgroundColor: "#FFF7ED",
      borderColor: "#FDBA74",
      textColor: "#C2410C",
    };
  }

  if (planId === "annual") {
    return {
      icon: "diamond-outline",
      backgroundColor: "#ECFDF3",
      borderColor: "#86EFAC",
      textColor: "#047857",
    };
  }

  return {
    icon: "star-outline",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    textColor: "#1E3A8A",
  };
};

const hasPremiumAccess = (customerInfo) => {
  const activeEntitlements = customerInfo?.entitlements?.active;
  if (
    activeEntitlements &&
    typeof activeEntitlements === "object" &&
    Object.keys(activeEntitlements).length > 0
  ) {
    return true;
  }

  if (Array.isArray(customerInfo?.activeSubscriptions)) {
    if (customerInfo.activeSubscriptions.length > 0) return true;
  }

  if (Array.isArray(customerInfo?.nonSubscriptionTransactions)) {
    if (customerInfo.nonSubscriptionTransactions.length > 0) return true;
  }

  return false;
};

const mapOfferingsToPlans = (offerings) => {
  const packages = offerings?.current?.availablePackages ?? [];
  const mapped = {};

  packages.forEach((pkg) => {
    const productId = pkg?.product?.identifier;
    const mappedByPackageId = PLAN_FROM_PACKAGE_IDENTIFIER[pkg?.identifier];
    const mappedByProductId = Object.entries(PLAN_PRODUCT_IDS).find(
      ([, knownProductId]) => knownProductId === productId,
    )?.[0];

    const planKey = mappedByProductId ?? mappedByPackageId;
    if (planKey) {
      mapped[planKey] = pkg;
    }
  });

  return mapped;
};

const getFirstAvailablePlan = (planPackages) =>
  PLAN_ORDER.find((planId) => Boolean(planPackages[planId])) ?? null;

export default function Paywall({
  visible,
  onClose,
  onPremiumStatusCheck,
  onDevSkip,
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [planPackages, setPlanPackages] = useState({});
  const [selectedPlan, setSelectedPlan] = useState("weekly");
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const plans = useMemo(
    () => [
      {
        id: "weekly",
        label: t("paywall.plans.weekly"),
        badge: t("paywall.plans.weeklyTrial"),
        period: t("paywall.plans.period.weekly"),
        detail: t("paywall.plans.details.weekly"),
        icon: "time-outline",
      },
      {
        id: "monthly",
        label: t("paywall.plans.monthly"),
        badge: t("paywall.badges.popular"),
        period: t("paywall.plans.period.monthly"),
        detail: t("paywall.plans.details.monthly"),
        icon: "calendar-clear-outline",
      },
      {
        id: "annual",
        label: t("paywall.plans.annual"),
        badge: t("paywall.badges.bestValue"),
        period: t("paywall.plans.period.annual"),
        detail: t("paywall.plans.details.annual"),
        icon: "ribbon-outline",
      },
    ],
    [t],
  );

  const features = useMemo(
    () => [
      {
        id: "ai",
        icon: "sparkles-outline",
        label: t("paywall.features.ai"),
      },
      {
        id: "monitoring",
        icon: "analytics-outline",
        label: t("paywall.features.monitoring"),
      },
      {
        id: "reports",
        icon: "documents-outline",
        label: t("paywall.features.reports"),
      },
      {
        id: "support",
        icon: "chatbubbles-outline",
        label: t("paywall.features.support"),
      },
      {
        id: "earlyAccess",
        icon: "rocket-outline",
        label: t("paywall.features.earlyAccess"),
      },
    ],
    [t],
  );

  const weeklyPlan = useMemo(
    () => plans.find((plan) => plan.id === "weekly") ?? null,
    [plans],
  );
  const monthlyAnnualPlans = useMemo(
    () => plans.filter((plan) => plan.id !== "weekly"),
    [plans],
  );

  const renderPlanCard = (plan) => {
    const pkg = planPackages[plan.id];
    const isSelected = selectedPlan === plan.id;
    const isUnavailable = !pkg && !isLoadingOfferings;
    const badgePalette = getBadgePalette(plan.id);

    const planCardClassName = [
      "rounded-[20px] px-4 pt-4 pb-3",
      isUnavailable ? "opacity-50" : "",
    ].join(" ");

    return (
      <View key={plan.id} className="relative flex-1">
        {plan.badge ? (
          <View className="absolute left-0 right-0 z-20 items-center" style={{ top: -14 }}>
            <View
              className="flex-row items-center rounded-full border px-2.5 py-1"
              style={{
                gap: 4,
                backgroundColor: badgePalette.backgroundColor,
                borderColor: badgePalette.borderColor,
                shadowColor: badgePalette.textColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons
                name={badgePalette.icon}
                size={12}
                color={badgePalette.textColor}
              />
              <Text
                className="text-[10.5px] font-extrabold uppercase tracking-[0.4px]"
                style={{ color: badgePalette.textColor }}
              >
                {plan.badge}
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          className={planCardClassName}
          activeOpacity={0.9}
          onPress={() => setSelectedPlan(plan.id)}
          disabled={isLoadingOfferings}
          style={[
            {
              minHeight: 132,
              borderWidth: isSelected ? 2.3 : 1.6,
              borderColor: isSelected ? "#2563EB" : "#CBD5E1",
              backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
            },
            isSelected
              ? {
                  shadowColor: "#2563EB",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.14,
                  shadowRadius: 10,
                  elevation: 3,
                }
              : undefined,
          ]}
        >
          <View className="flex-1">
            <View className="flex-row items-center justify-between" style={{ gap: 6 }}>
              <Text
                className="pr-3 text-[14px] font-black"
                style={{ color: isSelected ? "#1E3A8A" : "#0F172A" }}
              >
                {plan.label}
              </Text>
              <Ionicons
                name={plan.icon}
                size={16}
                color={isSelected ? "#2563EB" : "#64748B"}
              />
            </View>

            <Text
              className="mt-2 text-[18px] font-black"
              style={{
                color: isUnavailable
                  ? "#94A3B8"
                  : isSelected
                  ? "#1D4ED8"
                  : "#334155",
              }}
            >
              {pkg?.product?.priceString ?? t("paywall.messages.unavailable")}
            </Text>

            <Text
              className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.5px]"
              style={{ color: isSelected ? "#1D4ED8" : "#64748B" }}
            >
              {plan.period}
            </Text>

            <View
              className="mt-2.5 flex-row items-start rounded-[10px] border px-2 py-1.5"
              style={{
                gap: 6,
                borderColor: isSelected ? "#BFDBFE" : "#E2E8F0",
                backgroundColor: isSelected ? "#DBEAFE" : "#F8FAFC",
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color={isSelected ? "#1D4ED8" : "#475569"}
              />
              <Text
                className="flex-1 text-[11px] font-semibold leading-[15px]"
                style={{ color: isSelected ? "#1E3A8A" : "#334155" }}
                numberOfLines={2}
              >
                {plan.detail}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    if (!visible) {
      setIsLoadingOfferings(false);
      setIsPurchasing(false);
      setIsRestoring(false);
      return;
    }

    let isMounted = true;

    const loadOfferings = async () => {
      setIsLoadingOfferings(true);

      try {
        const offerings = await RevenueCat.getOfferings();
        if (!isMounted) return;

        const nextPackages = mapOfferingsToPlans(offerings);
        setPlanPackages(nextPackages);

        const firstAvailable = getFirstAvailablePlan(nextPackages);
        if (firstAvailable) {
          setSelectedPlan(firstAvailable);
        }
      } catch {
        if (isMounted) {
          setPlanPackages({});
        }
      } finally {
        if (isMounted) {
          setIsLoadingOfferings(false);
        }
      }
    };

    loadOfferings();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const selectedPackage = planPackages[selectedPlan];
  const continueDisabled =
    isLoadingOfferings || isPurchasing || isRestoring || !selectedPackage;

  const runPremiumSync = async () => {
    if (typeof onPremiumStatusCheck !== "function") {
      return false;
    }

    try {
      return await onPremiumStatusCheck();
    } catch {
      return false;
    }
  };

  const handleContinue = async () => {
    if (!selectedPackage || continueDisabled) {
      return;
    }

    setIsPurchasing(true);
    try {
      const purchaseResult = await RevenueCat.purchasePackage(selectedPackage);
      const customerInfo = purchaseResult?.customerInfo ?? null;
      const hasPremium = hasPremiumAccess(customerInfo);

      if (hasPremium) {
        await runPremiumSync();
        Alert.alert(
          t("paywall.alerts.purchaseSuccessTitle"),
          t("paywall.alerts.purchaseSuccessMessage"),
        );
        onClose?.();
        return;
      }

      const synced = await runPremiumSync();
      if (synced) {
        onClose?.();
        return;
      }

      Alert.alert(
        t("paywall.alerts.pendingTitle"),
        t("paywall.alerts.pendingMessage"),
      );
    } catch (error) {
      if (error?.userCancelled) {
        return;
      }

      Alert.alert(
        t("paywall.alerts.errorTitle"),
        error?.message ?? t("paywall.alerts.purchaseErrorMessage"),
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring || isPurchasing) {
      return;
    }

    setIsRestoring(true);
    try {
      const customerInfo = await RevenueCat.restore();
      const hasPremium = hasPremiumAccess(customerInfo);

      if (hasPremium) {
        await runPremiumSync();
        Alert.alert(
          t("paywall.alerts.restoreSuccessTitle"),
          t("paywall.alerts.restoreSuccessMessage"),
        );
        onClose?.();
        return;
      }

      Alert.alert(
        t("paywall.alerts.restoreEmptyTitle"),
        t("paywall.alerts.restoreEmptyMessage"),
      );
    } catch (error) {
      Alert.alert(
        t("paywall.alerts.errorTitle"),
        error?.message ?? t("paywall.alerts.restoreErrorMessage"),
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const openPrivacy = async () => {
    try {
      await Linking.openURL("https://reaft-esp.vercel.app/PrivacyPolicy");
    } catch {
      Alert.alert(t("paywall.alerts.errorTitle"), t("paywall.alerts.linkError"));
    }
  };

  const openTerms = async () => {
    try {
      await Linking.openURL("https://reaft-esp.vercel.app/CGU");
    } catch {
      Alert.alert(t("paywall.alerts.errorTitle"), t("paywall.alerts.linkError"));
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={false}
      presentationStyle="fullScreen"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 6 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6" style={{ gap: 14 }}>
            <Text className="mt-1 text-center text-[30px] font-black leading-[34px] tracking-[0.2px] text-slate-900">
              {t("paywall.title")}
            </Text>

            <View
              className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm"
              style={{ gap: 11 }}
            >
              {features.map((feature) => (
                <View
                  key={feature.id}
                  className="flex-row items-center"
                  style={{ gap: 11 }}
                >
                  <View className="h-[30px] w-[30px] items-center justify-center rounded-[11px] bg-blue-100">
                    <Ionicons name={feature.icon} size={16} color="#1D4ED8" />
                  </View>
                  <Text className="flex-1 text-[14px] font-semibold leading-5 text-slate-800">
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 15, marginTop: 4 }}>
              {weeklyPlan ? (
                <View className="flex-row pt-3">{renderPlanCard(weeklyPlan)}</View>
              ) : null}

              <View className="flex-row pt-3" style={{ gap: 10 }}>
                {monthlyAnnualPlans.map((plan) => renderPlanCard(plan))}
              </View>
            </View>

            {isLoadingOfferings ? (
              <View
                className="flex-row items-center justify-center py-0.5"
                style={{ gap: 8 }}
              >
                <ActivityIndicator color="#2563EB" />
                <Text className="font-medium text-slate-600">
                  {t("paywall.messages.loading")}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="h-[52px] items-center justify-center rounded-[18px]"
              style={{
                backgroundColor: "#0B57D0",
                opacity: continueDisabled ? 0.55 : 1,
                shadowColor: "#0B57D0",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 5,
              }}
              onPress={handleContinue}
              activeOpacity={continueDisabled ? 1 : 0.9}
              disabled={continueDisabled}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center" style={{ gap: 7 }}>
                  <Text className="text-[18px] font-black tracking-[0.2px] text-white">
                    {t("paywall.actions.continue")}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="h-9 self-center items-center justify-center rounded-xl border border-blue-200 bg-white/80 px-3.5"
              onPress={handleRestore}
              activeOpacity={isRestoring ? 1 : 0.9}
              disabled={isRestoring}
              style={{ opacity: isRestoring ? 0.65 : 1 }}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Ionicons name="refresh-outline" size={13} color="#1E40AF" />
                  <Text className="text-[12.5px] font-bold text-blue-800">
                    {t("paywall.actions.restore")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View
              className="mt-1 flex-row items-center justify-center"
              style={{ gap: 18 }}
            >
              <TouchableOpacity onPress={openPrivacy}>
                <Text className="text-[13px] font-bold text-blue-800 underline">
                  {t("paywall.actions.privacy")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openTerms}>
                <Text className="text-[13px] font-bold text-blue-800 underline">
                  {t("paywall.actions.terms")}
                </Text>
              </TouchableOpacity>
              {__DEV__ && typeof onDevSkip === "function" ? (
                <TouchableOpacity
                  className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1"
                  onPress={onDevSkip}
                  activeOpacity={0.8}
                >
                  <Text className="text-[10.5px] font-extrabold uppercase tracking-[0.3px] text-slate-700">
                    Skip dev
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
