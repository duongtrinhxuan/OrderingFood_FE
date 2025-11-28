import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { theme } from "../theme/theme";
import { api } from "../services/api";

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    latitude: number;
    longitude: number;
    province: string;
    district: string;
    ward: string;
  }) => void;
  initialLocation?: { latitude: number; longitude: number };
}

const MapPicker: React.FC<MapPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [region, setRegion] = useState({
    latitude: 10.762622, // Mặc định: TP.HCM
    longitude: 106.660172,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);

  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        setRegion({
          ...initialLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        getCurrentLocation();
      }
    }
  }, [
    visible,
    initialLocation?.latitude,
    initialLocation?.longitude,
    getCurrentLocation,
  ]);

  const getCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập vị trí bị từ chối",
        "Ứng dụng cần quyền truy cập vị trí để hiển thị bản đồ."
      );
      return;
    }

    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirm = async () => {
    if (!selectedLocation) {
      Alert.alert("Lỗi", "Vui lòng chọn một vị trí trên bản đồ.");
      return;
    }

    try {
      setLoadingAddress(true);
      const geocodeResult = await api.reverseGeocode(
        selectedLocation.latitude,
        selectedLocation.longitude
      );

      onSelectLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        province: geocodeResult.province,
        district: geocodeResult.district,
        ward: geocodeResult.ward,
      });

      onClose();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể lấy thông tin địa chỉ. Vui lòng thử lại."
      );
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleOpenInGoogleMaps = async () => {
    if (!selectedLocation) {
      Alert.alert("Lỗi", "Vui lòng chọn một vị trí trên bản đồ trước.");
      return;
    }

    const { latitude, longitude } = selectedLocation;

    // Deep link ưu tiên app Google Maps (đặc biệt trên iOS), fallback sang URL web
    const googleMapsAppUrl = Platform.select({
      ios: `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=16`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    const googleMapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      if (
        googleMapsAppUrl &&
        (Platform.OS === "ios" || Platform.OS === "android")
      ) {
        const canOpenApp = await Linking.canOpenURL(googleMapsAppUrl);
        if (canOpenApp) {
          await Linking.openURL(googleMapsAppUrl);
          return;
        }
      }
      await Linking.openURL(googleMapsWebUrl);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể mở Google Maps trên thiết bị. Vui lòng kiểm tra lại."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn vị trí trên bản đồ</Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            style={styles.locationButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon name="my-location" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={(e) => {
                setSelectedLocation(e.nativeEvent.coordinate);
              }}
            />
          )}
        </MapView>

        <View style={styles.footer}>
          <View style={styles.infoBox}>
            <Icon name="info" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Chạm vào bản đồ để chọn vị trí hoặc kéo marker để di chuyển
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.openMapsButton,
              !selectedLocation && styles.openMapsButtonDisabled,
            ]}
            onPress={handleOpenInGoogleMaps}
            disabled={!selectedLocation}
          >
            <Icon
              name="map"
              size={18}
              color={theme.colors.surface}
              style={{ marginRight: theme.spacing.xs }}
            />
            <Text style={styles.openMapsButtonText}>Mở bằng Google Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (loadingAddress || !selectedLocation) &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={loadingAddress || !selectedLocation}
          >
            {loadingAddress ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={styles.confirmButtonText}>Xác nhận vị trí</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 2,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
    marginHorizontal: theme.spacing.md,
  },
  locationButton: {
    padding: theme.spacing.xs,
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  openMapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  openMapsButtonDisabled: {
    opacity: 0.5,
  },
  openMapsButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MapPicker;
