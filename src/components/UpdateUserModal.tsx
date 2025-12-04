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
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme/theme";
import { api, buildImageUrl } from "../services/api";

interface UpdateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: number;
    email: string;
    username: string;
    phone?: string;
    gender?: string;
    avatar?: string;
  };
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({
  visible,
  onClose,
  onSuccess,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    email: user.email || "",
    username: user.username || "",
    phone: user.phone || "",
    gender: user.gender || "male",
    avatar: user.avatar || "",
  });

  useEffect(() => {
    if (visible && user) {
      setForm({
        email: user.email || "",
        username: user.username || "",
        phone: user.phone || "",
        gender: user.gender || "male",
        avatar: user.avatar || "",
      });
    }
  }, [visible, user]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Ứng dụng cần quyền truy cập ảnh để upload ảnh đại diện."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        try {
          const uploadResult = await api.uploadAvatar(result.assets[0].uri);
          // Backend trả về path tương đối, lưu nguyên path
          handleChange("avatar", uploadResult.url);
          Alert.alert("Thành công", "Ảnh đại diện đã được tải lên.");
        } catch (error: any) {
          console.error("Upload avatar error:", error);
          Alert.alert(
            "Lỗi",
            error?.message || "Không thể upload ảnh. Vui lòng thử lại."
          );
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      console.error("Image picker error:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email.");
      return false;
    }
    if (!form.username.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên người dùng.");
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại.");
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

      // Prepare update payload
      const updatePayload = {
        email: form.email,
        username: form.username,
        phone: form.phone,
        gender: form.gender,
        avatar: form.avatar,
      };

      await api.updateUser(user.id, updatePayload);

      Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating user:", error);
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể cập nhật thông tin. Vui lòng thử lại."
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
            <Text style={styles.modalTitle}>Cập nhật thông tin cá nhân</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View style={styles.section}>
              <Text style={styles.label}>Ảnh đại diện</Text>
              <View style={styles.avatarSection}>
                <Image
                  source={{
                    uri:
                      buildImageUrl(form.avatar) ||
                      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?fit=crop&w=200&h=200",
                  }}
                  style={styles.avatarPreview}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={theme.colors.primary} />
                  ) : (
                    <>
                      <Icon
                        name="camera-alt"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Email */}
            <View style={styles.section}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Username */}
            <View style={styles.section}>
              <Text style={styles.label}>Tên người dùng *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên người dùng"
                value={form.username}
                onChangeText={(text) => handleChange("username", text)}
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

            {/* Gender */}
            <View style={styles.section}>
              <Text style={styles.label}>Giới tính *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    form.gender === "male" && styles.selectedGenderOption,
                  ]}
                  onPress={() => handleChange("gender", "male")}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      form.gender === "male" && styles.selectedGenderOptionText,
                    ]}
                  >
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    form.gender === "female" && styles.selectedGenderOption,
                  ]}
                  onPress={() => handleChange("gender", "female")}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      form.gender === "female" &&
                        styles.selectedGenderOptionText,
                    ]}
                  >
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
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
  avatarSection: {
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  genderContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  genderOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedGenderOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  selectedGenderOptionText: {
    color: theme.colors.surface,
    fontWeight: "600",
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
});

export default UpdateUserModal;
