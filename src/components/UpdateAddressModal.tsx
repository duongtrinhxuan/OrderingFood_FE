import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import { api } from "../services/api";

interface UpdateAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  address: {
    id: number;
    label: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
  };
  userId?: number;
  existingAddresses?: Array<{
    address: {
      isDefault: boolean;
    };
  }>;
}

const UpdateAddressModal: React.FC<UpdateAddressModalProps> = ({
  visible,
  onClose,
  onSuccess,
  address,
  userId,
  existingAddresses = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    label: address.label || "",
    province: address.province || "",
    district: address.district || "",
    ward: address.ward || "",
    street: address.street || "",
    latitude: address.latitude || 0,
    longitude: address.longitude || 0,
    isDefault: address.isDefault || false,
  });

  useEffect(() => {
    if (visible && address) {
      setForm({
        label: address.label || "",
        province: address.province || "",
        district: address.district || "",
        ward: address.ward || "",
        street: address.street || "",
        latitude: address.latitude || 0,
        longitude: address.longitude || 0,
        isDefault: address.isDefault || false,
      });
    }
  }, [visible, address]);

  const handleChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
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

      // If setting as default and there are other addresses, update them
      if (form.isDefault && userId && existingAddresses.length > 0) {
        const otherDefaultAddresses = existingAddresses.filter(
          (addr) =>
            (addr as any).addressId !== address.id && addr.address.isDefault
        );

        for (const addr of otherDefaultAddresses) {
          await api.updateAddress((addr as any).addressId, {
            isDefault: false,
          });
        }
      }

      await api.updateAddress(address.id, {
        label: form.label,
        province: form.province,
        district: form.district,
        ward: form.ward,
        street: form.street,
        latitude: form.latitude,
        longitude: form.longitude,
        isDefault: form.isDefault,
      });

      Alert.alert("Thành công", "Địa chỉ đã được cập nhật.");
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể cập nhật địa chỉ. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>Cập nhật địa chỉ nhà hàng</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Coordinates Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tọa độ</Text>
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
            </View>

            {/* Address Label */}
            <View style={styles.section}>
              <Text style={styles.label}>Nhãn địa chỉ *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Trụ sở chính"
                value={form.label}
                onChangeText={(text) => handleChange("label", text)}
              />
            </View>

            {/* Province */}
            <View style={styles.section}>
              <Text style={styles.label}>Tỉnh/Thành phố *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tỉnh/thành phố"
                value={form.province}
                onChangeText={(text) => handleChange("province", text)}
              />
            </View>

            {/* District */}
            <View style={styles.section}>
              <Text style={styles.label}>Quận/Huyện *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập quận/huyện"
                value={form.district}
                onChangeText={(text) => handleChange("district", text)}
              />
            </View>

            {/* Ward */}
            <View style={styles.section}>
              <Text style={styles.label}>Phường/Xã *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập phường/xã"
                value={form.ward}
                onChangeText={(text) => handleChange("ward", text)}
              />
            </View>

            {/* Street */}
            <View style={styles.section}>
              <Text style={styles.label}>Đường/Phố *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập đường/phố"
                value={form.street}
                onChangeText={(text) => handleChange("street", text)}
              />
            </View>

            {/* Is Default (only for customer addresses) */}
            {userId && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => handleChange("isDefault", !form.isDefault)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      form.isDefault && styles.checkboxChecked,
                    ]}
                  >
                    {form.isDefault && (
                      <Icon
                        name="check"
                        size={16}
                        color={theme.colors.surface}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Đặt làm địa chỉ mặc định
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                <Text style={styles.submitButtonText}>Lưu</Text>
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
    minHeight: 48,
  },
  coordinatesRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  coordinateInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    minHeight: 48,
    width: "100%",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness / 2,
    marginRight: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default UpdateAddressModal;
