import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const PHRASE_INTERVAL_MS = 3000;
const PROGRESS_INTERVAL_MS = 180;
const MAX_PENDING_PROGRESS = 96;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getProgressStep(progress) {
  if (progress < 25) return Math.random() * 3 + 1.2;
  if (progress < 55) return Math.random() * 2 + 0.8;
  if (progress < 80) return Math.random() * 1.2 + 0.4;
  return Math.random() * 0.7 + 0.15;
}

function pickNextPhraseIndex(length, previousIndex) {
  if (length <= 1) return 0;
  let nextIndex = previousIndex;
  while (nextIndex === previousIndex) {
    nextIndex = Math.floor(Math.random() * length);
  }
  return nextIndex;
}

export default function DefectAnalysisLoadingModal({ visible }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const phrases = useMemo(
    () => [
      t("defectAnalysisLoading.phraseInspectingSurface"),
      t("defectAnalysisLoading.phraseCheckingDamageType"),
      t("defectAnalysisLoading.phraseEstimatingRepairCost"),
      t("defectAnalysisLoading.phraseCrossCheckingResult"),
    ],
    [t],
  );

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      setPhraseIndex(0);
      animatedProgress.setValue(0);
      return;
    }

    setProgress(4);
    setPhraseIndex(Math.floor(Math.random() * phrases.length));

    const progressTimer = setInterval(() => {
      setProgress((current) => {
        if (current >= MAX_PENDING_PROGRESS) {
          return current;
        }
        const next = current + getProgressStep(current);
        return clamp(next, 0, MAX_PENDING_PROGRESS);
      });
    }, PROGRESS_INTERVAL_MS);

    const phraseTimer = setInterval(() => {
      setPhraseIndex((previousIndex) =>
        pickNextPhraseIndex(phrases.length, previousIndex),
      );
    }, PHRASE_INTERVAL_MS);

    return () => {
      clearInterval(progressTimer);
      clearInterval(phraseTimer);
    };
  }, [animatedProgress, phrases.length, visible]);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text className="text-lg font-semibold text-gray-900 text-center">
          {t("defectAnalysisLoading.title")}
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          {t("defectAnalysisLoading.subtitle")}
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View
            style={{
              width: progressWidth,
              height: "100%",
              backgroundColor: "#2563eb",
            }}
          />
        </View>

        <Text className="text-sm font-semibold text-blue-700 text-right mt-2">
          {Math.round(progress)}%
        </Text>

        <Text className="text-sm text-gray-700 mt-4 text-center" style={styles.phrase}>
          {phrases[phraseIndex] ?? phrases[0]}
        </Text>

        <Text className="text-xs text-amber-700 mt-4 text-center">
          {t("defectAnalysisLoading.warning")}
        </Text>
      </View>
    </View>
  );
}

DefectAnalysisLoadingModal.propTypes = {
  visible: PropTypes.bool,
};

DefectAnalysisLoadingModal.defaultProps = {
  visible: false,
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 1000,
    elevation: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  progressTrack: {
    marginTop: 24,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    overflow: "hidden",
  },
  phrase: {
    minHeight: 40,
  },
});
