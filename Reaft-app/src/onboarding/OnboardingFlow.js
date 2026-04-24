import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as StoreReview from "expo-store-review";
import { useTranslation } from "react-i18next";

const PROFILE_OPTIONS = [
  { id: "individual", icon: "person-outline" },
  { id: "company", icon: "business-outline" },
  { id: "community", icon: "people-outline" },
  { id: "association", icon: "leaf-outline" },
  { id: "other", icon: "apps-outline" },
];

const DISCOVERY_OPTIONS = [
  { id: "wordOfMouth", icon: "chatbubble-ellipses-outline" },
  { id: "socialMedia", icon: "globe-outline" },
  { id: "searchEngine", icon: "search-outline" },
  { id: "store", icon: "phone-portrait-outline" },
  { id: "other", icon: "ellipsis-horizontal-circle-outline" },
];

const STEP_COUNT = 4;

function OptionCard({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      className="rounded-2xl border px-4 py-3.5"
      style={{
        borderColor: selected ? "#2563EB" : "#CBD5E1",
        backgroundColor: selected ? "#EFF6FF" : "#FFFFFF",
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View
          className="h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: selected ? "#DBEAFE" : "#F1F5F9" }}
        >
          <Ionicons
            name={icon}
            size={16}
            color={selected ? "#1D4ED8" : "#475569"}
          />
        </View>
        <Text
          className="flex-1 text-[15px] font-semibold"
          style={{ color: selected ? "#1E3A8A" : "#0F172A" }}
        >
          {label}
        </Text>
        {selected ? (
          <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [profileType, setProfileType] = useState(null);
  const [discoverySource, setDiscoverySource] = useState(null);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileOptions = useMemo(
    () =>
      PROFILE_OPTIONS.map((option) => ({
        ...option,
        label: t(`onboarding.profile.options.${option.id}`),
      })),
    [t],
  );
  const discoveryOptions = useMemo(
    () =>
      DISCOVERY_OPTIONS.map((option) => ({
        ...option,
        label: t(`onboarding.discovery.options.${option.id}`),
      })),
    [t],
  );

  const requestNativeReview = async () => {
    if (isReviewLoading) return;
    setIsReviewLoading(true);

    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          t("onboarding.review.unavailableTitle"),
          t("onboarding.review.unavailableMessage"),
        );
        return;
      }

      await StoreReview.requestReview();
      setReviewRequested(true);
    } catch {
      Alert.alert(
        t("onboarding.review.errorTitle"),
        t("onboarding.review.errorMessage"),
      );
    } finally {
      setIsReviewLoading(false);
    }
  };

  const submitOnboarding = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComplete?.({
        profileType,
        discoverySource,
        reviewRequested,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canContinue =
    (step === 0 && true) ||
    (step === 1 && Boolean(profileType)) ||
    (step === 2 && Boolean(discoverySource)) ||
    (step === 3 && !isSubmitting);

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {Array.from({ length: STEP_COUNT }).map((_, index) => {
            const isDone = index <= step;
            return (
              <View
                key={`step-dot-${String(index)}`}
                className="h-2 flex-1 rounded-full"
                style={{
                  backgroundColor: isDone ? "#2563EB" : "#CBD5E1",
                }}
              />
            );
          })}
        </View>

        <View className="mt-2">
          <Text className="text-right text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">
            {t("onboarding.stepCounter", { current: step + 1, total: STEP_COUNT })}
          </Text>
        </View>

        <View className="mt-6 flex-1">
          {step === 0 ? (
            <View className="flex-1 justify-between">
              <View>
                <View className="mb-6 h-16 w-16 items-center justify-center rounded-3xl bg-blue-100">
                  <Ionicons name="sparkles-outline" size={30} color="#1D4ED8" />
                </View>
                <Text className="text-[34px] font-black leading-[38px] text-slate-900">
                  {t("onboarding.welcome.title")}
                </Text>
                <Text className="mt-3 text-[16px] leading-6 text-slate-600">
                  {t("onboarding.welcome.subtitle")}
                </Text>
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View className="flex-1">
              <Text className="text-[30px] font-black leading-[34px] text-slate-900">
                {t("onboarding.profile.title")}
              </Text>
              <Text className="mt-2 text-[15px] text-slate-600">
                {t("onboarding.profile.subtitle")}
              </Text>
              <View className="mt-6" style={{ gap: 11 }}>
                {profileOptions.map((option) => (
                  <OptionCard
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    selected={profileType === option.id}
                    onPress={() => setProfileType(option.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View className="flex-1">
              <Text className="text-[30px] font-black leading-[34px] text-slate-900">
                {t("onboarding.discovery.title")}
              </Text>
              <Text className="mt-2 text-[15px] text-slate-600">
                {t("onboarding.discovery.subtitle")}
              </Text>
              <View className="mt-6" style={{ gap: 11 }}>
                {discoveryOptions.map((option) => (
                  <OptionCard
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    selected={discoverySource === option.id}
                    onPress={() => setDiscoverySource(option.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View className="flex-1 justify-between">
              <View>
                <View className="mb-6 h-16 w-16 items-center justify-center rounded-3xl bg-amber-100">
                  <Ionicons name="star-outline" size={30} color="#D97706" />
                </View>
                <Text className="text-[30px] font-black leading-[34px] text-slate-900">
                  {t("onboarding.review.title")}
                </Text>
                <Text className="mt-3 text-[15px] leading-6 text-slate-600">
                  {t("onboarding.review.subtitle")}
                </Text>
                {reviewRequested ? (
                  <View className="mt-5 flex-row items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#047857" />
                    <Text className="ml-2 flex-1 text-sm font-semibold text-emerald-800">
                      {t("onboarding.review.successHint")}
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                className="mt-8 h-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50"
                onPress={requestNativeReview}
                activeOpacity={isReviewLoading ? 1 : 0.85}
                disabled={isReviewLoading}
              >
                {isReviewLoading ? (
                  <ActivityIndicator color="#92400E" />
                ) : (
                  <Text className="text-[15px] font-extrabold text-amber-800">
                    {t("onboarding.review.cta")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View className="mt-8" style={{ gap: 10 }}>
          {step > 0 && step < STEP_COUNT ? (
            <TouchableOpacity
              className="h-11 items-center justify-center rounded-xl border border-slate-200 bg-white"
              onPress={() => setStep((prev) => Math.max(prev - 1, 0))}
              activeOpacity={0.85}
            >
              <Text className="text-[14px] font-semibold text-slate-700">
                {t("onboarding.actions.back")}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            className="h-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "#0B57D0",
              opacity: canContinue ? 1 : 0.55,
            }}
            activeOpacity={canContinue ? 0.85 : 1}
            onPress={() => {
              if (!canContinue) return;
              if (step === 3) {
                submitOnboarding();
                return;
              }
              setStep((prev) => Math.min(prev + 1, STEP_COUNT - 1));
            }}
            disabled={!canContinue}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-[16px] font-extrabold text-white">
                {step === 3
                  ? t("onboarding.actions.finish")
                  : t("onboarding.actions.continue")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
