import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";
import { formatDateTime } from "../utils/helpers";
import * as Location from "expo-location";

export interface OrderJourney {
  id: number;
  content?: string;
  latitude: number;
  longitude: number;
  timeline?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OrderJourneyModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: number;
  canEdit: boolean; // client: false, restaurant: true
}

const OrderJourneyModal: React.FC<OrderJourneyModalProps> = ({
  visible,
  onClose,
  orderId,
  canEdit,
}) => {
  const [journeys, setJourneys] = useState<OrderJourney[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [editingJourney, setEditingJourney] = useState<OrderJourney | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState("");
  const [timeline, setTimeline] = useState("");
  const [latitudeText, setLatitudeText] = useState("");
  const [longitudeText, setLongitudeText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressInfo, setAddressInfo] = useState<{
    province: string;
    district: string;
    ward: string;
    street: string;
  } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const loadJourneys = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await api.getOrderJourneys(orderId);
      const list = (data as OrderJourney[]) || [];
      // Sort by timeline, then by createdAt
      list.sort((a, b) => {
        if (a.timeline && b.timeline) {
          return a.timeline.localeCompare(b.timeline);
        }
        if (a.timeline) return -1;
        if (b.timeline) return 1;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
      setJourneys(list);
    } catch (error: any) {
      console.error("Error loading journeys:", error);
      Alert.alert("Lỗi", "Không thể tải hành trình đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (visible) {
      loadJourneys();
    }
  }, [visible, loadJourneys]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setLatitudeText(latitude.toFixed(6));
    setLongitudeText(longitude.toFixed(6));
    loadAddressFromCoordinates(latitude, longitude);
  };

  const loadAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setLoadingAddress(true);
      const geocodeResult = await api.reverseGeocode(lat, lng);
      setAddressInfo({
        province: geocodeResult.province || "",
        district: geocodeResult.district || "",
        ward: geocodeResult.ward || "",
        street: geocodeResult.street || "",
      });
    } catch (error: any) {
      console.error("Error loading address:", error);
      setAddressInfo(null);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleLatitudeChange = (text: string) => {
    setLatitudeText(text);
    const lat = parseFloat(text);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      const currentLng =
        selectedLocation?.longitude || parseFloat(longitudeText) || 0;
      if (!isNaN(currentLng)) {
        setSelectedLocation({ latitude: lat, longitude: currentLng });
        loadAddressFromCoordinates(lat, currentLng);
      }
    }
  };

  const handleLongitudeChange = (text: string) => {
    setLongitudeText(text);
    const lng = parseFloat(text);
    if (!isNaN(lng) && lng >= -180 && lng <= 180) {
      const currentLat =
        selectedLocation?.latitude || parseFloat(latitudeText) || 0;
      if (!isNaN(currentLat)) {
        setSelectedLocation({ latitude: currentLat, longitude: lng });
        loadAddressFromCoordinates(currentLat, lng);
      }
    }
  };

  const handleAddJourney = () => {
    setIsCreating(true);
    setEditingJourney(null);
    setContent("");
    setTimeline("");
    setLatitudeText("");
    setLongitudeText("");
    setSelectedLocation(null);
    setAddressInfo(null);
    setMapPickerVisible(true);
  };

  const handleEditJourney = (journey: OrderJourney) => {
    setEditingJourney(journey);
    setContent(journey.content || "");
    setTimeline(journey.timeline || "");
    setLatitudeText(journey.latitude.toFixed(6));
    setLongitudeText(journey.longitude.toFixed(6));
    setSelectedLocation({
      latitude: journey.latitude,
      longitude: journey.longitude,
    });
    setAddressInfo(null);
    loadAddressFromCoordinates(journey.latitude, journey.longitude);
    setMapPickerVisible(true);
  };

  const handleDeleteJourney = (journeyId: number) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa điểm hành trình này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteOrderJourney(journeyId);
            await loadJourneys();
          } catch (error: any) {
            Alert.alert("Lỗi", "Không thể xóa điểm hành trình.");
          }
        },
      },
    ]);
  };

  const handleSaveJourney = async () => {
    const lat = parseFloat(latitudeText);
    const lng = parseFloat(longitudeText);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Lỗi", "Vui lòng nhập vĩ độ và kinh độ hợp lệ.");
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert("Lỗi", "Vĩ độ phải nằm trong khoảng -90 đến 90.");
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert("Lỗi", "Kinh độ phải nằm trong khoảng -180 đến 180.");
      return;
    }

    const finalLocation = { latitude: lat, longitude: lng };

    try {
      if (isCreating) {
        const payload: any = {
          orderId,
          latitude: finalLocation.latitude,
          longtitude: finalLocation.longitude,
        };
        if (content.trim()) {
          payload.content = content.trim();
        }
        if (timeline.trim()) {
          payload.timeline = timeline.trim();
        }
        await api.createOrderJourney(payload);
      } else if (editingJourney) {
        const payload: any = {};
        if (content.trim()) {
          payload.content = content.trim();
        }
        if (timeline.trim()) {
          payload.timeline = timeline.trim();
        }
        payload.latitude = finalLocation.latitude;
        payload.longtitude = finalLocation.longitude;
        await api.updateOrderJourney(editingJourney.id, payload);
      }
      setMapPickerVisible(false);
      setEditingJourney(null);
      setIsCreating(false);
      setContent("");
      setTimeline("");
      setLatitudeText("");
      setLongitudeText("");
      setSelectedLocation(null);
      setAddressInfo(null);
      await loadJourneys();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể lưu điểm hành trình.");
    }
  };

  const coordinates = journeys.map((j) => ({
    latitude: j.latitude,
    longitude: j.longitude,
  }));

  // Calculate map region to fit all markers
  const getMapRegion = () => {
    if (coordinates.length === 0) {
      return {
        latitude: 10.762622,
        longitude: 106.660172,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = coordinates.map((c) => c.latitude);
    const lngs = coordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  const renderJourneyItem = ({ item }: { item: OrderJourney }) => (
    <View style={styles.journeyCard}>
      <View style={styles.journeyHeader}>
        <View style={styles.journeyInfo}>
          <Text style={styles.journeyTimeline}>
            {item.timeline || "Chưa có thời gian"}
          </Text>
          {item.createdAt && (
            <Text style={styles.journeyDate}>
              {formatDateTime(item.createdAt)}
            </Text>
          )}
        </View>
        {canEdit && (
          <View style={styles.journeyActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditJourney(item)}
            >
              <Icon name="edit" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteJourney(item.id)}
            >
              <Icon name="delete" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {item.content && (
        <Text style={styles.journeyContent}>{item.content}</Text>
      )}
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Hành trình đơn hàng</Text>
            <View style={{ width: 24 }} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  region={getMapRegion()}
                  showsUserLocation={false}
                >
                  {coordinates.length > 1 && (
                    <Polyline
                      coordinates={coordinates}
                      strokeColor={theme.colors.primary}
                      strokeWidth={3}
                    />
                  )}
                  {coordinates.map((coord, idx) => (
                    <Marker
                      key={idx}
                      coordinate={coord}
                      title={`Điểm ${idx + 1}`}
                    />
                  ))}
                </MapView>
              </View>

              <FlatList
                data={journeys}
                renderItem={renderJourneyItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="route"
                      size={48}
                      color={theme.colors.mediumGray}
                    />
                    <Text style={styles.emptyText}>Chưa có hành trình nào</Text>
                  </View>
                }
                ListFooterComponent={
                  canEdit ? (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={handleAddJourney}
                    >
                      <Icon
                        name="add-circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.addButtonText}>
                        Thêm điểm hành trình
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
            </>
          )}
        </View>
      </Modal>

      {/* Map Picker Modal for creating/editing */}
      {canEdit && (
        <Modal
          visible={mapPickerVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setMapPickerVisible(false);
            setEditingJourney(null);
            setIsCreating(false);
            setContent("");
            setTimeline("");
            setLatitudeText("");
            setLongitudeText("");
            setSelectedLocation(null);
            setAddressInfo(null);
          }}
        >
          <View style={styles.mapPickerContainer}>
            <View style={styles.mapPickerHeader}>
              <TouchableOpacity
                onPress={() => {
                  setMapPickerVisible(false);
                  setEditingJourney(null);
                  setIsCreating(false);
                  setContent("");
                  setTimeline("");
                  setSelectedLocation(null);
                }}
                style={styles.backButton}
              >
                <Icon name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.mapPickerTitle}>
                {isCreating ? "Thêm điểm hành trình" : "Chỉnh sửa hành trình"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.mapPickerMapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.mapPickerMap}
                region={
                  selectedLocation
                    ? {
                        ...selectedLocation,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }
                    : {
                        latitude: 10.762622,
                        longitude: 106.660172,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }
                }
                onPress={handleMapPress}
                showsUserLocation={true}
              >
                {selectedLocation && (
                  <Marker
                    coordinate={selectedLocation}
                    draggable
                    onDragEnd={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setSelectedLocation({ latitude, longitude });
                      setLatitudeText(latitude.toFixed(6));
                      setLongitudeText(longitude.toFixed(6));
                      loadAddressFromCoordinates(latitude, longitude);
                    }}
                  />
                )}
              </MapView>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vĩ độ (Latitude) *</Text>
                <TextInput
                  style={styles.input}
                  value={latitudeText}
                  onChangeText={handleLatitudeChange}
                  placeholder="VD: 10.762622"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kinh độ (Longitude) *</Text>
                <TextInput
                  style={styles.input}
                  value={longitudeText}
                  onChangeText={handleLongitudeChange}
                  placeholder="VD: 106.660172"
                  keyboardType="decimal-pad"
                />
              </View>

              {loadingAddress ? (
                <View style={styles.addressLoadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text style={styles.addressLoadingText}>
                    Đang tải thông tin địa chỉ...
                  </Text>
                </View>
              ) : addressInfo ? (
                <View style={styles.addressInfoContainer}>
                  <Text style={styles.addressInfoLabel}>
                    Thông tin địa chỉ:
                  </Text>
                  <Text style={styles.addressInfoText}>
                    {[
                      addressInfo.street,
                      addressInfo.ward,
                      addressInfo.district,
                      addressInfo.province,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nội dung (tùy chọn)</Text>
                <TextInput
                  style={styles.input}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Nhập nội dung mô tả điểm hành trình"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Thời gian (HH:mm) (tùy chọn)</Text>
                <TextInput
                  style={styles.input}
                  value={timeline}
                  onChangeText={setTimeline}
                  placeholder="VD: 14:30"
                  keyboardType="default"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!latitudeText || !longitudeText) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSaveJourney}
                disabled={!latitudeText || !longitudeText}
              >
                <Text style={styles.saveButtonText}>
                  {isCreating ? "Thêm điểm" : "Cập nhật"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
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
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 2,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    height: 300,
    width: "100%",
  },
  map: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  journeyCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  journeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xs,
  },
  journeyInfo: {
    flex: 1,
  },
  journeyTimeline: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  journeyDate: {
    fontSize: 12,
    color: theme.colors.mediumGray,
  },
  journeyActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  journeyContent: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  mapPickerContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  mapPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mapPickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  formContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.surface,
  },
  mapPickerMapContainer: {
    flex: 1,
    height: 400,
  },
  mapPickerMap: {
    flex: 1,
  },
  addressLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  addressLoadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.mediumGray,
  },
  addressInfoContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addressInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addressInfoText: {
    fontSize: 14,
    color: theme.colors.mediumGray,
    lineHeight: 20,
  },
});

export default OrderJourneyModal;
