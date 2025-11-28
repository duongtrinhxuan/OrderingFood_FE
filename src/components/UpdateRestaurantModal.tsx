import React, { useState, useEffect, useCallback } from "react";
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

interface UpdateRestaurantModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurant: {
    id: number;
    name: string;
    imageUrl?: string;
    phone?: string;
    openTime?: string;
    closeTime?: string;
    status?: number;
  };
}

type RestaurantCategory = {
  id: number;
  name: string;
  isActive: boolean;
};

type CategoryRestaurantMap = {
  id: number;
  restaurantId: number;
  categoryId: number;
  isActive: boolean;
  category?: RestaurantCategory;
};

const UpdateRestaurantModal: React.FC<UpdateRestaurantModalProps> = ({
  visible,
  onClose,
  onSuccess,
  restaurant,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [categoryMaps, setCategoryMaps] = useState<CategoryRestaurantMap[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [form, setForm] = useState({
    name: restaurant.name || "",
    imageUrl: restaurant.imageUrl || "",
    phone: restaurant.phone || "",
    openTime: restaurant.openTime || "",
    closeTime: restaurant.closeTime || "",
    status: restaurant.status || 1,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.getRestaurantCategories();
      setCategories(data as RestaurantCategory[]);
    } catch (error: any) {
      console.error("Error fetching restaurant categories:", error);
    }
  }, []);

  const fetchCategoryMaps = useCallback(async () => {
    if (!restaurant.id) return;
    try {
      const data = await api.getCategoryRestaurantMapsByRestaurant(
        restaurant.id
      );
      const maps = data as CategoryRestaurantMap[];
      setCategoryMaps(maps);
      // Load selected categories (only active ones)
      const activeCategoryIds = maps
        .filter((map) => map.isActive)
        .map((map) => map.categoryId);
      setSelectedCategories(activeCategoryIds);
    } catch (error: any) {
      console.error("Error fetching category maps:", error);
    }
  }, [restaurant.id]);

  useEffect(() => {
    if (visible && restaurant) {
      setForm({
        name: restaurant.name || "",
        imageUrl: restaurant.imageUrl || "",
        phone: restaurant.phone || "",
        openTime: restaurant.openTime || "",
        closeTime: restaurant.closeTime || "",
        status: restaurant.status || 1,
      });
      fetchCategories();
      fetchCategoryMaps();
    }
  }, [visible, restaurant, fetchCategories, fetchCategoryMaps]);

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
    return true;
  };

  const handleToggleCategory = (categoryId: number) => {
    const isSelected = selectedCategories.includes(categoryId);
    setSelectedCategories((prev) =>
      isSelected
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Cập nhật thông tin nhà hàng
      await api.updateRestaurant(restaurant.id, {
        name: form.name,
        imageUrl: form.imageUrl || undefined,
        phone: form.phone,
        openTime: form.openTime,
        closeTime: form.closeTime,
        status: form.status,
      });

      // Xử lý category-restaurant-maps
      const previousActiveCategoryIds = categoryMaps
        .filter((map) => map.isActive)
        .map((map) => map.categoryId);

      // Tìm các category cần activate (có trong selectedCategories nhưng không có trong previousActiveCategoryIds)
      const toActivate = selectedCategories.filter(
        (id) => !previousActiveCategoryIds.includes(id)
      );

      // Tìm các category cần deactivate (có trong previousActiveCategoryIds nhưng không có trong selectedCategories)
      const toDeactivate = previousActiveCategoryIds.filter(
        (id) => !selectedCategories.includes(id)
      );

      // Activate categories
      for (const categoryId of toActivate) {
        try {
          await api.updateCategoryRestaurantMapIsActive(
            restaurant.id,
            categoryId,
            true
          );
        } catch (error) {
          console.error("Error activating category:", error);
        }
      }

      // Deactivate categories
      for (const categoryId of toDeactivate) {
        try {
          await api.updateCategoryRestaurantMapIsActive(
            restaurant.id,
            categoryId,
            false
          );
        } catch (error) {
          console.error("Error deactivating category:", error);
        }
      }

      Alert.alert("Thành công", "Thông tin nhà hàng đã được cập nhật.");
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể cập nhật nhà hàng. Vui lòng thử lại."
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
            <Text style={styles.modalTitle}>Cập nhật thông tin nhà hàng</Text>
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

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.label}>Trạng thái *</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    form.status === 1 && styles.selectedStatusOption,
                  ]}
                  onPress={() => handleChange("status", 1)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      form.status === 1 && styles.selectedStatusOptionText,
                    ]}
                  >
                    Đang hoạt động
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    form.status === 2 && styles.selectedStatusOption,
                  ]}
                  onPress={() => handleChange("status", 2)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      form.status === 2 && styles.selectedStatusOptionText,
                    ]}
                  >
                    Đã đóng cửa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Restaurant Categories */}
            <View style={styles.section}>
              <Text style={styles.label}>Danh mục nhà hàng</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.selectedCategoryChip,
                      ]}
                      onPress={() => handleToggleCategory(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.selectedCategoryChipText,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness * 2,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
  },
  selectedCategoryChipText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  statusOption: {
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
  selectedStatusOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusOptionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  selectedStatusOptionText: {
    color: theme.colors.surface,
    fontWeight: "600",
  },
});

export default UpdateRestaurantModal;
