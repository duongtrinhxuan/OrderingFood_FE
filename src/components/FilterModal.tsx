import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../theme/theme";
import CategoryChip from "./CategoryChip";
import { api } from "../services/api";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (filters: {
    query: string;
    type: "product" | "restaurant" | null;
    categoryIds: number[];
  }) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<
    "product" | "restaurant" | null
  >(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State để filter categories real-time theo searchQuery
  const [filteredProductCategories, setFilteredProductCategories] = useState<
    any[]
  >([]);
  const [filteredRestaurantCategories, setFilteredRestaurantCategories] =
    useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // Filter categories real-time theo searchQuery (giống thanh tìm kiếm bên ngoài)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    if (trimmedQuery === "") {
      setFilteredProductCategories(productCategories);
      setFilteredRestaurantCategories(restaurantCategories);
    } else {
      // Filter product categories theo tên
      const filtered = productCategories.filter((category) => {
        const categoryName = (category.name || "").toLowerCase();
        return categoryName.includes(trimmedQuery);
      });
      setFilteredProductCategories(filtered);

      // Filter restaurant categories theo tên
      const filteredRest = restaurantCategories.filter((category) => {
        const categoryName = (category.name || "").toLowerCase();
        return categoryName.includes(trimmedQuery);
      });
      setFilteredRestaurantCategories(filteredRest);
    }
  }, [searchQuery, productCategories, restaurantCategories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [productCats, restaurantCats] = await Promise.all([
        api.getProductCategories(),
        api.getRestaurantCategories(),
      ]);
      const productCatsArray = productCats as any[];
      const restaurantCatsArray = restaurantCats as any[];
      setProductCategories(productCatsArray);
      setRestaurantCategories(restaurantCatsArray);
      // Khởi tạo filtered categories
      setFilteredProductCategories(productCatsArray);
      setFilteredRestaurantCategories(restaurantCatsArray);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      query: searchQuery.trim(),
      type: selectedType,
      categoryIds: selectedCategoryIds,
    });
    onClose();
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedType(null);
    setSelectedCategoryIds([]);
    // Gọi onConfirm với filters rỗng để reset trang tìm kiếm
    onConfirm({
      query: "",
      type: null,
      categoryIds: [],
    });
  };

  const currentCategories =
    selectedType === "product"
      ? filteredProductCategories
      : filteredRestaurantCategories;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tìm kiếm nâng cao</Text>
            <TouchableOpacity
              onPress={() => {
                // Reset filters khi đóng modal
                onConfirm({
                  query: "",
                  type: null,
                  categoryIds: [],
                });
                onClose();
              }}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            {/* Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Loại tìm kiếm</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === "product" && styles.typeButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedType("product");
                    setSelectedCategoryIds([]);
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === "product" &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    Món ăn
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    selectedType === "restaurant" && styles.typeButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedType("restaurant");
                    setSelectedCategoryIds([]);
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === "restaurant" &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    Nhà hàng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories */}
            {selectedType && currentCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {selectedType === "product"
                    ? "Danh mục món ăn"
                    : "Danh mục nhà hàng"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  {currentCategories.map((category) => (
                    <CategoryChip
                      key={category.id}
                      title={category.name}
                      isSelected={selectedCategoryIds.includes(category.id)}
                      onPress={() =>
                        setSelectedCategoryIds((prev) =>
                          prev.includes(category.id)
                            ? prev.filter((id) => id !== category.id)
                            : [...prev, category.id]
                        )
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                Xác nhận tìm kiếm nâng cao
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    maxHeight: "90%",
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  typeContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: "center",
  },
  typeButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  typeButtonTextSelected: {
    color: theme.colors.surface,
  },
  categoriesContainer: {
    paddingVertical: theme.spacing.sm,
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.mediumGray,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.surface,
  },
});

export default FilterModal;
