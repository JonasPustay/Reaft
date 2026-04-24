import { forwardRef, useCallback, useImperativeHandle } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const IMAGE_MEDIA_TYPES =
  ImagePicker.MediaType?.Images ??
  ImagePicker.MediaTypeOptions?.Images ??
  "images";

const AddDefectPhotoPicker = forwardRef(function AddDefectPhotoPicker(
  { onPhotoSelected },
  ref,
) {
  const { t } = useTranslation();

  const notifyPhotoSelected = useCallback(
    async (asset) => {
      if (!asset?.uri) return;
      await onPhotoSelected({
        uri: asset.uri,
        base64: asset.base64 ?? null,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    },
    [onPhotoSelected],
  );

  const pickPhotoFromCamera = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: IMAGE_MEDIA_TYPES,
        quality: 0.9,
        base64: true,
      });

      if (result.canceled) return;
      await notifyPhotoSelected(result.assets?.[0]);
    } catch (error) {
      console.log("Unable to open camera", error);
    }
  }, [notifyPhotoSelected]);

  const pickPhotoFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("buildingDetail.permissionDeniedTitle"),
          t("buildingDetail.galleryPermissionRequired"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGE_MEDIA_TYPES,
        quality: 0.9,
        base64: true,
      });

      if (result.canceled) return;
      await notifyPhotoSelected(result.assets?.[0]);
    } catch (error) {
      console.log("Unable to open image library", error);
    }
  }, [notifyPhotoSelected, t]);

  const open = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("buildingDetail.permissionDeniedTitle"),
          t("buildingDetail.cameraPermissionRequired"),
        );
        return;
      }

      Alert.alert(
        t("buildingDetail.imageSourceTitle"),
        t("buildingDetail.imageSourceMessage"),
        [
          {
            text: t("buildingDetail.takePhoto"),
            onPress: () => {
              pickPhotoFromCamera();
            },
          },
          {
            text: t("buildingDetail.chooseFromGallery"),
            onPress: () => {
              pickPhotoFromGallery();
            },
          },
          {
            text: t("buildingDetail.cancel"),
            style: "destructive",
          },
        ],
      );
    } catch (error) {
      console.log("Unable to request camera permission", error);
    }
  }, [pickPhotoFromCamera, pickPhotoFromGallery, t]);

  useImperativeHandle(ref, () => ({ open }), [open]);

  return null;
});

AddDefectPhotoPicker.propTypes = {
  onPhotoSelected: PropTypes.func,
};

AddDefectPhotoPicker.defaultProps = {
  onPhotoSelected: () => undefined,
};

export default AddDefectPhotoPicker;
