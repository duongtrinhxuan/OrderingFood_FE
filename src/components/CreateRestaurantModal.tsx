import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme/theme";
import { api, API_BASE_URL } from "../services/api";

interface CreateRestaurantModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPhone?: string;
  userId: number;
}

const CreateRestaurantModal: React.FC<CreateRestaurantModalProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultPhone = "",
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    imageUrl: "",
    phone: defaultPhone,
    openTime: "",
    closeTime: "",
    // Address fields
    label: "",
    province: "",
    district: "",
    ward: "",
    street: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    if (visible) {
      setForm((prev) => ({ ...prev, phone: defaultPhone }));
    }
  }, [visible, defaultPhone]);

  const handleChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Ứng dụng cần quyền truy cập ảnh để upload ảnh nhà hàng."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [16, 9],
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploadingImage(true);
      const uploadResult = await api.uploadAvatar(result.assets[0].uri);
      let imageUrl = uploadResult.url;

      // Sửa URL nếu có localhost
      if (imageUrl.includes("localhost") || imageUrl.includes("127.0.0.1")) {
        const urlPath = imageUrl.split("/uploads/")[1];
        imageUrl = `${API_BASE_URL}/uploads/${urlPath}`;
      }

      handleChange("imageUrl", imageUrl);
      Alert.alert("Thành công", "Ảnh đã được upload.");
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể upload ảnh.");
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nhà hàng.");
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại.");
      return false;
    }
    if (!form.openTime.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập giờ mở cửa.");
      return false;
    }
    if (!form.closeTime.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập giờ đóng cửa.");
      return false;
    }
    if (!form.label.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nhãn địa chỉ.");
      return false;
    }
    if (!form.province.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tỉnh/thành phố.");
      return false;
    }
    if (!form.district.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập quận/huyện.");
      return false;
    }
    if (!form.ward.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập phường/xã.");
      return false;
    }
    if (!form.street.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đường/phố.");
      return false;
    }
    if (!form.latitude || !form.longitude) {
      Alert.alert("Lỗi", "Vui lòng nhập vĩ độ và kinh độ.");
      return false;
    }
    if (form.latitude < -90 || form.latitude > 90) {
      Alert.alert("Lỗi", "Vĩ độ phải trong khoảng -90 đến 90.");
      return false;
    }
    if (form.longitude < -180 || form.longitude > 180) {
      Alert.alert("Lỗi", "Kinh độ phải trong khoảng -180 đến 180.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Tạo address trước
      const address = await api.createAddress({
        label: form.label,
        province: form.province,
        district: form.district,
        ward: form.ward,
        street: form.street,
        latitude: form.latitude,
        longitude: form.longitude,
        isDefault: false,
        isActive: true,
      });

      // Tạo restaurant với addressId
      await api.createRestaurant({
        name: form.name,
        imageUrl: form.imageUrl || undefined,
        phone: form.phone,
        openTime: form.openTime,
        closeTime: form.closeTime,
        status: 1,
        userId: userId,
        addressId: address.id,
        isActive: true,
      });

      Alert.alert("Thành công", "Nhà hàng đã được tạo thành công.");
      onSuccess();
      onClose();
      // Reset form
      setForm({
        name: "",
        imageUrl: "",
        phone: defaultPhone,
        openTime: "",
        closeTime: "",
        label: "",
        province: "",
        district: "",
        ward: "",
        street: "",
        latitude: 0,
        longitude: 0,
      });
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể tạo nhà hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("CreateRestaurantModal visible:", visible);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tạo nhà hàng mới</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Restaurant Image */}
            <View style={styles.section}>
              <Text style={styles.label}>Ảnh nhà hàng</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {form.imageUrl ? (
                  <Image
                    source={{ uri: form.imageUrl }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    {uploadingImage ? (
                      <ActivityIndicator color={theme.colors.primary} />
                    ) : (
                      <>
                        <Icon
                          name="add-photo-alternate"
                          size={32}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.imagePlaceholderText}>
                          Chọn ảnh nhà hàng
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Restaurant Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Tên nhà hàng *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên nhà hàng"
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
              />
            </View>

            {/* Phone */}
            <View style={styles.section}>
              <Text style={styles.label}>Số điện thoại *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                value={form.phone}
                onChangeText={(text) => handleChange("phone", text)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Open Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Giờ mở cửa *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 08:00"
                value={form.openTime}
                onChangeText={(text) => handleChange("openTime", text)}
              />
            </View>

            {/* Close Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Giờ đóng cửa *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 22:00"
                value={form.closeTime}
                onChangeText={(text) => handleChange("closeTime", text)}
              />
            </View>

            {/* Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin địa chỉ</Text>

              {/* Coordinates Input */}
              <View style={styles.coordinatesRow}>
                <View style={styles.coordinateInput}>
                  <Text style={styles.label}>Vĩ độ (Latitude) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: 10.762622"
                    value={form.latitude ? form.latitude.toString() : ""}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 0;
                      handleChange("latitude", num);
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.coordinateInput}>
                  <Text style={styles.label}>Kinh độ (Longitude) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: 106.660172"
                    value={form.longitude ? form.longitude.toString() : ""}
                    onChangeText={(text) => {
                      const num = parseFloat(text) || 0;
                      handleChange("longitude", num);
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Address Label */}
              <Text style={styles.label}>Nhãn địa chỉ *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Trụ sở chính"
                value={form.label}
                onChangeText={(text) => handleChange("label", text)}
              />

              {/* Province */}
              <Text style={styles.label}>Tỉnh/Thành phố *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tỉnh/thành phố"
                value={form.province}
                onChangeText={(text) => handleChange("province", text)}
              />

              {/* District */}
              <Text style={styles.label}>Quận/Huyện *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập quận/huyện"
                value={form.district}
                onChangeText={(text) => handleChange("district", text)}
              />

              {/* Ward */}
              <Text style={styles.label}>Phường/Xã *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập phường/xã"
                value={form.ward}
                onChangeText={(text) => handleChange("ward", text)}
              />

              {/* Street */}
              <Text style={styles.label}>Đường/Phố *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập đường/phố"
                value={form.street}
                onChangeText={(text) => handleChange("street", text)}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>Tạo nhà hàng</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "90%",
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  imagePicker: {
    marginTop: theme.spacing.xs,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: theme.roundness,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: theme.roundness,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  imagePlaceholderText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mediumGray,
    fontSize: 14,
  },
  coordinatesRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  coordinateInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateRestaurantModal;
