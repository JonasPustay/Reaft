import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const OPEN_ANIMATION_MS = 260;
const CLOSE_ANIMATION_MS = 220;
const CLOSE_FALLBACK_EXTRA_MS = 140;

export default function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight = 0.9,
  dismissOnOverlayPress = true,
  enablePanDownToClose = true,
  overlayOpacity = 0.5,
  avoidKeyboard = true,
  headerComponent = null,
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlay = useRef(new Animated.Value(0)).current;
  const [renderSheet, setRenderSheet] = useState(visible);
  const closeFallbackRef = useRef(null);

  const sheetHeight = SCREEN_HEIGHT * maxHeight;
  const clearCloseFallback = useCallback(() => {
    if (closeFallbackRef.current) {
      clearTimeout(closeFallbackRef.current);
      closeFallbackRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearCloseFallback();

    if (visible) {
      setRenderSheet(true);
      translateY.stopAnimation();
      overlay.stopAnimation();
      translateY.setValue(sheetHeight);
      overlay.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: OPEN_ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: overlayOpacity,
          duration: OPEN_ANIMATION_MS,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (renderSheet) {
      const closeAnimation = Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration: CLOSE_ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 0,
          duration: CLOSE_ANIMATION_MS,
          useNativeDriver: false,
        }),
      ]);

      closeFallbackRef.current = setTimeout(() => {
        setRenderSheet(false);
        closeFallbackRef.current = null;
      }, CLOSE_ANIMATION_MS + CLOSE_FALLBACK_EXTRA_MS);

      closeAnimation.start(() => {
        clearCloseFallback();
        setRenderSheet(false);
      });

      return () => {
        closeAnimation.stop();
      };
    }
    return undefined;
  }, [
    clearCloseFallback,
    visible,
    overlay,
    translateY,
    sheetHeight,
    overlayOpacity,
    renderSheet,
  ]);

  useEffect(
    () => () => {
      clearCloseFallback();
    },
    [clearCloseFallback],
  );

  const requestClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  const panResponder = useMemo(() => {
    if (!enablePanDownToClose) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 6,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) {
          translateY.setValue(dy);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 120 || vy > 0.8) {
          requestClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }, [enablePanDownToClose, translateY, requestClose]);

  if (!renderSheet) return null;

  const dragPanHandlers = panResponder ? panResponder.panHandlers : {};

  return (
    <View style={styles.portal} pointerEvents={visible ? "auto" : "none"}>
      <View style={styles.wrapper}>
        <TouchableWithoutFeedback
          onPress={dismissOnOverlayPress ? requestClose : undefined}
        >
          <Animated.View style={[styles.overlay, { opacity: overlay }]} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={
            avoidKeyboard && Platform.OS === "ios" ? "padding" : undefined
          }
          style={styles.flexEnd}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: sheetHeight, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.dragArea} {...dragPanHandlers}>
              <View style={styles.dragIndicatorWrapper}>
                <View style={styles.dragIndicator} />
              </View>
              {headerComponent ? (
                <View style={styles.headerContainer}>{headerComponent}</View>
              ) : null}
            </View>
            <View
              style={[
                styles.contentContainer,
                headerComponent
                  ? styles.contentContainerWithHeader
                  : styles.contentContainerWithoutHeader,
              ]}
            >
              {children}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

BottomSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  maxHeight: PropTypes.number,
  dismissOnOverlayPress: PropTypes.bool,
  enablePanDownToClose: PropTypes.bool,
  overlayOpacity: PropTypes.number,
  avoidKeyboard: PropTypes.bool,
  headerComponent: PropTypes.node,
};

BottomSheet.defaultProps = {
  children: null,
  maxHeight: 0.9,
  dismissOnOverlayPress: true,
  enablePanDownToClose: true,
  overlayOpacity: 0.5,
  avoidKeyboard: true,
  headerComponent: null,
};

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    width: "100%",
  },
  flexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dragArea: {
    paddingTop: 12,
  },
  dragIndicatorWrapper: {
    alignItems: "center",
  },
  dragIndicator: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contentContainerWithHeader: {
    paddingTop: 8,
  },
  contentContainerWithoutHeader: {
    paddingTop: 16,
  },
});
